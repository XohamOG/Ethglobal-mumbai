export const RPC_URL =
  process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || "https://ethereum-rpc.publicnode.com";

/** Chainlink BTC/USD mainnet heartbeat (seconds) per data.chain.link. */
const BTC_USD_HEARTBEAT_S = 3600;

async function rpc<T = string>(
  method: string,
  params: unknown[],
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal,
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "RPC error");
  return json.result as T;
}

const ethCall = (to: string, data: string, signal?: AbortSignal) =>
  rpc<string>("eth_call", [{ to, data }, "latest"], signal);

const word = (hex: string, i: number) => hex.slice(2 + i * 64, 2 + (i + 1) * 64);
const addr = (w: string) => "0x" + w.slice(24);
const pad = (a: string) => "0".repeat(24) + a.toLowerCase().replace(/^0x/, "");

export interface TrailResult {
  /** Decoded, human-readable result per step number (1-5). */
  values: Record<number, string>;
  errors: Record<number, string>;
}

/**
 * Re-runs the five audit eth_call / eth_getStorageAt queries live against
 * mainnet and decodes the responses.
 */
export async function runTrail(
  steps: Array<{ step: number; to: string; kind: "call" | "slot"; data: string }>,
  signal?: AbortSignal
): Promise<TrailResult> {
  const values: Record<number, string> = {};
  const errors: Record<number, string> = {};

  await Promise.all(
    steps.map(async (s) => {
      try {
        if (s.kind === "slot") {
          const raw = await rpc<string>("eth_getStorageAt", [s.to, s.data, "latest"], signal);
          values[s.step] = addr(word(raw, 0));
          return;
        }
        const raw = await ethCall(s.to, s.data, signal);
        switch (s.step) {
          case 1:
          case 4:
            values[s.step] = addr(word(raw, 0));
            break;
          case 3:
            values[s.step] = Number(BigInt("0x" + word(raw, 0))) === 1 ? "true" : "false";
            break;
          case 5: {
            const answer = BigInt.asIntN(256, BigInt("0x" + word(raw, 1)));
            const updatedAt = Number(BigInt("0x" + word(raw, 3)));
            const ageS = Math.max(0, Math.floor(Date.now() / 1000) - updatedAt);
            const price = Number(answer) / 1e8;
            values[s.step] =
              `Answer: $${price.toLocaleString("en-US", { maximumFractionDigits: 2 })} · ` +
              `Updated ${ageS}s ago · Heartbeat ${BTC_USD_HEARTBEAT_S}s · ` +
              `Staleness ${(ageS / BTC_USD_HEARTBEAT_S).toFixed(2)}`;
            break;
          }
          default:
            values[s.step] = raw;
        }
      } catch (e) {
        if (signal?.aborted) return;
        errors[s.step] = e instanceof Error ? e.message : String(e);
      }
    })
  );

  return { values, errors };
}

export { pad as padAddress };

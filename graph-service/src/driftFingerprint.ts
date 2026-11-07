import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ethers } from "ethers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Shared spec: the exact eth_calls whose results make up the drift fingerprint.
 * The Chainlink CRE workflow (cre/cre-project/fingerprint-drift-workflow) imports
 * the SAME file, so both sides compute an identical value.
 */
const SPEC_PATH = path.resolve(
  __dirname,
  "../../cre/cre-project/fingerprint-drift-workflow/fingerprint-spec.json"
);

export interface FingerprintRead {
  id: string;
  to: string;
  data: string;
}

export function loadFingerprintSpec(): { protocolId: string; reads: FingerprintRead[] } {
  return JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
}

/** keccak256 over sorted "<id>=<result>" lines (must match the CRE workflow). */
export function fingerprintFromResults(results: Record<string, string>): string {
  const lines = Object.keys(results)
    .sort()
    .map((id) => `${id}=${results[id].toLowerCase()}`)
    .join("\n");
  return ethers.keccak256(ethers.toUtf8Bytes(lines));
}

/**
 * Compute the drift fingerprint from live mainnet state at the finalized block.
 */
export async function computeDriftFingerprint(
  provider: ethers.JsonRpcProvider
): Promise<{ fingerprint: string; results: Record<string, string> }> {
  const spec = loadFingerprintSpec();
  const results: Record<string, string> = {};
  await Promise.all(
    spec.reads.map(async (r) => {
      results[r.id] = await provider.call({ to: r.to, data: r.data, blockTag: "finalized" });
    })
  );
  return { fingerprint: fingerprintFromResults(results), results };
}

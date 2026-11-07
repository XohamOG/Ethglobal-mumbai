import { ethers } from "ethers";

/**
 * Real on-chain / public-API enrichment for risk scoring.
 * Nothing here substitutes a default when a lookup fails: errors propagate so a
 * rebuild never records an invented "healthy" value.
 */

export interface SourcifyEnrichment {
  sourcifyStatus: "full_match" | "partial_match" | "not_found";
  contractName: string;
  /** Block the contract was created in (from Sourcify's verified deployment info) */
  deploymentBlock?: number;
}

export interface SafeEnrichment {
  isSafe: boolean;
  safeThreshold: number;
  safeOwnerCount: number;
  safeOwners: string[];
}

export interface OracleEnrichment {
  oracleStaleness: number; // ratio: age / heartbeat
  oracleHeartbeat: number; // seconds, inferred from observed update cadence
  latestPrice?: string;
  updatedAtBlockTimestamp?: number;
}

const FEED_ABI = [
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function getRoundData(uint80 _roundId) view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
];

const SAFE_ABI = [
  "function getThreshold() view returns (uint256)",
  "function getOwners() view returns (address[])",
];

const EXECUTOR_ABI = ["function owner() view returns (address)"];
const PAYLOADS_CONTROLLER_ABI = [
  "function getExecutorSettingsByAccessControl(uint8 accessControl) view returns (tuple(address executor, uint40 delay))",
];

/** Heartbeats used by Chainlink mainnet price feeds. */
const STANDARD_HEARTBEATS = [3600, 14400, 21600, 43200, 86400];
const ROUNDS_TO_SAMPLE = 30;
const SECONDS_PER_MONTH = 30.44 * 24 * 3600;

async function fetchJson(url: string, timeoutMs = 8000): Promise<{ status: number; body: any }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    let body: any = null;
    try {
      body = await res.json();
    } catch {}
    return { status: res.status, body };
  } finally {
    clearTimeout(t);
  }
}

export class NodeEnricher {
  private rpcProvider: ethers.JsonRpcProvider;
  private blockTimestampCache = new Map<number, number>();

  constructor(rpcUrl: string) {
    this.rpcProvider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Source verification + deployment block via Sourcify API v2.
   * 404 / null match = genuinely unverified. Network errors are retried, then thrown.
   */
  async enrichSourcify(address: string, chainId: string = "1"): Promise<SourcifyEnrichment> {
    const addr = ethers.getAddress(address);
    const url = `https://sourcify.dev/server/v2/contract/${chainId}/${addr}?fields=deployment,compilation`;

    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { status, body } = await fetchJson(url);
        if (status === 404 || (status === 200 && body && body.match == null)) {
          return { sourcifyStatus: "not_found", contractName: "" };
        }
        if (status !== 200) throw new Error(`Sourcify v2 responded ${status}`);
        const sourcifyStatus = body.match === "exact_match" ? "full_match" : "partial_match";
        const block = Number(body?.deployment?.blockNumber);
        return {
          sourcifyStatus,
          contractName: body?.compilation?.name || "",
          deploymentBlock: Number.isFinite(block) && block > 0 ? block : undefined,
        };
      } catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
    throw new Error(`Sourcify lookup failed for ${addr}: ${(lastErr as Error)?.message}`);
  }

  private async blockTimestamp(block: number): Promise<number> {
    const cached = this.blockTimestampCache.get(block);
    if (cached) return cached;
    const b = await this.rpcProvider.getBlock(block);
    if (!b) throw new Error(`Block ${block} not found`);
    this.blockTimestampCache.set(block, b.timestamp);
    return b.timestamp;
  }

  /** Real contract age in months from the verified deployment block's timestamp. */
  async contractAgeMonths(deploymentBlock: number): Promise<number> {
    const ts = await this.blockTimestamp(deploymentBlock);
    return Number(((Date.now() / 1000 - ts) / SECONDS_PER_MONTH).toFixed(1));
  }

  /** Safe multisig signer set + threshold read directly from the Safe contract. */
  async enrichSafeMultisig(address: string): Promise<SafeEnrichment> {
    const safe = new ethers.Contract(ethers.getAddress(address), SAFE_ABI, this.rpcProvider);
    const [threshold, owners] = await Promise.all([safe.getThreshold(), safe.getOwners()]);
    return {
      isSafe: true,
      safeThreshold: Number(threshold),
      safeOwnerCount: owners.length,
      safeOwners: [...owners],
    };
  }

  /**
   * Real execution delay (hours) imposed on a Governance V3 executor:
   * executor.owner() -> PayloadsController.getExecutorSettingsByAccessControl(level).
   * Throws if the controller does not list this executor, so a wrong address never yields a delay.
   */
  async executorDelayHours(executorAddress: string): Promise<number> {
    const executor = ethers.getAddress(executorAddress);
    const controllerAddr: string = await new ethers.Contract(executor, EXECUTOR_ABI, this.rpcProvider).owner();
    const controller = new ethers.Contract(controllerAddr, PAYLOADS_CONTROLLER_ABI, this.rpcProvider);
    for (const level of [1, 2]) {
      const s = await controller.getExecutorSettingsByAccessControl(level);
      if (ethers.getAddress(s.executor) === executor) return Number(s.delay) / 3600;
    }
    throw new Error(`PayloadsController ${controllerAddr} does not list ${executor} as an executor`);
  }

  /**
   * Chainlink feed freshness. Heartbeat is inferred from the feed's own recent rounds:
   * the largest gap between consecutive updates, rounded up to the next standard heartbeat.
   */
  async enrichOracleFeed(address: string): Promise<OracleEnrichment> {
    const feed = new ethers.Contract(ethers.getAddress(address), FEED_ABI, this.rpcProvider);
    const latest = await feed.latestRoundData();
    const latestId: bigint = latest[0];
    const latestUpdated = Number(latest[3]);

    const ids = Array.from({ length: ROUNDS_TO_SAMPLE }, (_, i) => latestId - BigInt(i));
    const rounds = await Promise.all(
      ids.map((id) =>
        feed
          .getRoundData(id)
          .then((r: any) => Number(r[3]))
          .catch(() => null)
      )
    );
    const times = rounds.filter((t: number | null): t is number => t !== null && t > 0).sort((a, b) => a - b);
    if (times.length < 2) throw new Error(`Not enough round history to infer heartbeat for ${address}`);

    let maxGap = 0;
    for (let i = 1; i < times.length; i++) maxGap = Math.max(maxGap, times[i] - times[i - 1]);
    // 10% tolerance: heartbeat updates land a little after the nominal interval
    const heartbeat =
      STANDARD_HEARTBEATS.find((h) => h >= maxGap / 1.1) ?? Math.ceil(maxGap / 3600) * 3600;

    const age = Math.max(0, Math.floor(Date.now() / 1000) - latestUpdated);
    return {
      oracleStaleness: Number((age / heartbeat).toFixed(3)),
      oracleHeartbeat: heartbeat,
      latestPrice: latest[1].toString(),
      updatedAtBlockTimestamp: latestUpdated,
    };
  }

  /** Deployed bytecode + keccak256 hash. Throws if the address has no code. */
  async getBytecodeInfo(address: string): Promise<{ bytecode: string; hash: string }> {
    const code = await this.rpcProvider.getCode(address);
    if (!code || code === "0x") throw new Error(`No bytecode at ${address}`);
    return { bytecode: code, hash: ethers.keccak256(code) };
  }
}

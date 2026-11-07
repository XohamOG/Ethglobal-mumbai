import { ethers } from "ethers";
import { and, eq } from "@arkiv-network/sdk/query";
import { ArkivStorageClient } from "../../storage/arkiv/client.js";
import { scoreContractNode } from "./scorer.js";
import { SEED_CONTRACTS, GRAPH_EDGES } from "./ingestion.js";

/** Arkiv returns attributes as { type, value } wrappers; unwrap to plain values. */
function unwrap(v: any): any {
  if (v && typeof v === "object" && "value" in v && "type" in v) return unwrap(v.value);
  if (typeof v === "bigint") return Number(v);
  return v;
}

function plain(entity: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(entity)) out[k] = unwrap(v);
  return out;
}

function toNum(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export interface ArkivGraphPayload {
  snapshotId: string;
  protocolId: string;
  compositeScore: number;
  riskTier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evaluatedAtBlock: number;
  fingerprint: string;
  swarmGraphRef: string;
  swarmEvidenceRef: string;
  arkivSnapshotKey: string;
  nodeCount: number;
  hopScores: { hop0Avg: number; hop1Avg: number; hop2Avg: number };
  nodes: any[];
  edges: any[];
  source: "arkiv";
}

/**
 * Read the latest stored graph for a protocol straight from Arkiv.
 * No RPC calls, no rebuild, no Swarm. Returns null when Arkiv holds no snapshot.
 */
export async function loadGraphFromArkiv(
  arkiv: ArkivStorageClient,
  protocolId: string
): Promise<ArkivGraphPayload | null> {
  const client = arkiv.publicClient;
  if (!client) throw new Error("Arkiv public client is not initialised (check ARKIV_ACCESS_KEY)");

  // 1. Newest risk snapshot (the SDK query has no ordering, so pick max evaluatedAt)
  const snapRes = await client.query(
    and(eq("arkiv.schema", "risk_snapshot_v1"), eq("protocolId", protocolId)),
    { limit: 100 }
  );
  const snaps = (snapRes.entities || []).map((e: any) => ({
    ...plain(e.$attributes),
    $key: e.$key as string,
  }));
  if (snaps.length === 0) return null;
  snaps.sort((a: any, b: any) => toNum(b.evaluatedAt) - toNum(a.evaluatedAt));
  const snap = snaps[0];

  // 2. Contract nodes belonging to exactly that snapshot
  const nodeRes = await client.query(
    and(
      eq("arkiv.schema", "contract_node_v1"),
      eq("protocolId", protocolId),
      eq("snapshotId", snap.snapshotId)
    ),
    { limit: 100 }
  );

  const seedByAddress = new Map(
    SEED_CONTRACTS.map((s) => [s.address.toLowerCase(), s] as const)
  );

  // The same snapshot may have been written more than once; keep one entity per address
  const uniqueEntities = new Map<string, any>();
  for (const e of nodeRes.entities || []) {
    const addr = String(unwrap(e.$attributes.contractAddress)).toLowerCase();
    const prev = uniqueEntities.get(addr);
    if (
      !prev ||
      toNum(unwrap(e.$attributes.updatedAt)) >= toNum(unwrap(prev.$attributes.updatedAt))
    ) {
      uniqueEntities.set(addr, e);
    }
  }

  const nodes = Array.from(uniqueEntities.values()).map((e: any) => {
    const a = plain(e.$attributes);
    const address = ethers.getAddress(String(a.contractAddress).toLowerCase());
    const seed = seedByAddress.get(address.toLowerCase());
    let safeOwners: string[] = [];
    try {
      safeOwners = a.safeOwners ? JSON.parse(String(a.safeOwners)) : [];
    } catch {}
    // Entities written before real inputs were persisted lack these fields: no breakdown rather than a guess
    const hasInputs = a.contractAgeMonths !== undefined && a.timelockDelayHours !== undefined;
    const breakdown = hasInputs
      ? scoreContractNode({
          contractAddress: address,
          category: a.category,
          hop: toNum(a.hop),
          sourcifyStatus: a.sourcifyStatus,
          proxyType: a.proxyType,
          adminType: a.adminType,
          timelockDelayHours: a.adminType === "timelock" ? toNum(a.timelockDelayHours) : undefined,
          safeOwnerCount: toNum(a.safeOwnerCount),
          safeThreshold: toNum(a.safeThreshold),
          oracleStaleness: a.category === "oracle" ? toNum(a.oracleStaleness) : undefined,
          contractAgeMonths: toNum(a.contractAgeMonths),
        }).breakdown
      : undefined;
    return {
      id: seed?.id || address.toLowerCase(),
      label: seed?.label || a.contractName || `${address.slice(0, 6)}…${address.slice(-4)}`,
      address,
      contractAddress: address,
      protocolId: a.protocolId,
      snapshotId: a.snapshotId,
      hop: toNum(a.hop),
      category: a.category,
      sourcifyStatus: a.sourcifyStatus,
      riskScore: toNum(a.riskScore),
      referencedProtocolId: a.referencedProtocolId || "",
      proxyType: a.proxyType,
      adminType: a.adminType,
      adminAddress: a.adminAddress || "",
      bytecodeHash: a.bytecodeHash,
      safeOwnerCount: toNum(a.safeOwnerCount),
      safeThreshold: toNum(a.safeThreshold),
      safeOwners,
      oracleStaleness: toNum(a.oracleStaleness),
      oracleHeartbeat: toNum(a.oracleHeartbeat),
      contractName: a.contractName,
      swarmBytecodeRef: a.swarmBytecodeRef || "",
      arkivEntityKey: e.$key,
      contractAgeMonths: hasInputs ? toNum(a.contractAgeMonths) : undefined,
      timelockDelayHours: hasInputs ? toNum(a.timelockDelayHours) : undefined,
      updatedAt: toNum(a.updatedAt),
      breakdown,
    };
  });

  const ids = new Set(nodes.map((n: any) => n.id));
  const edges = GRAPH_EDGES.filter((e) => ids.has(e.from) && ids.has(e.to));

  return {
    snapshotId: snap.snapshotId,
    protocolId,
    compositeScore: toNum(snap.compositeScore),
    riskTier: snap.riskTier,
    evaluatedAtBlock: toNum(snap.evaluatedAt),
    fingerprint: snap.fingerprint,
    swarmGraphRef: snap.swarmGraphRef || "",
    swarmEvidenceRef: snap.swarmEvidenceRef || "",
    arkivSnapshotKey: snap.$key,
    nodeCount: nodes.length,
    hopScores: {
      hop0Avg: toNum(snap.hop0AvgScore),
      hop1Avg: toNum(snap.hop1AvgScore),
      hop2Avg: toNum(snap.hop2AvgScore),
    },
    nodes,
    edges,
    source: "arkiv",
  };
}

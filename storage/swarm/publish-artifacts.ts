/**
 * Publish the DeFi Provenance Graph artifacts to Swarm (Sepolia testnet Bee node).
 *
 * Runs the real ingestion pipeline (Aave V3 on Ethereum mainnet) with Arkiv writes
 * disabled, so bytecode-dump.json, full-graph.json and audit-log.json are generated
 * from live chain data and uploaded to Swarm. protocol-meta.json is added here.
 *
 * Usage (from graph-service/):  node --import tsx ../storage/swarm/publish-artifacts.ts
 * Env: SWARM_BEE_URL, SWARM_POSTAGE_BATCH_ID, ETHEREUM_RPC_URL (optional)
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { GraphIngestionEngine } from "../../graph-service/src/ingestion.js";
import { SwarmStorageClient } from "./client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const swarm = new SwarmStorageClient();
  const engine = new GraphIngestionEngine(process.env.ETHEREUM_RPC_URL);

  // Swarm-only run: Arkiv persistence is out of scope for this script.
  (engine as unknown as { arkivClient: unknown }).arkivClient = {
    saveProtocol: async () => undefined,
    saveContractNodes: async () => undefined,
    saveRiskSnapshot: async () => undefined,
  };

  const result = await engine.rebuildGraph({ protocolId: "aave-v3-mainnet", triggeredBy: "manual" });

  const protocolMeta = {
    protocolId: result.protocolId,
    name: "Aave V3",
    category: "lending",
    chainId: "1",
    version: "3.1.0",
    sourceRepo: "https://github.com/bgd-labs/aave-address-book",
    snapshotId: result.snapshotId,
    evaluatedAtBlock: result.evaluatedAtBlock,
    fingerprint: result.fingerprint,
    generatedAt: new Date().toISOString(),
  };
  const swarmMetaRef = await swarm.uploadJson(protocolMeta, "protocol-meta.json");

  const bytecodeRefs = [...new Set(result.nodes.map((n: { swarmBytecodeRef: string }) => n.swarmBytecodeRef))];
  const manifest = {
    network: "Swarm Sepolia testnet (Bee 2.8.3)",
    publishedAt: new Date().toISOString(),
    snapshotId: result.snapshotId,
    fingerprint: result.fingerprint,
    refs: {
      "full-graph.json (RiskSnapshot.swarmGraphRef)": result.swarmGraphRef,
      "audit-log.json (RiskSnapshot.swarmEvidenceRef)": result.swarmEvidenceRef,
      "bytecode-dump.json (ContractNode.swarmBytecodeRef)": bytecodeRefs[0],
      "protocol-meta.json (ProtocolRegistry.swarmMetaRef)": swarmMetaRef,
    },
  };

  // Verify every reference reads back from Swarm.
  for (const [name, ref] of Object.entries(manifest.refs)) {
    const res = await fetch(`${process.env.SWARM_BEE_URL ?? "http://127.0.0.1:1633"}/bzz/${ref}/`);
    console.log(`[verify] ${res.ok ? "OK " : "FAIL"} ${name} ${ref}`);
    if (!res.ok) process.exitCode = 1;
  }

  const out = path.resolve(__dirname, "published.json");
  fs.writeFileSync(out, JSON.stringify(manifest, null, 2));
  console.log(`Manifest written to ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

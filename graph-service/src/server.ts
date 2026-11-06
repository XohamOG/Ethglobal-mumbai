import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GraphIngestionEngine } from "./ingestion.js";
import { SwarmStorageClient } from "../../storage/swarm/client.js";
import { ArkivStorageClient } from "../../storage/arkiv/client.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const ingestionEngine = new GraphIngestionEngine(
  process.env.ETHEREUM_RPC_URL || "https://ethereum-rpc.publicnode.com"
);
const swarmClient = new SwarmStorageClient();
const arkivClient = new ArkivStorageClient();

// In-memory cache for latest rebuilds
const latestGraphs: Map<string, any> = new Map();

/**
 * Healthcheck endpoint
 */
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "DeFi Provenance Graph Service",
    timestamp: new Date().toISOString(),
    supportedProtocols: ["aave-v3-mainnet"],
  });
});

/**
 * POST /rebuild
 * Triggered by Chainlink CRE workflows (cron sweep or log trigger) or manual request
 */
app.post("/rebuild", async (req: Request, res: Response) => {
  const { protocolId = "aave-v3-mainnet", triggeredBy = "manual" } = req.body || {};

  console.log(`[API] Received POST /rebuild for ${protocolId} (triggeredBy: ${triggeredBy})`);

  try {
    const result = await ingestionEngine.rebuildGraph({
      protocolId,
      triggeredBy,
    });

    // Cache latest graph payload
    latestGraphs.set(protocolId, result);

    res.status(200).json({
      success: true,
      snapshotId: result.snapshotId,
      protocolId: result.protocolId,
      compositeScore: result.compositeScore,
      riskTier: result.riskTier,
      evaluatedAtBlock: result.evaluatedAtBlock,
      fingerprint: result.fingerprint,
      swarmGraphRef: result.swarmGraphRef,
      swarmEvidenceRef: result.swarmEvidenceRef,
      nodeCount: result.nodeCount,
      hopScores: result.hopScores,
    });
  } catch (error: any) {
    console.error("[API] Error rebuilding graph:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to rebuild dependency graph",
    });
  }
});

/**
 * GET /graph/:protocolId
 * Retrieve the full 2-hop graph data (nodes, edges, risk scores)
 */
app.get("/graph/:protocolId", async (req: Request, res: Response) => {
  const protocolId = String(req.params.protocolId || "aave-v3-mainnet");

  if (latestGraphs.has(protocolId)) {
    return res.json(latestGraphs.get(protocolId));
  }

  // Fallback to building on demand if not cached yet
  try {
    const result = await ingestionEngine.rebuildGraph({
      protocolId,
      triggeredBy: "manual",
    });
    latestGraphs.set(protocolId, result);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /swarm/:reference
 * Retrieve raw blob stored in Swarm
 */
app.get("/swarm/:reference", async (req: Request, res: Response) => {
  try {
    const reference = String(req.params.reference || "");
    const blob = await swarmClient.getJson(reference);
    if (!blob) {
      return res.status(404).json({ error: "Blob not found in Swarm" });
    }
    res.json(blob);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /protocols
 */
app.get("/protocols", (req: Request, res: Response) => {
  res.json([
    {
      protocolId: "aave-v3-mainnet",
      name: "Aave V3",
      category: "Lending",
      chain: "Ethereum Mainnet",
      chainId: 1,
      sourceRepo: "https://github.com/bgd-labs/aave-address-book",
    },
  ]);
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` DeFi Provenance Graph Service Running`);
  console.log(` Port: ${PORT}`);
  console.log(` Health: http://localhost:${PORT}/health`);
  console.log(` Rebuild: POST http://localhost:${PORT}/rebuild`);
  console.log(` Graph: GET http://localhost:${PORT}/graph/aave-v3-mainnet`);
  console.log(`==================================================`);
});

export default app;


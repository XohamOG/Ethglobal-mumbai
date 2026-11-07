import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GraphIngestionEngine } from "./ingestion.js";
import { SwarmStorageClient } from "../../storage/swarm/client.js";
import { ArkivStorageClient } from "../../storage/arkiv/client.js";
import { GraphCache } from "./graphCache.js";
import { computeDriftFingerprint } from "./driftFingerprint.js";
import { ethers } from "ethers";

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
const graphCache = new GraphCache(arkivClient);

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
  // Optional shared secret (set CRE_API_KEY in graph-service/.env to require it)
  const requiredKey = process.env.CRE_API_KEY;
  if (requiredKey && req.header("x-api-key") !== requiredKey) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const { protocolId = "aave-v3-mainnet", triggeredBy = "manual" } = req.body || {};

  console.log(`[API] Received POST /rebuild for ${protocolId} (triggeredBy: ${triggeredBy})`);

  try {
    const result = await ingestionEngine.rebuildGraph({
      protocolId,
      triggeredBy,
    });

    // Cache latest graph payload
    // New entities were just written to Arkiv: refresh the cache (keeps serving the old one until done)
    graphCache.refresh(protocolId).catch((e) => console.warn("[Cache] post-rebuild refresh failed:", e.message));

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
 * Serves the latest graph stored in Arkiv (no RPC rebuild, no Swarm needed).
 * Use POST /rebuild to ingest a fresh snapshot.
 */
app.get("/graph/:protocolId", async (req: Request, res: Response) => {
  const protocolId = String(req.params.protocolId || "aave-v3-mainnet");

  try {
    const { data: graph, cached, ageMs } = await graphCache.get(protocolId, req.query.refresh === "1");
    if (!graph) {
      return res.status(404).json({
        error: `No Arkiv snapshot found for ${protocolId}. Run POST /rebuild first.`,
      });
    }
    res.setHeader("X-Cache", cached ? "HIT" : "MISS");
    res.setHeader("X-Cache-Age-Ms", String(ageMs));
    res.json(graph);
  } catch (err: any) {
    console.error("[API] Error reading graph from Arkiv:", err);
    res.status(502).json({ error: `Arkiv read failed: ${err.message}` });
  }
});

/**
 * GET /fingerprint/:protocolId
 * Latest drift fingerprint stored in Arkiv. Polled by the Chainlink CRE workflow,
 * which compares it with the fingerprint it recomputes from live mainnet state.
 */
app.get("/fingerprint/:protocolId", async (req: Request, res: Response) => {
  const protocolId = String(req.params.protocolId || "aave-v3-mainnet");
  try {
    // Always read fresh from Arkiv: the CRE drift check must never compare against a stale cache
    const { data: graph } = await graphCache.get(protocolId, true);
    if (!graph) {
      return res.status(404).json({ protocolId, fingerprint: null });
    }
    res.json({
      protocolId,
      fingerprint: graph.fingerprint,
      snapshotId: graph.snapshotId,
      evaluatedAtBlock: graph.evaluatedAtBlock,
    });
  } catch (err: any) {
    res.status(502).json({ error: `Arkiv read failed: ${err.message}` });
  }
});

/**
 * GET /drift/:protocolId
 * Recomputes the live fingerprint from mainnet (finalized block) and compares it with the
 * one stored in Arkiv. Same logic the Chainlink CRE workflow runs; read-only.
 */
app.get("/drift/:protocolId", async (req: Request, res: Response) => {
  const protocolId = String(req.params.protocolId || "aave-v3-mainnet");
  try {
    const provider = new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL || "https://ethereum-rpc.publicnode.com"
    );
    const [live, stored] = await Promise.all([
      computeDriftFingerprint(provider),
      graphCache.get(protocolId, true),
    ]);
    const storedFp = stored.data?.fingerprint ?? null;
    res.json({
      protocolId,
      liveFingerprint: live.fingerprint,
      storedFingerprint: storedFp,
      snapshotId: stored.data?.snapshotId ?? null,
      evaluatedAtBlock: stored.data?.evaluatedAtBlock ?? null,
      compositeScore: stored.data?.compositeScore ?? null,
      readsChecked: Object.keys(live.results).length,
      drift: !storedFp || storedFp.toLowerCase() !== live.fingerprint.toLowerCase(),
    });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
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
  graphCache.preload(["aave-v3-mainnet"]);
  console.log(`==================================================`);
  console.log(` DeFi Provenance Graph Service Running`);
  console.log(` Port: ${PORT}`);
  console.log(` Health: http://localhost:${PORT}/health`);
  console.log(` Rebuild: POST http://localhost:${PORT}/rebuild`);
  console.log(` Graph: GET http://localhost:${PORT}/graph/aave-v3-mainnet`);
  console.log(`==================================================`);
});

export default app;


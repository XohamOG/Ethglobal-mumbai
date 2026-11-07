import {
  CronCapability,
  EVMClient,
  HTTPClient,
  LAST_FINALIZED_BLOCK_NUMBER,
  Runner,
  bytesToHex,
  consensusIdenticalAggregation,
  encodeCallMsg,
  getNetwork,
  handler,
  ok,
  type HTTPSendRequester,
  type NodeRuntime,
  type Runtime,
} from "@chainlink/cre-sdk";
import { decodeFunctionResult, encodeFunctionData, keccak256, parseAbi, toBytes, zeroAddress, type Address, type Hex } from "viem";
import { z } from "zod";
import spec from "./fingerprint-spec.json";

/**
 * DeFi Provenance Graph - Fingerprint Drift Workflow (Chainlink CRE)
 *
 *   1. CRON trigger fires.
 *   2. EVM READS (Ethereum mainnet, finalized block, DON consensus): every pointer listed in
 *      fingerprint-spec.json (Pool/Configurator revisions, PoolAddressesProvider registry,
 *      AaveOracle price sources, ACL emergency admin, Timelock delay, Safe owners/threshold).
 *   3. Compute fingerprint = keccak256(sorted "<id>=<result>" lines).
 *   4. HTTP GET  graph-service /fingerprint/:protocol  -> fingerprint stored in Arkiv.
 *   5. Equal  -> no drift, nothing to do.
 *      Differs -> HTTP POST graph-service /rebuild (re-ingest graph, rescore, write Arkiv/Swarm).
 */

const configSchema = z.object({
  schedule: z.string(),
  chainSelectorName: z.string(),
  protocolId: z.string(),
  graphServiceUrl: z.string(),
});
type Config = z.infer<typeof configSchema>;

// Empty strings (not null) so DON consensus can aggregate the value
type StoredFingerprint = { status: number; fingerprint: string; snapshotId: string };
type RebuildResult = { status: number; ok: boolean; compositeScore: number; riskTier: string; fingerprint: string };

// ---------------------------------------------------------------------------
// Step 2-3: read on-chain pointers through the CRE EVM client and fingerprint them
// ---------------------------------------------------------------------------
// CRE caps a workflow at 15 chain reads, so all pointers are batched through Multicall3 (1 read).
const MULTICALL3: Address = "0xcA11bde05977b3631167028862bE2a173976CA11";
const multicallAbi = parseAbi([
  "function aggregate3((address target, bool allowFailure, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[] returnData)",
]);

const readLiveFingerprint = (runtime: Runtime<Config>): string => {
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: runtime.config.chainSelectorName,
  });
  if (!network) throw new Error(`Network not found: ${runtime.config.chainSelectorName}`);
  const evm = new EVMClient(network.chainSelector.selector);

  const calldata = encodeFunctionData({
    abi: multicallAbi,
    functionName: "aggregate3",
    args: [spec.reads.map((r) => ({ target: r.to as Address, allowFailure: false, callData: r.data as Hex }))],
  });
  const out = evm
    .callContract(runtime, {
      call: encodeCallMsg({ from: zeroAddress, to: MULTICALL3, data: calldata }),
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    })
    .result();
  const decoded = decodeFunctionResult({
    abi: multicallAbi,
    functionName: "aggregate3",
    data: bytesToHex(out.data),
  });

  const results: Record<string, string> = {};
  spec.reads.forEach((r, i) => {
    results[r.id] = decoded[i].returnData.toLowerCase();
    runtime.log(`  read ${r.id} = ${results[r.id].slice(0, 66)}${results[r.id].length > 66 ? "…" : ""}`);
  });
  runtime.log(`[drift] ${spec.reads.length} pointers read in 1 batched call (Multicall3)`);

  const lines = Object.keys(results)
    .sort()
    .map((id) => `${id}=${results[id]}`)
    .join("\n");
  return keccak256(toBytes(lines));
};

// ---------------------------------------------------------------------------
// Step 4: fetch the fingerprint stored by graph-service (backed by Arkiv)
// ---------------------------------------------------------------------------
const fetchStored = (sendRequester: HTTPSendRequester, config: Config): StoredFingerprint => {
  const resp = sendRequester
    .sendRequest({
      url: `${config.graphServiceUrl}/fingerprint/${config.protocolId}`,
      method: "GET" as const,
    })
    .result();
  if (resp.statusCode === 404) return { status: 404, fingerprint: "", snapshotId: "" };
  if (!ok(resp)) throw new Error(`graph-service /fingerprint returned ${resp.statusCode}`);
  const body = JSON.parse(new TextDecoder().decode(resp.body));
  return { status: resp.statusCode, fingerprint: body.fingerprint ?? "", snapshotId: body.snapshotId ?? "" };
};

// ---------------------------------------------------------------------------
// Step 5: drift -> ask graph-service to rebuild everything (API key from CRE secrets)
// ---------------------------------------------------------------------------
const postRebuild = (nodeRuntime: NodeRuntime<Config>, apiKey: string): RebuildResult => {
  const config = nodeRuntime.config;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;

  const body = Buffer.from(
    new TextEncoder().encode(JSON.stringify({ protocolId: config.protocolId, triggeredBy: "cron" }))
  ).toString("base64");

  const resp = new HTTPClient()
    .sendRequest(nodeRuntime, {
      url: `${config.graphServiceUrl}/rebuild`,
      method: "POST" as const,
      body,
      headers,
      timeout: "120s",
    })
    .result();

  if (!ok(resp)) {
    throw new Error(`graph-service /rebuild returned ${resp.statusCode}: ${new TextDecoder().decode(resp.body)}`);
  }
  const json = JSON.parse(new TextDecoder().decode(resp.body));
  return {
    status: resp.statusCode,
    ok: json.success === true,
    compositeScore: Number(json.compositeScore),
    riskTier: String(json.riskTier),
    fingerprint: String(json.fingerprint),
  };
};

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
const onCronTrigger = (runtime: Runtime<Config>): string => {
  runtime.log(`[drift] sweep for ${runtime.config.protocolId}`);

  const live = readLiveFingerprint(runtime);
  runtime.log(`[drift] live fingerprint   : ${live}`);

  const stored = new HTTPClient()
    .sendRequest(runtime, fetchStored, consensusIdenticalAggregation<StoredFingerprint>())(runtime.config)
    .result();
  runtime.log(`[drift] stored fingerprint : ${stored.fingerprint || "none (no snapshot in Arkiv yet)"}`);

  if (stored.fingerprint && stored.fingerprint.toLowerCase() === live.toLowerCase()) {
    runtime.log(`[drift] NO DRIFT - snapshot ${stored.snapshotId} is still accurate. Nothing to rebuild.`);
    return `NO_DRIFT ${live}`;
  }

  runtime.log(
    stored.fingerprint
      ? "[drift] DRIFT DETECTED - protocol state changed, rebuilding graph..."
      : "[drift] no stored snapshot - building initial graph..."
  );
  // API key comes from CRE secrets (secrets.yaml -> env). Empty when graph-service runs without CRE_API_KEY.
  let apiKey = "";
  try {
    apiKey = runtime.getSecret({ id: "GRAPH_SERVICE_API_KEY" }).result().value;
  } catch {
    runtime.log("[drift] GRAPH_SERVICE_API_KEY secret not set - calling /rebuild without x-api-key");
  }
  const rebuilt = runtime
    .runInNodeMode(postRebuild, consensusIdenticalAggregation<RebuildResult>())(apiKey)
    .result();
  runtime.log(
    `[drift] rebuilt: score=${rebuilt.compositeScore} tier=${rebuilt.riskTier} fingerprint=${rebuilt.fingerprint}`
  );
  if (rebuilt.fingerprint.toLowerCase() !== live.toLowerCase()) {
    runtime.log("[drift] WARNING: rebuilt fingerprint differs from CRE-computed one (state moved between reads)");
  }
  return `REBUILT score=${rebuilt.compositeScore} tier=${rebuilt.riskTier}`;
};

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)];
};

export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema });
  await runner.run(initWorkflow);
}

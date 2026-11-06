import { ethers } from "ethers";
import { runCronSweep } from "../workflows/cron";
import { runLogTrigger } from "../workflows/log_trigger";
import * as RiskRegistryArtifact from "../abis/RiskRegistry.json";

async function main() {
  console.log(`\n################################################################`);
  console.log(` Chainlink Runtime Environment (CRE) Workflow Simulation Engine`);
  console.log(` DeFi Provenance Graph — Multi-Hop Risk Verification`);
  console.log(`################################################################\n`);

  const args = process.argv.slice(2);
  const workflowArg = args.find((a, i) => args[i - 1] === "--workflow") || "all";

  // Setup local in-memory provider and wallet for realistic simulation
  console.log(`[*] Initializing local simulation provider and CRE Forwarder signer...`);
  // Use a deterministic private key (Hardhat account 0)
  const wallet = new ethers.Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  );

  // We can connect to local node or mock signer
  // For standalone execution without a background RPC, we can mock the contract interaction or connect to localhost
  // Check if local node is reachable
  let localRegistryAddress = process.env.RISK_REGISTRY_ADDRESS;
  let signer: ethers.Signer | undefined;

  try {
    const jsonRpcProvider = new ethers.JsonRpcProvider(
      "http://127.0.0.1:8545",
      { chainId: 31337, name: "localhost" },
      { staticNetwork: true }
    );
    await jsonRpcProvider.getBlockNumber();
    signer = wallet.connect(jsonRpcProvider);
    console.log(`[+] Connected to local Ethereum node at http://127.0.0.1:8545`);
  } catch {
    console.log(`[-] No local node running at 8545. Running in mock-execution simulation mode.`);
    signer = undefined;
  }

  const PROTOCOL_ID = "aave-v3-mainnet";
  const GRAPH_SERVICE_URL = process.env.GRAPH_SERVICE_URL || "http://localhost:3001";

  // 1. Simulate Cron Sweep Workflow
  if (workflowArg === "all" || workflowArg === "cron") {
    console.log(`\n>>> [1/2] Simulating Workflow 1: Periodic Cron Sweep (7,200 Blocks / 24h) <<<`);
    const cronResult = await runCronSweep({
      protocolId: PROTOCOL_ID,
      rpcUrl: "https://eth.llamarpc.com",
      graphServiceUrl: GRAPH_SERVICE_URL,
      riskRegistryAddress: localRegistryAddress || ethers.ZeroAddress,
      signer: signer,
      forceRebuild: true,
    });

    console.log(`\n[+] Cron Sweep Simulation Completed:`);
    console.log(`    Snapshot ID     : ${cronResult?.snapshotId}`);
    console.log(`    Composite Score : ${cronResult?.compositeScore} / 10000 (${cronResult?.riskTier} Risk)`);
    console.log(`    Swarm Ref       : ${cronResult?.swarmGraphRef}`);
    console.log(`    Evaluation Block: ${cronResult?.blockNumber}`);
  }

  // 2. Simulate Log Trigger Workflow
  if (workflowArg === "all" || workflowArg === "log") {
    console.log(`\n>>> [2/2] Simulating Workflow 2: Reactive EVM Log Trigger (Upgraded Event) <<<`);
    const logResult = await runLogTrigger({
      protocolId: PROTOCOL_ID,
      eventPayload: {
        eventName: "Upgraded",
        contractAddress: "0x87870Bca3F3fD6335c3F4cE8392d69350b4F4E2", // Aave Pool Proxy
        newImplementation: "0x7777777777777777777777777777777777777777",
        txHash: "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
        blockNumber: 21105420,
      },
      graphServiceUrl: GRAPH_SERVICE_URL,
      riskRegistryAddress: localRegistryAddress || ethers.ZeroAddress,
      signer: signer,
    });

    console.log(`\n[+] Log Trigger Simulation Completed:`);
    console.log(`    Snapshot ID     : ${logResult?.snapshotId}`);
    console.log(`    Composite Score : ${logResult?.compositeScore} / 10000 (${logResult?.riskTier} Risk)`);
    console.log(`    Swarm Ref       : ${logResult?.swarmGraphRef}`);
    console.log(`    Evaluation Block: ${logResult?.blockNumber}`);
  }

  console.log(`\n======================================================`);
  console.log(` [✔] Chainlink CRE Workflows Simulated Successfully!`);
  console.log(`======================================================\n`);
}

main().catch((err) => {
  console.error("Simulation failed:", err);
  process.exit(1);
});

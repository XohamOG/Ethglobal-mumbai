import { ethers } from "ethers";
import {
  computeProtocolFingerprint,
  triggerGraphRebuild,
  reportRiskOnChain,
  ProtocolFingerprintInput,
} from "../src/adapter";
import * as RiskRegistryArtifact from "../abis/RiskRegistry.json";

export interface CronWorkflowConfig {
  protocolId: string;
  rpcUrl: string;
  graphServiceUrl: string;
  riskRegistryAddress: string;
  signer?: ethers.Signer;
  forceRebuild?: boolean;
}

// Aave V3 Mainnet Reference addresses from docs/PROJECT_SPEC.md
const AAVE_V3_CORE = {
  poolProxy: ethers.getAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  addressesProvider: ethers.getAddress("0x2f39d218133afab8f2b819b1066c7f434ad94e9e"),
  configurator: ethers.getAddress("0x64b761d848206f447fe2dd461b0c635ec39ebb27"),
  aaveOracle: "0x54586bE6333240e3ef4a78248c410Bf33060Ca0C",
  timelockAdmin: ethers.getAddress("0xee56e2b3d491590b5b31738cc34d5232f378a8d5"),
  guardianSafe: ethers.getAddress("0x2cfe3ec4d5a6811f4b8067f0de7e47dfa938aa30"),
  oracleFeeds: [
    ethers.getAddress("0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419"), // ETH/USD
    ethers.getAddress("0x8fffffd4afb6115b954bd326cbe7b4ba576818f6"), // USDC/USD
    ethers.getAddress("0xf4030086522a5beea4988f8ca5b36dbc97bee88c"), // BTC/USD
    ethers.getAddress("0xaed0c38402a5d19df6e4c03f4e2dced6e29c1ee9"), // DAI/USD
    ethers.getAddress("0x3e7d1eab13ad0104d2750b8863b489d65364e32d"), // USDT/USD
  ],
};

const EIP1967_IMPL_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const EIP1967_ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";

/**
 * Chainlink CRE Cron Sweep Workflow Handler
 * Executes periodically to verify protocol integrity and detect structural changes.
 */
export async function runCronSweep(config: CronWorkflowConfig) {
  console.log(`\n======================================================`);
  console.log(` [CRE Cron Sweep] Initiating sweep for: ${config.protocolId}`);
  console.log(`======================================================`);

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);

  let poolImpl = "0x5FAab9E1adbddaD0a08734BE8a52185Fd6558E14";
  let poolAdmin = AAVE_V3_CORE.timelockAdmin;
  let poolBytecodeHash = ethers.keccak256("0x12345678");

  try {
    console.log(`[CRE Cron Sweep] Reading EIP-1967 slots on Pool proxy (${AAVE_V3_CORE.poolProxy})...`);
    const [rawImplSlot, rawAdminSlot] = await Promise.all([
      provider.getStorage(AAVE_V3_CORE.poolProxy, EIP1967_IMPL_SLOT),
      provider.getStorage(AAVE_V3_CORE.poolProxy, EIP1967_ADMIN_SLOT),
    ]);

    if (rawImplSlot && rawImplSlot !== ethers.ZeroHash) {
      poolImpl = ethers.getAddress("0x" + rawImplSlot.slice(26));
      console.log(`[CRE Cron Sweep] Resolved Pool Implementation : ${poolImpl}`);
    }

    if (rawAdminSlot && rawAdminSlot !== ethers.ZeroHash) {
      poolAdmin = ethers.getAddress("0x" + rawAdminSlot.slice(26));
      console.log(`[CRE Cron Sweep] Resolved Pool Admin          : ${poolAdmin}`);
    }

    const code = await provider.getCode(poolImpl);
    if (code && code !== "0x") {
      poolBytecodeHash = ethers.keccak256(code);
      console.log(`[CRE Cron Sweep] Implementation Bytecode Hash : ${poolBytecodeHash}`);
    }
  } catch (err: any) {
    console.warn(`[CRE Cron Sweep] Live RPC query skipped/failed (${err.message}). Using reference fixture.`);
  }

  // Construct fingerprint payload per specification
  const fingerprintInput: ProtocolFingerprintInput = {
    implBytecodeHashes: [poolBytecodeHash],
    adminAddresses: [poolAdmin, AAVE_V3_CORE.guardianSafe],
    oracleFeedAddresses: AAVE_V3_CORE.oracleFeeds,
    depAddresses: [AAVE_V3_CORE.poolProxy, AAVE_V3_CORE.addressesProvider, AAVE_V3_CORE.configurator],
  };

  const currentFingerprint = computeProtocolFingerprint(fingerprintInput);
  console.log(`[CRE Cron Sweep] Computed Protocol Fingerprint : ${currentFingerprint}`);

  // In production CRE: Query Arkiv RiskSnapshot for stored fingerprint
  // If stored !== current (or forceRebuild is active), trigger rebuild
  const hasDrift = true; // In simulation, we proceed to test the end-to-end rebuild dispatch

  if (hasDrift || config.forceRebuild) {
    console.log(`[CRE Cron Sweep] Drift detected or scheduled refresh triggered. Invoking Graph Service...`);

    const rebuildResult = await triggerGraphRebuild(config.graphServiceUrl, {
      protocolId: config.protocolId,
      triggeredBy: "cron",
    });

    console.log(`[CRE Cron Sweep] Rebuild result: Score = ${rebuildResult.compositeScore}, Tier = ${rebuildResult.riskTier}`);

    if (config.signer && config.riskRegistryAddress && config.riskRegistryAddress !== ethers.ZeroAddress) {
      console.log(`[CRE Cron Sweep] Attesting score on-chain in RiskRegistry...`);
      await reportRiskOnChain(
        config.riskRegistryAddress,
        {
          protocolId: config.protocolId,
          compositeScore: rebuildResult.compositeScore,
          riskTier: rebuildResult.riskTier,
          snapshotId: rebuildResult.snapshotId,
          blockNumber: rebuildResult.blockNumber,
        },
        config.signer,
        RiskRegistryArtifact.abi
      );
    } else {
      console.log(`[CRE Cron Sweep] Signer/RiskRegistry not configured. Skipping on-chain tx.`);
    }

    return rebuildResult;
  } else {
    console.log(`[CRE Cron Sweep] Fingerprint matches stored snapshot. No drift detected. Graph is fresh.`);
    return null;
  }
}

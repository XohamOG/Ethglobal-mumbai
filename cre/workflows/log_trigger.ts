import { ethers } from "ethers";
import {
  triggerGraphRebuild,
  reportRiskOnChain,
} from "../src/adapter";
import * as RiskRegistryArtifact from "../abis/RiskRegistry.json";

export interface LogTriggerEventPayload {
  eventName: "Upgraded" | "AdminChanged";
  contractAddress: string;
  txHash: string;
  blockNumber: number;
  newImplementation?: string;
  previousAdmin?: string;
  newAdmin?: string;
}

export interface LogWorkflowConfig {
  protocolId: string;
  eventPayload: LogTriggerEventPayload;
  graphServiceUrl: string;
  riskRegistryAddress: string;
  signer?: ethers.Signer;
}

/**
 * Chainlink CRE EVM Log Trigger Workflow Handler
 * Executes reactively when a contract upgrade or admin change event is emitted on-chain.
 */
export async function runLogTrigger(config: LogWorkflowConfig) {
  const { eventPayload, protocolId, graphServiceUrl, riskRegistryAddress, signer } = config;

  console.log(`\n======================================================`);
  console.log(` [CRE Log Trigger] Event detected: ${eventPayload.eventName}`);
  console.log(` Target Contract : ${eventPayload.contractAddress}`);
  console.log(` Protocol        : ${protocolId}`);
  console.log(` Block Number    : ${eventPayload.blockNumber}`);
  console.log(` Tx Hash         : ${eventPayload.txHash}`);
  if (eventPayload.newImplementation) {
    console.log(` New Implementation : ${eventPayload.newImplementation}`);
  }
  if (eventPayload.newAdmin) {
    console.log(` New Admin          : ${eventPayload.newAdmin}`);
  }
  console.log(`======================================================`);

  console.log(`[CRE Log Trigger] Triggering immediate high-priority graph rebuild on Graph Service...`);

  const rebuildResult = await triggerGraphRebuild(graphServiceUrl, {
    protocolId,
    triggeredBy: "log-event",
    eventDetails: {
      txHash: eventPayload.txHash,
      eventName: eventPayload.eventName,
      targetContract: eventPayload.contractAddress,
      newImplementation: eventPayload.newImplementation,
      newAdmin: eventPayload.newAdmin,
    },
  });

  console.log(`[CRE Log Trigger] Rebuild finished! New composite score: ${rebuildResult.compositeScore} (${rebuildResult.riskTier})`);

  if (signer && riskRegistryAddress && riskRegistryAddress !== ethers.ZeroAddress) {
    console.log(`[CRE Log Trigger] Disagree/Attest score to RiskRegistry.sol on-chain...`);
    await reportRiskOnChain(
      riskRegistryAddress,
      {
        protocolId,
        compositeScore: rebuildResult.compositeScore,
        riskTier: rebuildResult.riskTier,
        snapshotId: rebuildResult.snapshotId,
        blockNumber: rebuildResult.blockNumber,
      },
      signer,
      RiskRegistryArtifact.abi
    );
  } else {
    console.log(`[CRE Log Trigger] Signer/RiskRegistry not configured. Skipping on-chain tx.`);
  }

  return rebuildResult;
}

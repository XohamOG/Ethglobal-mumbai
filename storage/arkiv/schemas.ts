import {
  defineSchema,
  str,
  u64,
  dec,
  bytes,
  ExpirationTime,
  Schema,
} from "@arkiv-network/sdk";

/**
 * Entity 1: ProtocolRegistry (Macro Entity — Permanent Identity)
 * Tag: protocol_registry_v1
 * Lifetime: ExpirationTime.max()
 * Cardinality: 1 entity per protocol
 */
export const ProtocolRegistry = defineSchema("protocol_registry_v1", {
  protocolId:   str().indexed(),   // e.g. "aave-v3-mainnet", "chainlink-mainnet"
  name:         str().indexed(),   // "Aave V3"
  category:     str().indexed(),   // "lending" | "dex" | "oracle" | "bridge" | "yield"
  chainId:      str().indexed(),   // "1"
  version:      str(),             // "3.1.0"
  sourceRepo:   str(),             // "https://github.com/bgd-labs/aave-address-book"
  swarmMetaRef: str(),             // Swarm hash -> protocol-meta.json
  createdAt:    u64(),             // Unix timestamp of registration
});

/**
 * Entity 2: ContractNode (Micro Entity — Contract Graph Node)
 * Tag: contract_node_v1
 * Lifetime: Medium BTL (refreshed on each rebuild, ~50,000 blocks)
 * Cardinality: N entities per protocol evaluation run
 */
export const ContractNode = defineSchema("contract_node_v1", {
  contractAddress:      str().indexed(), // Checksummed EVM address
  protocolId:           str().indexed(), // Foreign Key -> ProtocolRegistry
  snapshotId:           str().indexed(), // Foreign Key -> RiskSnapshot
  hop:                  u64().indexed(), // 0 = core, 1 = direct dep, 2 = transitive dep
  category:             str().indexed(), // "proxy" | "implementation" | "oracle" | "multisig" | "token"
  sourcifyStatus:       str().indexed(), // "full_match" | "partial_match" | "not_found"
  riskScore:            dec().indexed(), // Calculated node risk score [0, 100]
  referencedProtocolId: str().indexed(), // Cross-protocol foreign key (e.g. "chainlink-mainnet" or "")
  proxyType:            str(),           // "eip1967" | "beacon" | "eip897" | "none"
  adminType:            str(),           // "timelock" | "safe" | "eoa" | "dao" | "none"
  adminAddress:         str(),           // Admin wallet/contract address
  bytecodeHash:         str(),           // keccak256 of deployed bytecode
  safeOwnerCount:       u64(),           // Signers count if adminType == "safe"
  safeThreshold:        u64(),           // Required signatures if adminType == "safe"
  safeOwners:           bytes(),         // METADATA ONLY: JSON array string of owner addresses
  oracleStaleness:      dec(),           // ageSeconds / heartbeatSeconds (if category == "oracle")
  oracleHeartbeat:      u64(),           // Heartbeat in seconds (inferred from observed rounds)
  contractAgeMonths:    dec(),           // Age from Sourcify deployment block (F6 input)
  timelockDelayHours:   dec(),           // On-chain timelock delay, 0 if not timelock-governed (F2 input)
  contractName:         str(),           // Human-readable name from Sourcify mirror
  swarmBytecodeRef:     str(),           // Swarm hash -> bytecode-dump.json
  updatedAt:            u64(),           // Block number of enrichment
});

/**
 * Entity 3: RiskSnapshot (Macro Entity — Evaluation Run with BTL)
 * Tag: risk_snapshot_v1
 * Lifetime: Block-time lifetime (~50,000 blocks ≈ 7 days)
 * Cardinality: 1 per evaluation run per protocol
 */
export const RiskSnapshot = defineSchema("risk_snapshot_v1", {
  snapshotId:       str().indexed(), // "{protocolId}-{blockNumber}"
  protocolId:       str().indexed(), // Foreign Key -> ProtocolRegistry
  compositeScore:   dec().indexed(), // Final weighted score [0, 100]
  riskTier:         str().indexed(), // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  evaluatedAt:      u64().indexed(), // Block number of evaluation
  fingerprint:      str(),           // Keccak256 fingerprint hash
  swarmGraphRef:    str(),           // Swarm hash -> full-graph.json
  swarmEvidenceRef: str(),           // Swarm hash -> audit-log.json
  triggeredBy:      str(),           // "cron" | "log-event" | "manual"
  hop0AvgScore:     dec(),           // Hop 0 subscore average
  hop1AvgScore:     dec(),           // Hop 1 subscore average
  hop2AvgScore:     dec(),           // Hop 2 subscore average
  nodeCount:        u64(),           // Total number of ContractNodes in graph
});

export type ProtocolRegistryType = typeof ProtocolRegistry;
export type ContractNodeType = typeof ContractNode;
export type RiskSnapshotType = typeof RiskSnapshot;


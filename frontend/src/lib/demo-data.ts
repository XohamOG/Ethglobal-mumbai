import { ethers } from "ethers";
import { GraphNode, GraphEdge, ScoreBreakdown, getRiskScoreConfig } from "./graph-data";

export interface DemoScenario {
  id: number;
  title: string;
  category: "Upgradeability" | "Governance" | "Access Control" | "Oracle" | "Parameters";
  description: string;
  targetNodeId: string;
  targetNodeLabel: string;
  simulatedChange: string;
  expectedEffect: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affectedFactors: string[];
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 1,
    title: "Proxy Implementation Upgrade",
    category: "Upgradeability",
    description: "Replace Implementation V1 with unverified Implementation V2 via EIP-1967 slot mutation.",
    targetNodeId: "demo-pool-impl",
    targetNodeLabel: "DemoLend Pool Logic Impl",
    simulatedChange: "Address mutated from 0x1111... to 0x2222...; Bytecode hash changed; Sourcify match lost.",
    expectedEffect: "F1 (Verification) jumps from 0 to 8 pts, F3 (Upgradeability) increases to 12 pts; Fingerprint drift triggers 2-hop rebuild.",
    severity: "MEDIUM",
    affectedFactors: ["F1: Verification", "F3: Upgradeability"],
  },
  {
    id: 2,
    title: "Admin / Governance Takeover",
    category: "Governance",
    description: "Replace decentralized 48h Timelock governance admin with a single hot EOA private key.",
    targetNodeId: "demo-pool-proxy",
    targetNodeLabel: "DemoLend Core Pool Proxy",
    simulatedChange: "Admin address changed from Timelock contract to hot EOA 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045; adminType set to 'eoa'.",
    expectedEffect: "F2 (Admin Control) explodes from 2 pts to 20 pts (Maximum EOA Centralization Penalty); score shifts from LOW to MEDIUM.",
    severity: "HIGH",
    affectedFactors: ["F2: Admin Control"],
  },
  {
    id: 3,
    title: "Multisig Compromise (Signer Reduction)",
    category: "Access Control",
    description: "Emergency Guardian Safe signers reduced from 5 to 2, and threshold lowered from 4-of-5 to 1-of-2.",
    targetNodeId: "demo-guardian-safe",
    targetNodeLabel: "Emergency Guardian Safe",
    simulatedChange: "Safe signers reduced to 2; Threshold lowered to 1; threshold/owners ratio drops to 0.5 (< 0.6) and owners < 3.",
    expectedEffect: "F2 rises to 12 pts; F5 (Concentration Risk) jumps from 3 to 14 pts (penalized for < 3 signers); Safe marked compromised.",
    severity: "HIGH",
    affectedFactors: ["F2: Admin Control", "F5: Concentration Risk"],
  },
  {
    id: 4,
    title: "Oracle Feed Replacement",
    category: "Oracle",
    description: "Redirect core ETH/USD price feed to an unknown, unverified third-party aggregator contract.",
    targetNodeId: "demo-feed-eth",
    targetNodeLabel: "Chainlink ETH/USD Feed",
    simulatedChange: "Feed address changed to unverified contract 0x3333333333333333333333333333333333333333; Sourcify match set to 'not_found'.",
    expectedEffect: "F1 (Verification) spikes to 20 pts on feed; dependency edge rerouted; overall transitive risk increases.",
    severity: "MEDIUM",
    affectedFactors: ["F1: Verification"],
  },
  {
    id: 5,
    title: "Oracle Staleness (Heartbeat Failure)",
    category: "Oracle",
    description: "ETH/USD feed keepers freeze or fail to push heartbeat updates for over 2.8x the expected heartbeat interval.",
    targetNodeId: "demo-feed-eth",
    targetNodeLabel: "Chainlink ETH/USD Feed",
    simulatedChange: "Oracle staleness ratio escalated from 0.2 to 2.8 (> 2.0x heartbeat timeout threshold).",
    expectedEffect: "F4 (Oracle Freshness) hits maximum penalty of 15 pts; feed flagged as CRITICAL STALE DATA in real time.",
    severity: "HIGH",
    affectedFactors: ["F4: Oracle Freshness"],
  },
  {
    id: 6,
    title: "Timelock Delay Reduction",
    category: "Parameters",
    description: "Governance execution delay slashed from safe 48 hours to 1 hour, enabling flash loan attack bypasses.",
    targetNodeId: "demo-governance-timelock",
    targetNodeLabel: "Governance Timelock",
    simulatedChange: "timelockDelayHours reduced from 48h to 1h (< 24h threshold).",
    expectedEffect: "F2 (Admin Control) rises from 2 pts (safe delay >= 48h) to 10 pts (< 24h penalty); bypass vulnerability exposed.",
    severity: "MEDIUM",
    affectedFactors: ["F2: Admin Control"],
  },
];

export const DEMO_BASELINE_NODES: GraphNode[] = [
  // Hop 0: Core Proxies
  {
    id: "demo-pool-proxy",
    label: "DemoLend Pool (Proxy)",
    address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    hop: 0,
    category: "proxy",
    riskScore: 12,
    proxyType: "eip1967",
    adminType: "timelock",
    adminAddress: "0xEE56e2B3D491590B5b31738cC34d5232F378a8D5",
    sourcifyStatus: "full_match",
    contractName: "DemoLendPoolProxy",
    arkivEntityKey: "0x5df8dc59a35e80d99ba148ff61df9a96f13bce36c74d6f85ffad9ec6ce6bb1c2",
    swarmBytecodeRef: "632a1a8aeaecade273e5f6e0f8581921c21ea5d8d9bd4fa64f0e1823671510e9",
  },
  {
    id: "demo-addresses-provider",
    label: "AddressesProvider (Seed)",
    address: "0x2f39D218133AFAb8F2b819B1066C7f434aD94e9e",
    hop: 0,
    category: "proxy",
    riskScore: 12,
    proxyType: "eip1967",
    adminType: "timelock",
    sourcifyStatus: "full_match",
    contractName: "PoolAddressesProvider",
  },
  {
    id: "demo-acl-manager",
    label: "ACLManager",
    address: "0xc2aaCf6553D20d1e9d78E365AAba8032af9c85b0",
    hop: 0,
    category: "implementation",
    riskScore: 14,
    proxyType: "none",
    adminType: "timelock",
    sourcifyStatus: "full_match",
    contractName: "ACLManager",
  },

  // Hop 1: Implementations & Access Controllers
  {
    id: "demo-pool-impl",
    label: "DemoLend Pool Logic Impl (V1)",
    address: "0x728a138A4823392C2EFA55e028d434F526fE03CF",
    hop: 1,
    category: "implementation",
    riskScore: 2,
    proxyType: "none",
    adminType: "timelock",
    sourcifyStatus: "full_match",
    bytecodeHash: "0xa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
    contractName: "DemoLendPoolImplementationV1",
  },
  {
    id: "demo-governance-timelock",
    label: "Governance Timelock (48h)",
    address: "0xEE56e2B3D491590B5b31738cC34d5232F378a8D5",
    hop: 1,
    category: "implementation",
    riskScore: 2,
    proxyType: "none",
    adminType: "timelock",
    sourcifyStatus: "full_match",
    contractName: "GovernanceTimelock",
  },
  {
    id: "demo-guardian-safe",
    label: "Emergency Guardian Safe (4/5)",
    address: "0x2CFe3ec4d5a6811f4B8067F0DE7e47DfA938Aa30",
    hop: 1,
    category: "multisig",
    riskScore: 10,
    proxyType: "none",
    adminType: "safe",
    sourcifyStatus: "full_match",
    safeOwnerCount: 5,
    safeThreshold: 4,
    contractName: "GnosisSafeEmergencyGuardian",
  },
  {
    id: "demo-oracle-router",
    label: "Demo Oracle Router",
    address: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
    hop: 1,
    category: "oracle",
    riskScore: 2,
    proxyType: "none",
    adminType: "timelock",
    sourcifyStatus: "full_match",
    contractName: "DemoOracleRouter",
  },

  // Hop 2: External Transitive Feeds
  {
    id: "demo-feed-eth",
    label: "Chainlink ETH/USD Feed",
    address: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    hop: 2,
    category: "oracle",
    riskScore: 7,
    proxyType: "none",
    adminType: "none",
    sourcifyStatus: "full_match",
    referencedProtocolId: "chainlink-mainnet",
    oracleStaleness: 0.2,
    contractName: "EACAggregatorProxy_ETH_USD",
  },
  {
    id: "demo-feed-btc",
    label: "Chainlink BTC/USD Feed",
    address: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
    hop: 2,
    category: "oracle",
    riskScore: 7,
    proxyType: "none",
    adminType: "none",
    sourcifyStatus: "full_match",
    referencedProtocolId: "chainlink-mainnet",
    oracleStaleness: 0.35,
    contractName: "EACAggregatorProxy_BTC_USD",
  },
  {
    id: "demo-feed-usdc",
    label: "Chainlink USDC/USD Feed",
    address: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
    hop: 2,
    category: "oracle",
    riskScore: 7,
    proxyType: "none",
    adminType: "none",
    sourcifyStatus: "full_match",
    referencedProtocolId: "chainlink-mainnet",
    oracleStaleness: 0.28,
    contractName: "EACAggregatorProxy_USDC_USD",
  },
];

export const DEMO_BASELINE_EDGES: GraphEdge[] = [
  { from: "demo-pool-proxy", to: "demo-pool-impl", label: "EIP-1967 Impl", type: "proxy_implementation" },
  { from: "demo-pool-proxy", to: "demo-governance-timelock", label: "Admin Timelock", type: "governance" },
  { from: "demo-pool-proxy", to: "demo-oracle-router", label: "Price Oracle", type: "oracle" },
  { from: "demo-addresses-provider", to: "demo-pool-proxy", label: "Registers Pool", type: "registry" },
  { from: "demo-acl-manager", to: "demo-guardian-safe", label: "Emergency Guardian", type: "multisig" },
  { from: "demo-oracle-router", to: "demo-feed-eth", label: "ETH/USD Feed", type: "oracle_feed" },
  { from: "demo-oracle-router", to: "demo-feed-btc", label: "BTC/USD Feed", type: "oracle_feed" },
  { from: "demo-oracle-router", to: "demo-feed-usdc", label: "USDC/USD Feed", type: "oracle_feed" },
];

/**
 * Pure 7-Factor Scoring Calculation matching graph-service/src/scorer.ts
 */
export function scoreDemoNode(node: GraphNode, timelockHours = 48): {
  score: number;
  breakdown: ScoreBreakdown;
} {
  // F1. Verification Status (20 pts max)
  let f1 = 20;
  if (node.sourcifyStatus === "full_match") f1 = 0;
  else if (node.sourcifyStatus === "partial_match") f1 = 8;
  else f1 = 20;

  // F2. Admin Control (20 pts max)
  let f2 = 0;
  if (node.adminType === "none") {
    f2 = 0;
  } else if (node.adminType === "timelock") {
    const delay = timelockHours;
    if (delay >= 48) f2 = 2;
    else if (delay >= 24) f2 = 5;
    else f2 = 10;
  } else if (node.adminType === "safe") {
    const owners = node.safeOwnerCount || 1;
    const threshold = node.safeThreshold || 1;
    const ratio = threshold / owners;
    if (ratio >= 0.6) f2 = 7;
    else if (ratio >= 0.4) f2 = 12;
    else f2 = 16;
  } else if (node.adminType === "dao") {
    f2 = 4;
  } else if (node.adminType === "eoa") {
    f2 = 20;
  }

  // F3. Upgradeability (15 pts max)
  let f3 = 0;
  if (node.proxyType === "none" || !node.proxyType) f3 = 0;
  else if (node.proxyType === "eip1967") f3 = 10;
  else if (node.proxyType === "beacon") f3 = 12;
  else if (node.proxyType === "eip897") f3 = 8;

  // F4. Oracle Freshness (15 pts max)
  let f4 = 0;
  if (node.category === "oracle") {
    const ratio = node.oracleStaleness ?? 0.2;
    if (ratio < 0.5) f4 = 0;
    else if (ratio < 0.8) f4 = 3;
    else if (ratio < 1.0) f4 = 7;
    else if (ratio < 1.5) f4 = 11;
    else if (ratio < 2.0) f4 = 13;
    else f4 = 15;
  }

  // F5. Concentration Risk (15 pts max)
  let f5 = 0;
  if (node.category === "multisig" || node.adminType === "safe") {
    const owners = node.safeOwnerCount || 1;
    const threshold = node.safeThreshold || 1;
    const ratio = threshold / owners;
    if (ratio >= 0.6) f5 = 3;
    else if (ratio >= 0.4) f5 = 9;
    else f5 = 15;

    if (owners < 3) {
      f5 = Math.min(15, f5 + 5);
    }
  }

  // F6. Contract Age (10 pts max)
  const f6 = 1.5;

  // F7. Incident History (5 pts max)
  const f7 = 0;

  const rawTotal = f1 + f2 + f3 + f4 + f5 + f6 + f7;
  const totalScore = Number(Math.min(100, Math.max(0, rawTotal)).toFixed(1));

  return {
    score: totalScore,
    breakdown: {
      f1_verification: f1,
      f2_admin_control: f2,
      f3_upgradeability: f3,
      f4_oracle_freshness: f4,
      f5_concentration_risk: f5,
      f6_contract_age: f6,
      f7_incident_history: f7,
      totalScore,
    },
  };
}

/**
 * 2-Hop Risk Propagation Formula
 * compositeScore = hop0Avg * 1.0 + hop1Avg * 0.5 + hop2Avg * 0.25
 */
export function calculateDemoCompositeRisk(nodes: GraphNode[]): {
  compositeScore: number;
  riskTier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  breakdown: ScoreBreakdown;
} {
  const hop0Nodes = nodes.filter((n) => n.hop === 0);
  const hop1Nodes = nodes.filter((n) => n.hop === 1);
  const hop2Nodes = nodes.filter((n) => n.hop === 2);

  const avg = (arr: GraphNode[]) =>
    arr.length > 0 ? arr.reduce((acc, n) => acc + n.riskScore, 0) / arr.length : 0;

  const hop0Avg = avg(hop0Nodes);
  const hop1Avg = avg(hop1Nodes);
  const hop2Avg = avg(hop2Nodes);

  const composite = hop0Avg * 1.0 + hop1Avg * 0.5 + hop2Avg * 0.25;
  const compositeScore = Number(Math.min(100, Math.max(0, composite)).toFixed(1));

  let riskTier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (compositeScore <= 25.0) riskTier = "LOW";
  else if (compositeScore <= 50.0) riskTier = "MEDIUM";
  else if (compositeScore <= 75.0) riskTier = "HIGH";
  else riskTier = "CRITICAL";

  // Aggregate factor breakdown for root overview
  const aggF = (fn: (b: ScoreBreakdown) => number) => {
    const sum = nodes.reduce((acc, n) => {
      const b = (n as any).breakdown;
      return acc + (b ? fn(b) : 0);
    }, 0);
    return Number((sum / (nodes.length || 1)).toFixed(1));
  };

  const aggBreakdown: ScoreBreakdown = {
    f1_verification: aggF((b) => b.f1_verification),
    f2_admin_control: aggF((b) => b.f2_admin_control),
    f3_upgradeability: aggF((b) => b.f3_upgradeability),
    f4_oracle_freshness: aggF((b) => b.f4_oracle_freshness),
    f5_concentration_risk: aggF((b) => b.f5_concentration_risk),
    f6_contract_age: 1.5,
    f7_incident_history: 0,
    totalScore: compositeScore,
  };

  return { compositeScore, riskTier, breakdown: aggBreakdown };
}

/**
 * Deterministic Keccak-256 Fingerprint Calculation
 */
export function computeDemoFingerprint(nodes: GraphNode[]): string {
  const implHashes = nodes
    .filter((n) => n.category === "implementation")
    .map((n) => n.bytecodeHash || ethers.keccak256(ethers.toUtf8Bytes(n.address)))
    .sort()
    .join(":");

  const adminAddrs = nodes
    .filter((n) => n.adminAddress)
    .map((n) => ethers.getAddress(n.adminAddress!).toLowerCase())
    .sort()
    .join(":");

  const oracleFeeds = nodes
    .filter((n) => n.category === "oracle")
    .map((n) => ethers.getAddress(n.address).toLowerCase())
    .sort()
    .join(":");

  const deps = nodes
    .map((n) => ethers.getAddress(n.address).toLowerCase())
    .sort()
    .join(":");

  const composite = `${implHashes}|${adminAddrs}|${oracleFeeds}|${deps}`;
  return ethers.keccak256(ethers.toUtf8Bytes(composite));
}


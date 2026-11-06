import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface NodeAttributes {
  contractAddress: string;
  category: "proxy" | "implementation" | "oracle" | "multisig" | "token" | string;
  hop: number;
  sourcifyStatus: "full_match" | "partial_match" | "not_found";
  proxyType: "eip1967" | "beacon" | "eip897" | "none";
  adminType: "timelock" | "safe" | "eoa" | "dao" | "none";
  timelockDelayHours?: number;
  safeOwnerCount?: number;
  safeThreshold?: number;
  oracleStaleness?: number; // ratio: age / heartbeat
  contractAgeMonths?: number;
}

export interface FactorBreakdown {
  f1_verification: number;
  f2_admin_control: number;
  f3_upgradeability: number;
  f4_oracle_freshness: number;
  f5_concentration_risk: number;
  f6_contract_age: number;
  f7_incident_history: number;
  totalScore: number;
}

let exploitedAddressesSet: Set<string> | null = null;

function getExploitedAddresses(): Set<string> {
  if (exploitedAddressesSet) return exploitedAddressesSet;
  try {
    const filePath = path.resolve(__dirname, "../data/incidents.json");
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      exploitedAddressesSet = new Set(
        (data.exploitedAddresses || []).map((a: string) => a.toLowerCase())
      );
      return exploitedAddressesSet;
    }
  } catch (err) {
    console.warn("[Scorer] Error loading incidents.json:", err);
  }
  exploitedAddressesSet = new Set();
  return exploitedAddressesSet;
}

/**
 * Compute the 7 verifiable risk factors for an individual contract node
 */
export function scoreContractNode(node: NodeAttributes): {
  score: number;
  breakdown: FactorBreakdown;
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
    const delay = node.timelockDelayHours ?? 48;
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
  if (node.proxyType === "none") f3 = 0;
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
  let f6 = 0;
  const ageMonths = node.contractAgeMonths ?? 30; // Default: seasoned contract (>2 yrs)
  if (ageMonths >= 24) f6 = 0;
  else if (ageMonths >= 12) f6 = 3;
  else if (ageMonths >= 6) f6 = 6;
  else if (ageMonths >= 3) f6 = 8;
  else f6 = 10;

  // F7. Incident History (5 pts max)
  let f7 = 0;
  const exploited = getExploitedAddresses();
  if (exploited.has(node.contractAddress.toLowerCase())) {
    f7 = 5;
  }

  const rawTotal = f1 + f2 + f3 + f4 + f5 + f6 + f7;
  const totalScore = Math.min(100, Math.max(0, rawTotal));

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
 * Propagate risk across 2 hops to compute compositeScore and riskTier
 * compositeScore = hop0Avg * 1.0 + hop1Avg * 0.5 + hop2Avg * 0.25
 */
export function calculateCompositeRisk(nodes: Array<{ hop: number; riskScore: number }>): {
  compositeScore: number;
  riskTier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  hop0Avg: number;
  hop1Avg: number;
  hop2Avg: number;
} {
  const hop0Nodes = nodes.filter((n) => n.hop === 0);
  const hop1Nodes = nodes.filter((n) => n.hop === 1);
  const hop2Nodes = nodes.filter((n) => n.hop === 2);

  const avg = (arr: Array<{ riskScore: number }>) =>
    arr.length > 0 ? arr.reduce((acc, n) => acc + n.riskScore, 0) / arr.length : 0;

  const hop0Avg = Number(avg(hop0Nodes).toFixed(2));
  const hop1Avg = Number(avg(hop1Nodes).toFixed(2));
  const hop2Avg = Number(avg(hop2Nodes).toFixed(2));

  const composite = hop0Avg * 1.0 + hop1Avg * 0.5 + hop2Avg * 0.25;
  const compositeScore = Number(Math.min(100, Math.max(0, composite)).toFixed(2));

  let riskTier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (compositeScore <= 25.0) riskTier = "LOW";
  else if (compositeScore <= 50.0) riskTier = "MEDIUM";
  else if (compositeScore <= 75.0) riskTier = "HIGH";
  else riskTier = "CRITICAL";

  return {
    compositeScore,
    riskTier,
    hop0Avg,
    hop1Avg,
    hop2Avg,
  };
}


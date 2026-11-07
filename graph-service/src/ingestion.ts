import { ethers } from "ethers";
import { NodeEnricher } from "./enrichment.js";
import { scoreContractNode, calculateCompositeRisk } from "./scorer.js";
import { computeProtocolFingerprint } from "./fingerprint.js";
import { computeDriftFingerprint } from "./driftFingerprint.js";
import { ArkivStorageClient } from "../../storage/arkiv/client.js";
import { SwarmStorageClient } from "../../storage/swarm/client.js";

const EIP1967_IMPL_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const EIP1967_ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
const BEACON_SLOT = "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";

/** Verified Aave V3 seed contracts (PROJECT_SPEC.md Section 4.1). */
export const SEED_CONTRACTS = [
  // Hop 0: Core Contracts
  {
    id: "aave-v3-pool",
    label: "Pool (Proxy)",
    address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    category: "proxy",
    hop: 0,
    adminType: "timelock",
    adminAddress: "0x5300A1a15135EA4dc7aD5a167152C01EFc9b192A",
    referencedProtocolId: "",
  },
  {
    id: "aave-v3-addresses-provider",
    label: "PoolAddressesProvider",
    address: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
    category: "proxy",
    hop: 0,
    adminType: "timelock",
    adminAddress: "0x5300A1a15135EA4dc7aD5a167152C01EFc9b192A",
    referencedProtocolId: "",
  },
  {
    id: "aave-v3-acl-manager",
    label: "ACLManager",
    address: "0xc2aaCf6553D20d1e9d78E365AAba8032af9c85b0",
    category: "implementation",
    hop: 0,
    // DEFAULT_ADMIN is the Executor (delayed by the PayloadsController); the Safe is only EmergencyAdmin
    adminType: "timelock",
    adminAddress: "0x5300A1a15135EA4dc7aD5a167152C01EFc9b192A",
    referencedProtocolId: "",
  },
  {
    id: "aave-v3-pool-configurator",
    label: "PoolConfigurator (Proxy)",
    address: "0x64b761D848206f447Fe2dd461b0c635Ec39EbB27",
    category: "proxy",
    hop: 0,
    adminType: "timelock",
    adminAddress: "0x5300A1a15135EA4dc7aD5a167152C01EFc9b192A",
    referencedProtocolId: "",
  },
  {
    id: "aave-v3-oracle",
    label: "AaveOracle",
    address: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
    category: "oracle",
    hop: 0,
    adminType: "timelock",
    adminAddress: "0x5300A1a15135EA4dc7aD5a167152C01EFc9b192A",
    referencedProtocolId: "",
  },
  {
    id: "aave-v3-data-provider",
    label: "PoolDataProvider",
    address: "0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD",
    category: "implementation",
    hop: 0,
    adminType: "none",
    adminAddress: "",
    referencedProtocolId: "",
  },

  // Hop 1: Direct Dependencies (Implementation logic, Governance Timelock, Multisig)
  {
    id: "aave-v3-pool-impl",
    label: "Pool Implementation",
    address: "0x728a138A4823392C2EFA55e028d434F526fE03CF",
    category: "implementation",
    hop: 1,
    adminType: "timelock",
    adminAddress: "0x5300A1a15135EA4dc7aD5a167152C01EFc9b192A",
    referencedProtocolId: "",
  },
  {
    id: "aave-v3-governance-executor",
    label: "Governance Executor (Lvl1)",
    address: "0x5300A1a15135EA4dc7aD5a167152C01EFc9b192A",
    category: "implementation",
    hop: 1,
    adminType: "dao",
    adminAddress: "0xdAbad81aF85554E9ae636395611C58F7eC1aAEc5", // Governance V3 PayloadsController (executor.owner())
    referencedProtocolId: "",
  },
  {
    id: "aave-v3-emergency-safe",
    label: "Emergency Guardian Safe",
    address: "0x2CFe3ec4d5a6811f4B8067F0DE7e47DfA938Aa30",
    category: "multisig",
    hop: 1,
    adminType: "safe",
    adminAddress: "0x2CFe3ec4d5a6811f4B8067F0DE7e47DfA938Aa30",
    referencedProtocolId: "",
  },
  {
    id: "aave-v3-configurator-impl",
    label: "PoolConfigurator Impl",
    address: "0xFF42Ce30054dcE7dc7C1282a9a497aa58eaBCe99",
    category: "implementation",
    hop: 1,
    adminType: "timelock",
    adminAddress: "0x5300A1a15135EA4dc7aD5a167152C01EFc9b192A",
    referencedProtocolId: "",
  },

  // Hop 2: Transitive Dependencies (External Chainlink Feeds)
  {
    id: "chainlink-eth-usd",
    label: "Chainlink ETH/USD Feed",
    address: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    category: "oracle",
    hop: 2,
    adminType: "none",
    adminAddress: "",
    referencedProtocolId: "chainlink-mainnet",
  },
  {
    id: "chainlink-usdc-usd",
    label: "Chainlink USDC/USD Feed",
    address: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
    category: "oracle",
    hop: 2,
    adminType: "none",
    adminAddress: "",
    referencedProtocolId: "chainlink-mainnet",
  },
  {
    id: "chainlink-btc-usd",
    label: "Chainlink BTC/USD Feed",
    address: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
    category: "oracle",
    hop: 2,
    adminType: "none",
    adminAddress: "",
    referencedProtocolId: "chainlink-mainnet",
  },
  {
    id: "chainlink-dai-usd",
    label: "Chainlink DAI/USD Feed",
    address: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9",
    category: "oracle",
    hop: 2,
    adminType: "none",
    adminAddress: "",
    referencedProtocolId: "chainlink-mainnet",
  },
  {
    id: "chainlink-usdt-usd",
    label: "Chainlink USDT/USD Feed",
    address: "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D",
    category: "oracle",
    hop: 2,
    adminType: "none",
    adminAddress: "",
    referencedProtocolId: "chainlink-mainnet",
  },
];

/** Dependency topology between seed contracts (by node id). */
export const GRAPH_EDGES = [
  { from: "aave-v3-pool", to: "aave-v3-pool-impl", label: "EIP-1967 Implementation", type: "proxy_implementation" },
  { from: "aave-v3-pool", to: "aave-v3-governance-executor", label: "Admin Timelock", type: "governance" },
  { from: "aave-v3-pool", to: "aave-v3-oracle", label: "Price Oracle", type: "oracle" },
  { from: "aave-v3-addresses-provider", to: "aave-v3-pool", label: "Registers Pool", type: "registry" },
  { from: "aave-v3-addresses-provider", to: "aave-v3-pool-configurator", label: "Registers Configurator", type: "registry" },
  { from: "aave-v3-acl-manager", to: "aave-v3-emergency-safe", label: "Emergency Admin Safe", type: "multisig" },
  { from: "aave-v3-pool-configurator", to: "aave-v3-configurator-impl", label: "Configurator Impl", type: "proxy_implementation" },
  { from: "aave-v3-oracle", to: "chainlink-eth-usd", label: "ETH / USD Feed", type: "oracle_feed" },
  { from: "aave-v3-oracle", to: "chainlink-usdc-usd", label: "USDC / USD Feed", type: "oracle_feed" },
  { from: "aave-v3-oracle", to: "chainlink-btc-usd", label: "BTC / USD Feed", type: "oracle_feed" },
  { from: "aave-v3-oracle", to: "chainlink-dai-usd", label: "DAI / USD Feed", type: "oracle_feed" },
  { from: "aave-v3-oracle", to: "chainlink-usdt-usd", label: "USDT / USD Feed", type: "oracle_feed" },
];

export interface IngestionOptions {
  protocolId: string;
  rpcUrl?: string;
  triggeredBy?: "cron" | "log-event" | "manual";
}

export interface RebuildResult {
  snapshotId: string;
  protocolId: string;
  compositeScore: number;
  riskTier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evaluatedAtBlock: number;
  fingerprint: string;
  swarmGraphRef: string;
  swarmEvidenceRef: string;
  nodeCount: number;
  hopScores: {
    hop0Avg: number;
    hop1Avg: number;
    hop2Avg: number;
  };
  nodes: any[];
  edges: any[];
}

export class GraphIngestionEngine {
  private rpcProvider: ethers.JsonRpcProvider;
  private enricher: NodeEnricher;
  private arkivClient: ArkivStorageClient;
  private swarmClient: SwarmStorageClient;

  constructor(rpcUrl: string = "https://ethereum-rpc.publicnode.com") {
    this.rpcProvider = new ethers.JsonRpcProvider(rpcUrl);
    this.enricher = new NodeEnricher(rpcUrl);
    this.arkivClient = new ArkivStorageClient();
    this.swarmClient = new SwarmStorageClient();
  }

  /**
   * Upload to Swarm when configured. A failed upload is logged and recorded as an
   * empty reference; no fake reference is ever fabricated.
   */
  private timelockDelayCache = new Map<string, number>();

  private async getTimelockDelayHours(timelockAddress: string): Promise<number> {
    const key = ethers.getAddress(timelockAddress.toLowerCase());
    const cached = this.timelockDelayCache.get(key);
    if (cached !== undefined) return cached;
    const hours = await this.enricher.executorDelayHours(key);
    this.timelockDelayCache.set(key, hours);
    return hours;
  }

  private async tryUpload(data: unknown, fileName: string): Promise<string> {
    try {
      return await this.swarmClient.uploadJson(data, fileName);
    } catch (err: any) {
      console.warn(`[Swarm] Upload of ${fileName} skipped: ${err.message}`);
      return "";
    }
  }

  /**
   * Resolve proxy implementation and admin addresses via EIP-1967 slots
   */
  async resolveProxy(address: string): Promise<{
    proxyType: "eip1967" | "beacon" | "eip897" | "none";
    implementationAddress?: string;
    adminAddress?: string;
  }> {
    try {
      // 1. Check EIP-1967 Implementation Slot
      const rawImpl = await this.rpcProvider.getStorage(address, EIP1967_IMPL_SLOT);
      if (rawImpl && rawImpl !== "0x" + "0".repeat(64)) {
        const implAddr = ethers.getAddress("0x" + rawImpl.slice(26));
        let adminAddr: string | undefined;

        // Check EIP-1967 Admin Slot
        const rawAdmin = await this.rpcProvider.getStorage(address, EIP1967_ADMIN_SLOT);
        if (rawAdmin && rawAdmin !== "0x" + "0".repeat(64)) {
          adminAddr = ethers.getAddress("0x" + rawAdmin.slice(26));
        }

        return {
          proxyType: "eip1967",
          implementationAddress: implAddr,
          adminAddress: adminAddr,
        };
      }

      // 2. Check Beacon Proxy Slot
      const rawBeacon = await this.rpcProvider.getStorage(address, BEACON_SLOT);
      if (rawBeacon && rawBeacon !== "0x" + "0".repeat(64)) {
        return {
          proxyType: "beacon",
          implementationAddress: ethers.getAddress("0x" + rawBeacon.slice(26)),
        };
      }

      // 3. Check legacy EIP-897 implementation() view call
      try {
        const contract = new ethers.Contract(
          address,
          ["function implementation() external view returns (address)"],
          this.rpcProvider
        );
        const impl = await contract.implementation();
        if (impl && impl !== ethers.ZeroAddress) {
          return {
            proxyType: "eip897",
            implementationAddress: ethers.getAddress(impl.toLowerCase()),
          };
        }
      } catch {}

      return { proxyType: "none" };
    } catch (err) {
      console.warn(`[ProxyResolver] Error resolving ${address}:`, err);
      return { proxyType: "none" };
    }
  }

  /**
   * Rebuild the full 2-hop graph for a protocol (default: Aave V3 on Ethereum Mainnet)
   */
  async rebuildGraph(options: IngestionOptions): Promise<RebuildResult> {
    const protocolId = options.protocolId || "aave-v3-mainnet";
    const triggeredBy = options.triggeredBy || "manual";

    const blockNumber = await this.rpcProvider.getBlockNumber();

    const snapshotId = `${protocolId}-${blockNumber}`;
    console.log(`[Ingestion] Starting graph rebuild for ${protocolId} at block #${blockNumber}...`);

    // Define verified seed contracts for Aave V3 per PROJECT_SPEC.md Section 4.1
    const rawSeeds = SEED_CONTRACTS;

    // Enrich and score each node
    const enrichedNodes: any[] = [];
    const bytecodeDump: Record<string, any> = {};
    const auditLogs: any[] = [];

    const implBytecodeHashes: string[] = [];
    const adminAddresses: string[] = [];
    const oracleFeedAddresses: string[] = [];
    const depAddresses: string[] = [];

    // Pre-pass: real freshness of every Chainlink aggregator (hop 2). Registry-type oracles
    // (AaveOracle) are only as fresh as their stalest underlying feed.
    const feedInfo = new Map<string, { oracleStaleness: number; oracleHeartbeat: number }>();
    for (const seed of rawSeeds) {
      if (seed.category === "oracle" && seed.hop === 2) {
        const addr = ethers.getAddress(seed.address.toLowerCase());
        feedInfo.set(addr, await this.enricher.enrichOracleFeed(addr));
      }
    }
    const stalestFeed = Array.from(feedInfo.values()).sort((a, b) => b.oracleStaleness - a.oracleStaleness)[0];

    for (const raw of rawSeeds) {
      const checksum = ethers.getAddress(raw.address.toLowerCase());
      depAddresses.push(checksum);

      // Check proxy resolution
      // Real proxy type for every proxy-category node (PoolAddressesProvider is NOT a proxy)
      let proxyType: string = "none";
      if (raw.category === "proxy") {
        const res = await this.resolveProxy(checksum);
        proxyType = res.proxyType;
        console.log(
          `[Proxy] ${raw.label}: ${proxyType}${res.implementationAddress ? " -> Impl " + res.implementationAddress : ""}`
        );
      }

      // Safe multisig enrichment
      let safeOwnerCount = 0;
      let safeThreshold = 0;
      let safeOwners: string[] = [];
      if (raw.category === "multisig" || raw.adminType === "safe") {
        // A multisig node IS the Safe; a Safe-governed contract is read through its admin Safe
        const safeAddress = raw.category === "multisig" ? checksum : ethers.getAddress(raw.adminAddress.toLowerCase());
        const safeInfo = await this.enricher.enrichSafeMultisig(safeAddress);
        safeOwnerCount = safeInfo.safeOwnerCount;
        safeThreshold = safeInfo.safeThreshold;
        safeOwners = safeInfo.safeOwners;
      }

      // Oracle staleness enrichment (heartbeat inferred from the feed's own recent rounds)
      let oracleStaleness: number | undefined;
      let oracleHeartbeat = 0;
      if (raw.category === "oracle") {
        oracleFeedAddresses.push(checksum);
        const oracleInfo = feedInfo.get(checksum) ?? stalestFeed;
        if (!oracleInfo) throw new Error(`No Chainlink feed data available to score oracle ${raw.label}`);
        oracleStaleness = oracleInfo.oracleStaleness;
        oracleHeartbeat = oracleInfo.oracleHeartbeat;
      }

      // Bytecode info
      const { bytecode, hash: bytecodeHash } = await this.enricher.getBytecodeInfo(checksum);
      bytecodeDump[checksum] = { bytecode, bytecodeHash };
      if (raw.category === "implementation") {
        implBytecodeHashes.push(bytecodeHash);
      }

      if (raw.adminAddress) {
        adminAddresses.push(ethers.getAddress(raw.adminAddress.toLowerCase()));
      }

      // Sourcify verification + real deployment block -> real contract age
      const sourcifyInfo = await this.enricher.enrichSourcify(checksum);
      let contractAgeMonths = 0;
      if (sourcifyInfo.deploymentBlock !== undefined) {
        contractAgeMonths = await this.enricher.contractAgeMonths(sourcifyInfo.deploymentBlock);
      } else {
        // No verified deployment info: age is unknowable, so score it conservatively as brand new
        console.warn(`[Ingestion] ${raw.label} (${checksum}) has no verified deployment block; contract age scored as 0 months`);
      }

      // Real on-chain timelock delay for timelock-governed contracts
      const timelockDelayHours =
        raw.adminType === "timelock" ? await this.getTimelockDelayHours(raw.adminAddress) : undefined;

      // Score the node
      const { score: riskScore, breakdown } = scoreContractNode({
        contractAddress: checksum,
        category: raw.category,
        hop: raw.hop,
        sourcifyStatus: sourcifyInfo.sourcifyStatus,
        proxyType: proxyType as any,
        adminType: raw.adminType as any,
        timelockDelayHours,
        safeOwnerCount,
        safeThreshold,
        oracleStaleness,
        contractAgeMonths,
      });

      const nodeRecord = {
        id: raw.id,
        label: raw.label,
        address: checksum,
        contractAddress: checksum,
        protocolId,
        snapshotId,
        hop: raw.hop,
        category: raw.category,
        sourcifyStatus: sourcifyInfo.sourcifyStatus,
        riskScore,
        referencedProtocolId: raw.referencedProtocolId,
        proxyType,
        adminType: raw.adminType,
        adminAddress: raw.adminAddress ? ethers.getAddress(raw.adminAddress.toLowerCase()) : "",
        bytecodeHash,
        safeOwnerCount,
        safeThreshold,
        safeOwners,
        oracleStaleness: oracleStaleness ?? 0,
        oracleHeartbeat,
        contractAgeMonths,
        timelockDelayHours: timelockDelayHours ?? 0,
        contractName: sourcifyInfo.contractName,
        swarmBytecodeRef: "",
        updatedAt: blockNumber,
        breakdown,
      };

      auditLogs.push({
        address: checksum,
        label: raw.label,
        hop: raw.hop,
        proxyType,
        bytecodeHash,
        sourcifyStatus: sourcifyInfo.sourcifyStatus,
        riskScore,
      });

      enrichedNodes.push(nodeRecord);
    }

    // 2-Hop Risk Score Propagation
    const compositeCalc = calculateCompositeRisk(
      enrichedNodes.map((n) => ({ hop: n.hop, riskScore: n.riskScore }))
    );

    // Compute Deterministic Keccak256 Protocol Fingerprint
    const structuralFingerprint = computeProtocolFingerprint({
      implBytecodeHashes,
      adminAddresses,
      oracleFeedAddresses,
      depAddresses,
    });

    // Drift fingerprint: what the Chainlink CRE workflow recomputes on every sweep.
    // Stored as the snapshot fingerprint so CRE can compare live state vs. Arkiv.
    const { fingerprint } = await computeDriftFingerprint(this.rpcProvider);
    console.log(`[Ingestion] Drift fingerprint: ${fingerprint}`);

    // Define Graph Edges
    const edges = GRAPH_EDGES;

    const crossProtocolEdges = [
      { fromProtocol: "aave-v3-mainnet", toProtocol: "chainlink-mainnet", relationship: "PRICE_FEED_DEPENDENCY" },
    ];

    // Swarm Blobs Construction
    console.log(`[Swarm] Packaging and uploading Swarm artifacts...`);
    const bytecodeDumpRef = await this.tryUpload(bytecodeDump, "bytecode-dump.json");
    for (const node of enrichedNodes) {
      node.swarmBytecodeRef = bytecodeDumpRef;
    }

    const fullGraphPayload = {
      protocolId,
      snapshotId,
      evaluatedAtBlock: blockNumber,
      compositeScore: compositeCalc.compositeScore,
      riskTier: compositeCalc.riskTier,
      fingerprint,
      nodes: enrichedNodes,
      edges,
      crossProtocolEdges,
    };
    const swarmGraphRef = await this.tryUpload(fullGraphPayload, "full-graph.json");

    const auditLogPayload = {
      protocolId,
      snapshotId,
      blockNumber,
      triggeredBy,
      fingerprint,
      auditLogs,
      timestamp: new Date().toISOString(),
    };
    const swarmEvidenceRef = await this.tryUpload(auditLogPayload, "audit-log.json");

    const protocolMetaPayload = {
      protocolId,
      name: "Aave V3",
      category: "lending",
      chainId: "1",
      version: "3.1.0",
      sourceRepo: "https://github.com/bgd-labs/aave-address-book",
      snapshotId,
      evaluatedAtBlock: blockNumber,
      fingerprint,
      generatedAt: new Date().toISOString(),
    };
    const swarmMetaRef = await this.tryUpload(protocolMetaPayload, "protocol-meta.json");

    // Arkiv Structured Persistence (BTL)
    console.log(`[Arkiv] Writing structured entities to Arkiv Rabdi...`);
    await this.arkivClient.saveProtocol({
      protocolId,
      name: "Aave V3",
      category: "lending",
      chainId: "1",
      version: "3.1.0",
      sourceRepo: "https://github.com/bgd-labs/aave-address-book",
      swarmMetaRef,
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
    });

    const arkivContractNodes = enrichedNodes.map((n) => ({
      contractAddress: n.contractAddress,
      protocolId: n.protocolId,
      snapshotId: n.snapshotId,
      hop: BigInt(n.hop),
      category: n.category,
      sourcifyStatus: n.sourcifyStatus,
      riskScore: String(n.riskScore),
      referencedProtocolId: n.referencedProtocolId || "",
      proxyType: n.proxyType,
      adminType: n.adminType,
      adminAddress: n.adminAddress || "",
      bytecodeHash: n.bytecodeHash,
      safeOwnerCount: BigInt(n.safeOwnerCount || 0),
      safeThreshold: BigInt(n.safeThreshold || 0),
      safeOwners: Buffer.from(JSON.stringify(n.safeOwners || [])),
      oracleStaleness: String(n.oracleStaleness || 0),
      oracleHeartbeat: BigInt(n.oracleHeartbeat || 0),
      contractName: n.contractName || "",
      contractAgeMonths: n.contractAgeMonths,
      timelockDelayHours: n.timelockDelayHours,
      swarmBytecodeRef: n.swarmBytecodeRef,
      updatedAt: BigInt(blockNumber),
    }));

    await this.arkivClient.saveContractNodes(arkivContractNodes);

    await this.arkivClient.saveRiskSnapshot({
      snapshotId,
      protocolId,
      compositeScore: compositeCalc.compositeScore,
      riskTier: compositeCalc.riskTier,
      evaluatedAt: BigInt(blockNumber),
      fingerprint,
      swarmGraphRef,
      swarmEvidenceRef,
      triggeredBy,
      hop0AvgScore: compositeCalc.hop0Avg,
      hop1AvgScore: compositeCalc.hop1Avg,
      hop2AvgScore: compositeCalc.hop2Avg,
      nodeCount: BigInt(enrichedNodes.length),
    });

    console.log(`[Ingestion] Graph rebuild complete! Composite score: ${compositeCalc.compositeScore} (${compositeCalc.riskTier})`);

    return {
      snapshotId,
      protocolId,
      compositeScore: compositeCalc.compositeScore,
      riskTier: compositeCalc.riskTier,
      evaluatedAtBlock: blockNumber,
      fingerprint,
      swarmGraphRef,
      swarmEvidenceRef,
      nodeCount: enrichedNodes.length,
      hopScores: {
        hop0Avg: compositeCalc.hop0Avg,
        hop1Avg: compositeCalc.hop1Avg,
        hop2Avg: compositeCalc.hop2Avg,
      },
      nodes: enrichedNodes,
      edges,
    };
  }
}

// CLI direct run support
if (process.argv[1]?.endsWith("ingestion.ts") || process.argv[1]?.endsWith("ingestion.js")) {
  const engine = new GraphIngestionEngine();
  engine
    .rebuildGraph({ protocolId: "aave-v3-mainnet", triggeredBy: "manual" })
    .then((res) => {
      console.log("\n================ REBUILD SUMMARY ================");
      console.log("Snapshot ID     :", res.snapshotId);
      console.log("Composite Score :", res.compositeScore, `(${res.riskTier})`);
      console.log("Risk Tier       :", res.riskTier);
      console.log("Fingerprint     :", res.fingerprint);
      console.log("Swarm Graph Ref :", res.swarmGraphRef);
      console.log("Node Count      :", res.nodeCount);
      console.log("Hop 0 Avg       :", res.hopScores.hop0Avg);
      console.log("Hop 1 Avg       :", res.hopScores.hop1Avg);
      console.log("Hop 2 Avg       :", res.hopScores.hop2Avg);
      console.log("=================================================");
    })
    .catch((err) => {
      console.error("Ingestion failed:", err);
      process.exit(1);
    });
}

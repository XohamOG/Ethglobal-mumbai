# DeFi Provenance Graph — Master Production Implementation Specification & Task Delegation

> **Authoritative Specification Document**  
> **Status:** FINAL APPROVED ARCHITECTURE  
> **Target Demo:** Aave V3 on Ethereum Mainnet  
> **Target Networks:** Arkiv Rabdi Testnet (Chain ID 7794095) + Ethereum Mainnet (Ingestion) + EVM Testnet (RiskRegistry contract)  
> **Target Sponsors:** Chainlink (CRE track), Arkiv ($15K track + Swarm bonus)

---

## 1. Executive Summary & Vision

**DeFi Provenance Graph** is a decentralized dependency intelligence and asset risk scoring engine for EVM protocols. The system:
1. Reconstructs a protocol’s smart contract dependency graph up to **2 hops** deep (core contracts, direct dependencies, and transitive dependencies).
2. Performs **proxy resolution** (EIP-1967 slots, beacon proxies, legacy proxies) to extract active implementation logic bytecodes.
3. Scores each contract node across **7 verifiable risk factors** (verification status, governance/admin centralization, upgradeability, oracle freshness, signer concentration, contract age, incident history).
4. Propagates risk through a **2-hop weighted score model** to compute a single protocol-wide `compositeScore` and `riskTier`.
5. Computes a deterministic **protocol fingerprint** over implementation bytecodes, admin addresses, oracle feeds, and dependency edges.
6. Persists queryable structured entities in **Arkiv** with block-time lifetime (**BTL**) cache expiration.
7. Stores full graph topologies, adjacency lists, and raw cryptographic audit traces in **Swarm**.
8. Automates real-time risk updates via **Chainlink Runtime Environment (CRE)** through event log triggers and periodic cron sweeps that attest scores on-chain in `RiskRegistry.sol`.

---

## 2. Architecture Diagram & End-to-End Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Data Ingestion Sources                          │
│  @bgd-labs/aave-address-book  │  Ethereum RPC (Mainnet)                │
│  Arkiv Sourcify Mirror        │  Safe Transaction Service API          │
│  Chainlink Feed Registry      │  Curated Exploit/Incident List         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ingest & traverse
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               Graph Service Engine (TypeScript, vedaXD)                │
│  1. Build Protocol Address Map (address -> protocolId)                 │
│  2. Seed Hop-0 core contracts from address book                        │
│  3. Resolve proxies via EIP-1967 storage slots -> Hop-1 implementations│
│  4. Enrich nodes: Arkiv Sourcify Mirror, Safe API, Chainlink Feeds     │
│  5. Traverse Hop-2: reserves -> AaveOracle feeds -> Chainlink proxies  │
│  6. Score all nodes across 7 factors -> 2-hop propagation              │
│  7. Compute Keccak256 Protocol Fingerprint                             │
│  8. Write JSON artifacts -> Swarm                                      │
│  9. Write structured entities -> Arkiv (with BTL)                      │
│ 10. Expose POST /rebuild endpoint for Chainlink CRE                    │
└───────────────┬───────────────────────────────────────┬────────────────┘
                │ write full blobs                      │ write queryable entities
                ▼                                       ▼
┌───────────────────────────────────┐   ┌────────────────────────────────┐
│           Swarm Storage           │   │         Arkiv Database         │
│  - full-graph.json                │   │  - ProtocolRegistry (Macro)    │
│  - audit-log.json                 │   │  - ContractNode (Micro)        │
│  - bytecode-dump.json             │   │  - RiskSnapshot (Macro + BTL)  │
└─────────────────┬─────────────────┘   └───────────────┬────────────────┘
                  │ swarmGraphRef                       │ read directly
                  │                                     │ (via @arkiv-network/sdk)
                  ▼                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Next.js Frontend (XohamOG)                        │
│  - Protocol Search & Macro Ecosystem Dependency Contagion Graph        │
│  - Interactive 2-Hop Graph Visualization (Nodes & Categorized Edges)   │
│  - Detailed Node Risk Inspector & Safe Signer Metadata Panel           │
│  - Real-time Activity Log (CRE Rebuilds & On-Chain Attestation Feed)   │
└────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ read on-chain score
┌───────────────────────────────────┴────────────────────────────────────┐
│                    RiskRegistry.sol (Ishapalkar)                       │
│  - Stores latest compositeScore per protocolId                         │
│  - Authenticated write access restricted to Chainlink CRE Forwarder    │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ reportRisk()
┌───────────────────────────────────┴────────────────────────────────────┐
│                   Chainlink CRE Workflows (Ishapalkar)                 │
│  Workflow 1: Cron Sweep (every 24h) -> fingerprint check -> POST /rebuild
│  Workflow 2: Log Trigger (Upgraded, AdminChanged) -> POST /rebuild     │
│  Action: Call Graph Service HTTP -> report compositeScore on-chain     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Storage Architecture: Arkiv & Swarm

> [!IMPORTANT]
> **Decentralized Storage Mandate (Per AGENTS.md)**:  
> **NO Postgres, MongoDB, or Neo4j as primary storage.**  
> Arkiv is the structured queryable layer. Swarm is the blob artifact layer.

### 3.1 Arkiv Entity Schemas (`@arkiv-network/sdk@1.0.1`, Rabdi Testnet Chain ID 7794095)

#### Entity 1: `ProtocolRegistry` (Macro Entity — Permanent Identity)
- **Tag:** `protocol_registry_v1`
- **Lifetime:** `ExpirationTime.max()` (Near-permanent)
- **Cardinality:** 1 entity per protocol.

```typescript
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
```

#### Entity 2: `ContractNode` (Micro Entity — Contract Graph Node)
- **Tag:** `contract_node_v1`
- **Lifetime:** Medium BTL (refreshed on each rebuild, ~50,000 blocks)
- **Cardinality:** N entities per protocol evaluation run.

```typescript
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
  oracleHeartbeat:      u64(),           // Expected heartbeat in seconds
  contractName:         str(),           // Human-readable name from Sourcify mirror
  swarmBytecodeRef:     str(),           // Swarm hash -> bytecode-dump.json
  updatedAt:            u64(),           // Block number of enrichment
});
```

#### Entity 3: `RiskSnapshot` (Macro Entity — Evaluation Run with BTL)
- **Tag:** `risk_snapshot_v1`
- **Lifetime:** Block-time lifetime (~50,000 blocks ≈ 7 days). Naturally expires and is excluded from queries.
- **Cardinality:** 1 per evaluation run per protocol.

```typescript
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
```

### 3.2 Swarm Blobs & Content Payloads

1. **`full-graph.json`** (`RiskSnapshot.swarmGraphRef`):
   Contains complete node attributes, adjacency list of edges (`{from, to, label, type}`), and cross-protocol edges (`protocolEdges`). Loaded by frontend for WebGL/SVG visualization.
2. **`audit-log.json`** (`RiskSnapshot.swarmEvidenceRef`):
   Cryptographic audit trail containing raw RPC responses, `eth_getStorageAt` values, `latestRoundData` outputs, and Sourcify match metadata.
3. **`bytecode-dump.json`** (`ContractNode.swarmBytecodeRef`):
   Raw runtime bytecode hex and storage slot dumps for forensic verifiability.
4. **`protocol-meta.json`** (`ProtocolRegistry.swarmMetaRef`):
   Comprehensive protocol documentation, developer contact, source repo snapshots, and package version manifests.

---

## 4. Graph Construction & Data Ingestion Details (Aave V3)

### 4.1 Real Mainnet Contract Addresses

| Hop | Contract Label | Address | Category | Discovery Source |
|---|---|---|---|---|
| **Hop 0** | Pool (Proxy) | `0x87870Bca3F3fD6335c3F4cE8392d69350b4F4E2` | `proxy` (EIP-1967) | Address Book Seed |
| **Hop 0** | PoolAddressesProvider | `0x2f39d218133AFaB8F2B819B1066c7f434ad94e9e` | `proxy` (EIP-1967) | Address Book Seed |
| **Hop 0** | ACLManager | `0xc2aaCf6553D20d1e9d78E365AAba8032af9c85b0` | `implementation` | Address Book Seed |
| **Hop 0** | PoolConfigurator (Proxy) | `0x64b761D848206f447Fe2dd461b0c635Ec39EbB27` | `proxy` (EIP-1967) | Address Book Seed |
| **Hop 0** | AaveOracle | `0x54586bE6333240e3ef4a78248c410Bf33060Ca0C2` | `oracle` | Address Book Seed |
| **Hop 0** | PoolDataProvider | `0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3` | `implementation` | Address Book Seed |
| **Hop 1** | Pool Implementation | `0x5FAab9E1adbddaD0a08734BE8a52185Fd6558E14` | `implementation` | EIP-1967 Slot `0x360894...` on Pool |
| **Hop 1** | Governance Timelock (Executor) | `0xEE56e2B3D491590B5b31738cC34d5232F378a8D5` | `implementation` | EIP-1967 Admin Slot `0xb53127...` |
| **Hop 1** | Emergency Guardian Safe | `0x2CFe3ec4d5a6811f4B8067F0DE7e47DfA938Aa30` | `multisig` (Safe 4/7) | `ACLManager.hasRole(EMERGENCY_ADMIN)` |
| **Hop 1** | PoolConfigurator Impl | Resolved dynamically via RPC slot | `implementation` | EIP-1967 Slot on Configurator |
| **Hop 2** | Chainlink ETH/USD Feed | `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` | `oracle` | `AaveOracle.getSourceOfAsset(WETH)` |
| **Hop 2** | Chainlink USDC/USD Feed | `0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6` | `oracle` | `AaveOracle.getSourceOfAsset(USDC)` |
| **Hop 2** | Chainlink BTC/USD Feed | `0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c` | `oracle` | `AaveOracle.getSourceOfAsset(WBTC)` |
| **Hop 2** | Chainlink DAI/USD Feed | `0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9` | `oracle` | `AaveOracle.getSourceOfAsset(DAI)` |
| **Hop 2** | Chainlink USDT/USD Feed | `0x3E7d1eAB13ad0104d2750B8863b489D65364e32D` | `oracle` | `AaveOracle.getSourceOfAsset(USDT)` |

### 4.2 Proxy Resolution Mechanism
For every contract address:
1. `eth_getStorageAt(addr, "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc")` -> Implementation Address. If non-zero -> `proxyType = "eip1967"`.
2. `eth_getStorageAt(addr, "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103")` -> Admin Address.
3. If zero, test Beacon Proxy slot: `0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50`.
4. If zero, attempt `implementation()` view call (EIP-897 legacy).
5. The resolved implementation address is added as a child `ContractNode` at `hop + 1`.

### 4.3 Node Enrichment Process
- **Verification:** Query Arkiv Sourcify Mirror (`sourcify.arkiv.network` via `@arkiv-network/sdk`). If found, retrieve `matchType`, `name`, `compiler`. If missing, set `sourcifyStatus = "not_found"`.
- **Multisig Governance:** If admin is a Safe (e.g., `0x2CFe3ec...`), call Safe Transaction API (`https://safe-transaction-mainnet.safe.global/api/v1/safes/{addr}/`) to fetch `owners` array and `threshold`. Store owners as JSON in `safeOwners` (metadata column).
- **Oracle Staleness:** For `category == "oracle"`, call `latestRoundData()` on-chain. Compare `(block.timestamp - updatedAt)` against heartbeat (3600s or 86400s) to calculate `oracleStaleness`.

---

## 5. Risk Scoring & Propagation Metric

### 5.1 The 7 Scoring Factors

| Factor | Weight | Evaluation Criteria |
|---|---|---|
| **F1. Verification Status** | 20 pts max | `full_match` = 0 pts; `partial_match` = 8 pts; `not_found` = 20 pts |
| **F2. Admin Control** | 20 pts max | Timelock ≥48h = 2 pts; Timelock 24–48h = 5 pts; Safe (threshold ratio ≥ 0.6) = 7 pts; Safe (0.4–0.6) = 12 pts; Safe (<0.4) = 16 pts; Single EOA = 20 pts; Renounced/None = 0 pts |
| **F3. Upgradeability** | 15 pts max | Immutable (`proxyType == "none"`) = 0 pts; EIP-1967 = 10 pts; Beacon = 12 pts; EIP-897 = 8 pts |
| **F4. Oracle Freshness** | 15 pts max | Staleness ratio (`age/heartbeat`): `<0.5` = 0 pts; `0.5–0.8` = 3 pts; `0.8–1.0` = 7 pts; `1.0–1.5` = 11 pts; `1.5–2.0` = 13 pts; `≥2.0` = 15 pts |
| **F5. Concentration Risk** | 15 pts max | Multisig threshold ratio (`threshold/ownerCount`): `≥0.6` = 3 pts; `0.4–0.6` = 9 pts; `<0.4` = 15 pts. Add +5 pts if `ownerCount < 3`. |
| **F6. Contract Age** | 10 pts max | Age ≥ 2 years = 0 pts; 1–2 years = 3 pts; 6–12 months = 6 pts; 3–6 months = 8 pts; < 3 months = 10 pts |
| **F7. Incident History** | 5 pts max | Deployed address present in curated exploit list (`incidents.json`) = 5 pts; clean = 0 pts |

### 5.2 Two-Hop Score Propagation Formula

$$\text{compositeScore} = \text{hop0Avg} \times 1.0 + \text{hop1Avg} \times 0.5 + \text{hop2Avg} \times 0.25$$

*(Capped at 100 max)*

### 5.3 Risk Tiers
- **`LOW`**: 0.0 – 25.0 *(Aave V3 evaluates to ~10.3)*
- **`MEDIUM`**: 25.1 – 50.0
- **`HIGH`**: 50.1 – 75.0
- **`CRITICAL`**: 75.1 – 100.0

---

## 6. Deterministic Protocol Fingerprint

Used by Chainlink CRE to detect on-chain drift without re-running heavy graph analytics:

$$\text{fingerprint} = \text{keccak256}\Big(\text{implBytecodeHashes} \parallel \text{adminAddresses} \parallel \text{oracleFeedAddresses} \parallel \text{depAddresses}\Big)$$

- **Implementation Bytecode Hashes:** Extracted from resolved proxy implementations (Hop 1). If Pool upgrades, bytecode hash changes!
- **Admin Addresses:** Captures multisig/timelock changes.
- **Oracle Feed Addresses:** Captures addition/removal of asset feeds in AaveOracle.
- **Dependency Addresses:** Captures core component swaps.

---

## 7. Chainlink CRE & On-Chain Contract Specifications

### 7.1 `RiskRegistry.sol` (EVM Testnet)
Contract tracking verifiable provenance scores:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RiskRegistry {
    address public immutable creForwarder;

    struct RiskReport {
        uint256 compositeScore; // Scaled by 1e2 (e.g. 1030 = 10.30)
        string riskTier;        // "LOW", "MEDIUM", "HIGH", "CRITICAL"
        string snapshotId;      // Foreign key to Arkiv RiskSnapshot
        uint256 blockNumber;
        uint256 reportedAt;
    }

    mapping(string => RiskReport) public latestReports;

    event RiskReported(
        string indexed protocolId,
        uint256 compositeScore,
        string riskTier,
        string snapshotId,
        uint256 blockNumber
    );

    error UnauthorizedForwarder();

    modifier onlyForwarder() {
        if (msg.sender != creForwarder) revert UnauthorizedForwarder();
        _;
    }

    constructor(address _creForwarder) {
        creForwarder = _creForwarder;
    }

    function reportRisk(
        string calldata protocolId,
        uint256 compositeScore,
        string calldata riskTier,
        string calldata snapshotId,
        uint256 blockNumber
    ) external onlyForwarder {
        latestReports[protocolId] = RiskReport({
            compositeScore: compositeScore,
            riskTier: riskTier,
            snapshotId: snapshotId,
            blockNumber: blockNumber,
            reportedAt: block.timestamp
        });

        emit RiskReported(protocolId, compositeScore, riskTier, snapshotId, blockNumber);
    }

    function getRisk(string calldata protocolId) external view returns (RiskReport memory) {
        return latestReports[protocolId];
    }
}
```

### 7.2 CRE Workflows
1. **Cron Sweep (`cre/cron-sweep/`)**: Fires every 7,200 blocks. Computes current fingerprint, queries latest `RiskSnapshot` on Arkiv. If fingerprint mismatches, dispatches `POST /rebuild` to Graph Service.
2. **Log Trigger (`cre/log-trigger/`)**: Watches for `Upgraded(address)` on `0x87870Bca...` (Pool Proxy) and `AdminChanged(...)` events. Fires immediate `POST /rebuild`.
3. **Attestation Action**: When a rebuild finishes, CRE calls `RiskRegistry.reportRisk()` with verified scores.

---

## 8. Exact Team Task Delegation

| Developer | Folder Ownership | Exact Deliverables |
|---|---|---|
| **`vedaXD`** | `graph-service/`<br/>`storage/` | 1. Implement Arkiv schemas (`storage/arkiv/schemas.ts`) with `@arkiv-network/sdk@1.0.1`.<br/>2. Implement Swarm blob uploader (`storage/swarm/client.ts`).<br/>3. Implement graph ingestion & proxy resolution in `graph-service/src/ingestion.ts`.<br/>4. Implement Arkiv Sourcify Mirror reader & Safe API client in `graph-service/src/enrichment.ts`.<br/>5. Implement 7-factor scoring & 2-hop propagation in `graph-service/src/scorer.ts`.<br/>6. Implement deterministic fingerprinting in `graph-service/src/fingerprint.ts`.<br/>7. Expose Express/Fastify HTTP server with `POST /rebuild` in `graph-service/src/server.ts`. |
| **`Ishapalkar`** | `contracts/`<br/>`cre/` | 1. Implement and deploy `RiskRegistry.sol` (`contracts/RiskRegistry.sol`) on testnet.<br/>2. Author Chainlink CRE Cron Sweep workflow (`cre/workflows/cron.yaml` / `.ts`).<br/>3. Author Chainlink CRE Log Trigger workflow (`cre/workflows/log_trigger.yaml` / `.ts`).<br/>4. Connect CRE action to dispatch `POST /rebuild` and invoke `RiskRegistry.reportRisk()`. |
| **`XohamOG`** | `frontend/` | 1. Setup Next.js 14 dashboard with TailwindCSS.<br/>2. Integrate `@arkiv-network/sdk` to query `ProtocolRegistry`, `RiskSnapshot`, and `ContractNode` directly in client/server components.<br/>3. Integrate Swarm reader to fetch `full-graph.json` via content hash.<br/>4. Build interactive 2-hop graph visualizer (highlighting proxies, impls, oracles, Safe nodes).<br/>5. Build Protocol Macro Contagion Explorer (`referencedProtocolId` links).<br/>6. Build Node Inspector detail modal (Sourcify verification badges, Safe signer list metadata, risk factor breakdown).<br/>7. Build real-time Activity Feed listening to `RiskReported` events from `RiskRegistry.sol`. |

---

## 9. Branch Synchronization Instructions

All developers must pull this authoritative specification file into their local branches:

```bash
# From your own branch (e.g. agent/vedaXD or agent/ishapalkar):
git fetch origin agent/xohamOG
git checkout origin/agent/xohamOG -- docs/PROJECT_SPEC.md
git add docs/PROJECT_SPEC.md
git commit -m "docs: sync authoritative PROJECT_SPEC.md from agent/xohamOG"
```


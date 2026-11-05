# DeFi Provenance Graph — Master Project Plan

> **Last updated**: 2026-11-06  
> **Status**: Planning phase — awaiting team review  
> **Branch model**: `agent/xohamOG` (XohamOG), `agent/ishapalkar` (Ishapalkar), `agent/vedaXD` (vedaXD)

---

## Table of Contents

1. [One-Liner](#one-liner)
2. [Problem Statement](#problem-statement)
3. [Project Scope](#project-scope)
4. [High-Level Architecture](#high-level-architecture)
5. [Component Breakdown](#component-breakdown)
6. [Arkiv + Swarm Storage Schema](#arkiv--swarm-storage-schema)
7. [Data Sources](#data-sources)
8. [Risk Scoring Model](#risk-scoring-model)
9. [Chainlink CRE Workflows](#chainlink-cre-workflows)
10. [Demo Flow](#demo-flow)
11. [Sponsor Fit](#sponsor-fit)
12. [Open Assumptions & TODOs](#open-assumptions--todos)
13. [Team Responsibilities](#team-responsibilities)

---

## One-Liner

A **decentralized dependency-graph risk scorer** for EVM protocols. It maps any protocol's contracts up to 2 hops, scores each node for risk, propagates scores across dependencies, stores verifiable snapshots in Arkiv with BTL-based expiration, archives full graph evidence in Swarm, and keeps data fresh via Chainlink CRE triggers. Demo use case: **Aave V3 on Ethereum mainnet**.

---

## Problem Statement

DeFi protocols depend on dozens of external contracts — oracles, proxies, multisigs, tokens — that they don't control. A vulnerability in any dependency can cascade into a protocol-wide exploit. Today there is **no public, automated, decentralized registry** that:

- Maps these multi-hop dependencies
- Scores each contract for risk
- Keeps scores current as contracts upgrade
- Stores evidence in a verifiable, permissionless, queryable form

Existing tools (DeFiSafety, DefiLlama, Gauntlet) are either manual, centralized, or private.

---

## Project Scope

**In scope (hackathon):**
- Aave V3 on Ethereum mainnet as the primary demo protocol
- 2-hop dependency graph (hop 0 = core contracts, hop 1 = direct deps, hop 2 = transitive deps)
- Protocol-agnostic architecture (the graph service works for any EVM protocol)
- Arkiv storage (Rabdi testnet, Chain ID 7794095)
- Swarm blob storage for full graph + evidence
- Chainlink CRE workflows (cron sweep + log trigger)
- `RiskRegistry.sol` on a testnet (stores latest score per protocol)
- Next.js frontend: search, risk breakdown, graph view, activity log

**Stretch goals (post-hackathon):**
- Multi-chain support (Polygon, Arbitrum, Base)
- Additional protocols (Uniswap V3, Compound V3, Lido)
- Open protocol registry (permissionless submissions)
- Fallback to Sourcify v2 API for newly verified contracts not yet in Arkiv mirror

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Data Sources                                  │
│  Protocol Address Book │ Ethereum RPC │ Arkiv Sourcify Mirror        │
│  Safe Transaction Svc  │ Chainlink Feeds                             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ ingest
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Graph Service (TypeScript)                       │
│  1. Seed hop-0 addresses from protocol address book                  │
│  2. Traverse dependencies via RPC (EIP-1967 proxy slots, bytecode)   │
│  3. Enrich each node (Sourcify via Arkiv mirror, Safe API, Chainlink)│
│  4. Score each node → propagate 2-hop risk scores                   │
│  5. Compute fingerprint hash                                         │
│  6. Write full graph JSON → Swarm                                    │
│  7. Write indexed snapshot entities → Arkiv                          │
└──────────┬────────────────────────────────┬────────────────────────-┘
           │ write                          │ write
           ▼                               ▼
┌──────────────────┐             ┌─────────────────────────────┐
│   Swarm Storage  │             │       Arkiv (Rabdi)          │
│  full-graph.json │             │  ProtocolRegistry (Macro)    │
│  audit-log.json  │             │  ContractNode (Micro)        │
│  bytecode dumps  │             │  RiskSnapshot (Macro, +BTL)  │
└──────────────────┘             └──────────────┬──────────────┘
           ▲                                    │ reference
           │ swarmGraphRef                      │ read
           │                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│               Chainlink CRE Workflows                             │
│  Cron sweep: compare fingerprint → trigger rebuild on mismatch    │
│  Log trigger: on upgrade/admin events → immediate rebuild         │
│  On-chain report → RiskRegistry.sol                              │
└──────────────────────────────────────────────────────────────────┘
           │ report
           ▼
┌──────────────────────────────────────────────────────────────────┐
│               RiskRegistry.sol (EVM Testnet)                      │
│  Stores latest compositeScore per protocolId                      │
│  Only accepts reports from CRE forwarder address                  │
└──────────────────────────────────────────────────────────────────┘
           │ read
           ▼
┌──────────────────────────────────────────────────────────────────┐
│               Next.js Frontend                                    │
│  Search protocols by name/category                               │
│  Risk breakdown by hop (0, 1, 2)                                 │
│  Graph visualization (nodes + edges)                              │
│  Activity log (CRE trigger events)                               │
│  Snapshot timeline (current + expired Arkiv entities)            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

| Component | Owner | Stack | Directory |
|---|---|---|---|
| **Graph Service** | `vedaXD` | TypeScript, Node.js | `graph-service/` |
| **Arkiv Storage Client** | `vedaXD` | TypeScript, `@arkiv-network/sdk@1.0.1` | `storage/arkiv/` |
| **Swarm Storage Client** | `vedaXD` | TypeScript, Swarm HTTP API | `storage/swarm/` |
| **Smart Contracts** | `Ishapalkar` | Solidity, Hardhat/Foundry | `contracts/` |
| **Chainlink CRE Workflows** | `Ishapalkar` | CRE YAML / JS adapters | `cre/` |
| **Frontend** | `XohamOG` | Next.js 14, TypeScript, TailwindCSS | `frontend/` |

---

## Arkiv + Swarm Storage Schema

### Entity Types (Arkiv — Rabdi Testnet)

#### 1. `ProtocolRegistry` — Macro Entity
One entity per protocol. Long BTL (near-permanent). Stable identity record.

| Field | Type | Indexed | Purpose |
|---|---|---|---|
| `protocolId` | `str` | ✅ | Slug: `aave-v3-mainnet`, `uniswap-v3-mainnet` |
| `name` | `str` | ✅ | Display name |
| `category` | `str` | ✅ | `lending`, `dex`, `bridge`, `staking`, `vault` |
| `chainId` | `str` | ✅ | EIP-155 chain ID, e.g. `"1"` |
| `version` | `str` | — | Protocol version |
| `sourceRepo` | `str` | — | GitHub URL for address book |
| `swarmMetaRef` | `str` | — | Swarm hash → full metadata blob |
| `createdAt` | `u64` | — | Unix timestamp of first ingestion |

#### 2. `ContractNode` — Micro Entity
One entity per contract address per protocol graph. Medium BTL (refreshed on rebuild).

| Field | Type | Indexed | Purpose |
|---|---|---|---|
| `contractAddress` | `str` | ✅ | Checksummed EVM address |
| `protocolId` | `str` | ✅ | FK → ProtocolRegistry |
| `snapshotId` | `str` | ✅ | FK → RiskSnapshot |
| `hop` | `u64` | ✅ | `0` = core, `1` = direct dep, `2` = transitive |
| `category` | `str` | ✅ | `proxy`, `implementation`, `oracle`, `multisig`, `token`, `other` |
| `sourcifyStatus` | `str` | ✅ | `full_match`, `partial_match`, `not_found` |
| `proxyType` | `str` | — | `eip1967`, `eip897`, `beacon`, `none` |
| `adminType` | `str` | — | `eoa`, `safe`, `timelock`, `dao`, `none` |
| `bytecodeHash` | `str` | — | keccak256 of deployed bytecode |
| `riskScore` | `dec` | ✅ | Node-level risk score `[0, 100]` |
| `swarmBytecodeRef` | `str` | — | Swarm hash → raw bytecode + storage dump |
| `updatedAt` | `u64` | — | Block number of last update |

#### 3. `RiskSnapshot` — Macro Entity
One per evaluation run per protocol. Short BTL (~50,000 blocks ≈ 7 days). Expires automatically — old snapshots fall off queries without manual deletion.

| Field | Type | Indexed | Purpose |
|---|---|---|---|
| `snapshotId` | `str` | ✅ | `{protocolId}-{blockNumber}` |
| `protocolId` | `str` | ✅ | FK → ProtocolRegistry |
| `fingerprint` | `str` | — | Hash over bytecodes + admins + feed addrs + dep addrs |
| `compositeScore` | `dec` | ✅ | Propagated 2-hop score `[0, 100]` |
| `riskTier` | `str` | ✅ | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `swarmGraphRef` | `str` | — | Swarm hash → full graph JSON |
| `swarmEvidenceRef` | `str` | — | Swarm hash → audit log / raw data dump |
| `evaluatedAt` | `u64` | ✅ | Block number of evaluation |
| `triggeredBy` | `str` | — | `cron`, `log-event`, `manual` |

### Swarm Blob Types

| Blob | Contents | Referenced from |
|---|---|---|
| `full-graph.json` | All nodes + edges, hop assignments, adjacency list | `RiskSnapshot.swarmGraphRef` |
| `audit-log.json` | Raw RPC responses, Sourcify lookups, timestamps | `RiskSnapshot.swarmEvidenceRef` |
| `bytecode-dump.json` | Raw bytecode hex, EIP-1967 slots, storage layout | `ContractNode.swarmBytecodeRef` |
| `protocol-meta.json` | Full address book dump, version history | `ProtocolRegistry.swarmMetaRef` |

---

## Data Sources

| # | Source | What it provides | Access method |
|---|---|---|---|
| 1 | **Protocol Address Book** (GitHub/NPM) | Seed contract addresses (hop 0) | HTTP fetch at ingest time |
| 2 | **Ethereum RPC** | Bytecode, proxy detection (EIP-1967), logs, storage slots | `eth_getCode`, `eth_getStorageAt` |
| 3 | **Arkiv Sourcify Mirror** (`sourcify.arkiv.network`) | Verification status, contract name, compiler version | `@arkiv-network/sdk` query with `createdBy(MIRROR_OWNER)` |
| 4 | **Safe Transaction Service** | Multisig owner list + signing threshold | Public REST API (`safe-transaction-mainnet.safe.global`) |
| 5 | **Chainlink Feed Registry** | Oracle addresses, heartbeat, deviation params | On-chain `FeedRegistry` or Chainlink JSON |
| 6 | **Etherscan / Blockscout** | Deployer address, deploy tx (fallback only) | Public API |

> **Why Arkiv Sourcify Mirror instead of Sourcify v2 API directly?**  
> Arkiv has already mirrored all 7.9M Sourcify-verified contracts. Querying via SDK eliminates the external HTTP client, removes rate-limit concerns, and strengthens our Arkiv integration story. We use the same `@arkiv-network/sdk` for both reading verification data and writing our own entities.

---

## Risk Scoring Model

### Per-Node Score (0–100, higher = riskier)

| Factor | Weight | Signal |
|---|---|---|
| Verification status | 20% | `full_match` = 0, `partial_match` = 10, `not_found` = 20 |
| Admin control type | 20% | EOA = 20, 1-of-N Safe = 15, M-of-N Safe = 5–10, Timelock = 2 |
| Upgradeability | 15% | Upgradeable proxy = 15, Beacon = 10, Immutable = 0 |
| Oracle freshness | 15% | Stale heartbeat = 15, Healthy = 0 |
| Admin concentration | 15% | Single owner = 15, threshold ratio < 0.5 = 10 |
| Protocol age | 10% | < 6 months = 10, > 2 years = 0 |
| Incident history | 5% | Known exploits = 5 |

### Score Propagation (2-hop)

```
compositeScore = hop0Score
              + 0.5 × avg(hop1Scores)
              + 0.25 × avg(hop2Scores)
```

Capped at 100. Safer dependencies (score < 20) reduce score by half their delta from 20.

### Risk Tiers

| Tier | Score Range |
|---|---|
| `LOW` | 0 – 25 |
| `MEDIUM` | 26 – 50 |
| `HIGH` | 51 – 75 |
| `CRITICAL` | 76 – 100 |

### Fingerprint

A keccak256 hash over:
- Implementation bytecode hashes (all hops)
- Admin wallet addresses + Safe thresholds
- Chainlink feed addresses
- Dependency contract addresses

If the fingerprint changes between cron sweeps → trigger a rebuild.

---

## Chainlink CRE Workflows

### Workflow 1: Cron Sweep
- **Trigger**: Every N blocks (e.g. every 7,200 blocks ≈ 24 hours)
- **Action**: Recompute fingerprint for each registered protocol
- **Decision**: If `newFingerprint !== storedFingerprint` → request full graph rebuild
- **Output**: CRE calls graph service → new `RiskSnapshot` written to Arkiv/Swarm → on-chain report to `RiskRegistry.sol`

### Workflow 2: Log Trigger
- **Trigger**: Upgrade events (`Upgraded(address)`), admin events (`AdminChanged`, `OwnershipTransferred`, `RoleGranted`)
- **Action**: Immediate rebuild for the affected protocol
- **Output**: Same as cron sweep

### On-Chain Contract: `RiskRegistry.sol`
- Stores `protocolId → compositeScore` mapping
- `reportRisk(protocolId, score, snapshotId)` — callable only by CRE forwarder address
- Emits `RiskReported(protocolId, score, snapshotId, blockNumber)`

---

## Demo Flow

1. User searches "Aave V3" on the frontend
2. Frontend queries Arkiv: `SELECT * FROM RiskSnapshot WHERE protocolId = "aave-v3-mainnet" ORDER BY evaluatedAt DESC LIMIT 1`
3. Show composite risk score, risk tier, hop breakdown
4. Show graph view: hop-0 core contracts, hop-1 dependencies, hop-2 transitive deps
5. Click a contract node → show `sourcifyStatus`, `adminType`, `proxyType`, individual `riskScore`
6. Click "View on Swarm" → load full graph JSON blob
7. Simulate an upgrade event → show CRE log trigger firing → new snapshot appears
8. Old snapshot expires via BTL → disappears from active queries (BTL demo)

---

## Sponsor Fit

| Sponsor | Use | Track |
|---|---|---|
| **Chainlink (CRE)** | Cron sweep + log triggers + on-chain `RiskRegistry` report | CRE workflows that connect chains to APIs |
| **Arkiv** | Primary queryable storage (3 entity types with BTL) + reads Arkiv's Sourcify mirror | "Build on Arkiv from scratch" ($4K) + Swarm bonus ($500) |
| **Swarm** | Full graph JSON + audit evidence + bytecode dumps | Swarm blob storage with Arkiv reference |

**Required repo files for Arkiv judging:**
- `/arkiv/schema.md`
- `/arkiv/friction.md`
- `/arkiv/swarm.md`
- `/arkiv/reach.md`
- `/arkiv/why-arkiv.md`
- `/arkiv/how-you-use-arkiv.md`

---

## Open Assumptions & TODOs

> These are decisions made under time pressure. Each must be revisited before final submission.

| # | Assumption | Decision Made | Revisit Trigger |
|---|---|---|---|
| **A1** | Sourcify mirror owner address | ⚠️ **TODO**: Must confirm from `sourcify.arkiv.network` explorer before writing production queries. Using wrong owner = silently reads spoofed data. | Before graph service writes first query |
| **A2** | Contracts not in Sourcify mirror (new/unverified) | Marked `sourcifyStatus = "not_found"` and scored as unverified (penalized). **No fallback to Sourcify v2 API for now.** | If we find too many legitimate contracts penalized unfairly |
| **A3** | Hop-2 contract cap | Max 20 unique hop-2 contracts per protocol to bound graph size | If Aave V3 graph is too sparse / too dense |
| **A4** | BTL for `RiskSnapshot` | ~50,000 blocks (~7 days at 12s/block). CRE cron refreshes before expiry. | Adjust based on Rabdi block time and CRE frequency |
| **A5** | `ProtocolRegistry` is curated | We seed protocols manually for hackathon. No open submission yet. | Post-hackathon open registry |
| **A6** | Score propagation weights | `hop0 × 1.0 + hop1 × 0.5 + hop2 × 0.25` with cap 100 | Calibrate against real Aave V3 score to ensure sensible output |
| **A7** | Admin concentration: EOA = highest risk | A single EOA owner scores 20/20 on admin risk | Confirm with any known protocols for sanity check |

---

## Team Responsibilities

### `XohamOG` — Frontend (`frontend/`)
- Next.js 14 app with TypeScript strict mode
- Protocol search + risk score display
- 2-hop graph visualization
- Risk breakdown by hop and by factor
- Activity log (CRE trigger events)
- Read from Arkiv SDK (public client, no wallet needed for reads)
- Full graph JSON loaded from Swarm via `swarmGraphRef`

### `Ishapalkar` — Contracts + CRE (`contracts/`, `cre/`)
- `RiskRegistry.sol`: score storage, CRE-only write access
- CRE cron workflow: fingerprint check → rebuild trigger
- CRE log trigger workflow: event detection → immediate rebuild
- CRE adapter: calls graph service HTTP endpoint → parses response → submits on-chain

### `vedaXD` — Graph Service + Storage (`graph-service/`, `storage/`)
- Protocol ingestion pipeline (address book → RPC traversal)
- Node enrichment (Arkiv Sourcify mirror, Safe API, Chainlink)
- Scoring engine + fingerprint computation
- Swarm writer (full-graph.json, audit-log.json, bytecode dumps)
- Arkiv writer (ProtocolRegistry, ContractNode, RiskSnapshot entities)
- HTTP endpoint for CRE adapter to trigger rebuilds

---

## API Contracts (Inter-Service)

> These must be finalized in `docs/` before cross-service integration begins.

### CRE → Graph Service
```
POST /rebuild
Body: { protocolId: string, triggeredBy: "cron" | "log-event" }
Response: { snapshotId: string, compositeScore: number, swarmGraphRef: string }
```

### Graph Service → Frontend (via Arkiv)
Frontend reads directly from Arkiv using the SDK — no graph service API needed for reads.

### Frontend → RiskRegistry.sol (via RPC)
```
view: getRisk(protocolId: string) → (score: uint256, snapshotId: string, blockNumber: uint256)
event: RiskReported(protocolId, score, snapshotId, blockNumber)
```

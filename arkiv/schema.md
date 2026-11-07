# Arkiv Schema Specification (`/arkiv/schema.md`)

This document defines the structured decentralized entities, indexed attributes, ownership rules, and Block-Time Lifetime (BTL) expiration policies implemented for **Macaroon (DeFi Provenance Graph)** on the **Arkiv Rabdi Testnet** (Chain ID: `7794095`).

---

## 1. Entity Schemas

### A. `protocol_registry_v1` (Macro Entity)
Permanent root entity establishing canonical metadata for a protocol tracked on-chain.

| Field Name | Type | Indexed | Description |
| :--- | :--- | :---: | :--- |
| `protocolId` | `string` | **Yes** | Unique protocol identifier (e.g., `aave-v3-mainnet`, `uniswap-v3`) |
| `name` | `string` | No | Human-readable protocol name (e.g., `Aave V3`) |
| `category` | `string` | **Yes** | Market classification (`lending`, `dex`, `yield`) |
| `chainId` | `string` | **Yes** | Origin chain ID (`1` for Ethereum Mainnet) |
| `version` | `string` | No | Protocol release semantic version (`3.1.0`) |
| `sourceRepo` | `string` | No | Verified upstream open-source repository link |
| `swarmMetaRef` | `string` | No | Swarm BZZ content hash pointing to immutable metadata blob |
| `createdAt` | `u64` | No | Ingestion block timestamp |

- **Expiration Policy**: `ExpirationTime.max()` (Permanent, never expires).
- **Ownership & Control**: Written by the authorized indexing wallet (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`); readable permissionlessly by any dApp, agent, or developer without authentication.

---

### B. `contract_node_v1` (Micro Graph Entity)
Represents an individual smart contract, proxy, implementation, governance timelock, or oracle price feed within the multi-hop dependency topology.

| Field Name | Type | Indexed | Description |
| :--- | :--- | :---: | :--- |
| `contractAddress` | `string` | **Yes** | Checksummed EVM contract address |
| `protocolId` | `string` | **Yes** | Parent protocol foreign key |
| `snapshotId` | `string` | **Yes** | Associated evaluation snapshot hash |
| `hop` | `u64` | **Yes** | Topological distance: `0` (Core Proxy), `1` (Logic/Gov), `2` (Oracle Feeds) |
| `category` | `string` | **Yes** | Node role (`proxy`, `implementation`, `oracle`, `multisig`) |
| `sourcifyStatus` | `string` | **Yes** | Source code verification (`full_match`, `partial_match`, `not_found`) |
| `riskScore` | `dec` | **Yes** | Computed 7-factor risk score (`0.00` to `100.00`) |
| `proxyType` | `string` | No | Upgradeability pattern (`eip1967`, `beacon`, `eip897`, `none`) |
| `adminType` | `string` | No | Access control type (`timelock`, `safe`, `dao`, `eoa`, `none`) |
| `adminAddress` | `string` | No | Address of the administrative owner |
| `bytecodeHash` | `string` | No | Keccak-256 hash of deployed runtime bytecode |
| `safeOwnerCount` | `u64` | No | Number of signers if admin is Gnosis Safe |
| `safeThreshold` | `u64` | No | Required signatures for execution |
| `safeOwners` | `bytes` | No | Serialized JSON array of multisig signer addresses |
| `oracleStaleness` | `dec` | No | Staleness ratio: `(now - updatedAt) / heartbeat` |
| `oracleHeartbeat` | `u64` | No | Configured feed heartbeat in seconds |
| `contractName` | `string` | No | Decompiled or verified contract name |
| `swarmBytecodeRef`| `string` | No | Swarm BZZ hash of raw runtime bytecode |
| `updatedAt` | `u64` | No | Block timestamp of last evaluation |

- **Expiration Policy**: `ExpirationTime.fromBlocks(50_000)` (~7 days Block-Time Lifetime). Entities automatically refresh upon new evaluations or storage drift triggers.
- **Ownership**: Written by indexing wallet (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`); publicly queryable.

---

### C. `risk_snapshot_v1` (Macro Evaluation Entity)
Captures point-in-time composite risk attestations, CRE consensus outputs, and 2-hop decay weights.

| Field Name | Type | Indexed | Description |
| :--- | :--- | :---: | :--- |
| `snapshotId` | `string` | **Yes** | Deterministic hash of block number + protocolId |
| `protocolId` | `string` | **Yes** | Target protocol identifier |
| `compositeScore` | `dec` | **Yes** | Weighted composite score (`13.70`) |
| `riskTier` | `string` | **Yes** | Risk classification: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `evaluatedAt` | `u64` | No | Block timestamp of evaluation |
| `evaluatedBlock` | `u64` | **Yes** | Ethereum L1 block number evaluated |
| `fingerprint` | `string` | **Yes** | Canonical 32-byte Keccak-256 protocol fingerprint |
| `swarmGraphRef` | `string` | No | Swarm BZZ reference to full graph DAG JSON |
| `swarmEvidenceRef`| `string` | No | Swarm BZZ reference to raw RPC audit traces |
| `triggeredBy` | `string` | No | Execution source: `cron-sweep`, `log-event`, `manual` |
| `hop0AvgScore` | `dec` | No | Unweighted average risk of Hop 0 core nodes (`8.83`) |
| `hop1AvgScore` | `dec` | No | Unweighted average risk of Hop 1 nodes (`6.75`) |
| `hop2AvgScore` | `dec` | No | Unweighted average risk of Hop 2 nodes (`10.20`) |
| `nodeCount` | `u64` | No | Total active nodes in topological mesh (`15`) |

- **Expiration Policy**: `ExpirationTime.fromBlocks(50_000)` (~7 days BTL).
- **Ownership**: Written by indexing wallet (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`); publicly queryable.

---

## 2. Live On-Chain Rabdi Entities

- **Arkiv Rabdi Network Chain ID**: `7794095`
- **Public RPC Gateway**: `https://rpc.rabdi.db-chain.testnet.arkiv.network`
- **Block Explorer**: [https://rabdi.explorer.arkiv.network](https://rabdi.explorer.arkiv.network)
- **Writing Wallet Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Protocol Registry Live Key**: `0xc561566253956c5c8fec52d0cd49af8a5c40e1209c87894b863a5275dd665b50`
- **Risk Snapshot Live Key**: `0x41aa67ace6913d31b6952969b9045e355add3031d09e40ac4bb40ca5890e13a4`
- **Pool Proxy Node Key**: `0x8a1819d74bbde121d4fda774451339517977ebea235cf33397d79e910ad4133b`

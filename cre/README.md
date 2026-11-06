# Chainlink Runtime Environment (CRE) Workflows (`cre/`)

This directory contains the production Chainlink Runtime Environment (CRE) workflows that automate multi-hop dependency drift detection, graph re-computation, and on-chain risk attestations for the DeFi Provenance Graph.

---

## 1. Architecture & Capabilities

```
┌────────────────────────────────────────────────────────┐
│             Chainlink CRE Decentralized Network        │
├───────────────────────────┬────────────────────────────┤
│  Workflow 1: Cron Sweep   │  Workflow 2: Log Trigger   │
│  - Periodic timer trigger │  - EVM event trigger       │
│  - Drift detection check  │  - Upgraded / AdminChanged │
└─────────────┬─────────────┴─────────────┬──────────────┘
              │                           │
              │  POST /rebuild            │  POST /rebuild
              ▼                           ▼
┌────────────────────────────────────────────────────────┐
│             Graph Service HTTP Endpoint                │
│    (Recomputes 2-hop score -> writes Arkiv & Swarm)    │
└───────────────────────────┬────────────────────────────┘
                            │ Returns { snapshotId, compositeScore }
                            ▼
┌────────────────────────────────────────────────────────┐
│               On-Chain Attestation                     │
│         RiskRegistry.sol (reportRisk)                  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Workflows Overview

### Workflow 1: Periodic Cron Sweep (`workflows/cron.yaml` & `workflows/cron.ts`)
- **Trigger**: Periodic schedule (every ~7,200 blocks / 24 hours, or cron `0 */4 * * *`).
- **Fingerprint Calculation**:
  Computes deterministic protocol fingerprint:
  $$\text{fingerprint} = \text{keccak256}\Big(\text{implBytecodeHashes} \parallel \text{adminAddresses} \parallel \text{oracleFeedAddresses} \parallel \text{depAddresses}\Big)$$
- **Drift Detection**: Queries the latest `RiskSnapshot` on Arkiv. If `fingerprint != storedFingerprint`, triggers an immediate graph rebuild.
- **Action**: Dispatches `POST /rebuild` to Graph Service, waits for the new snapshot, and executes `RiskRegistry.reportRisk()` on-chain.

### Workflow 2: Reactive Log Trigger (`workflows/log_trigger.yaml` & `workflows/log_trigger.ts`)
- **Trigger**: EVM log events emitted on tracked core protocol proxies (e.g., Aave V3 Pool `0x87870Bca...` and PoolConfigurator `0x64b761...`):
  - `Upgraded(address indexed implementation)`
  - `AdminChanged(address previousAdmin, address newAdmin)`
- **Action**: Immediately initiates high-priority graph re-evaluation via `POST /rebuild` and attests the updated composite score to `RiskRegistry.sol`.

---

## 3. CRE → Graph Service API Contract

The CRE workflow interacts with the decentralized graph service via the following standardized endpoint:

- **Endpoint**: `POST /rebuild`
- **Request Body**:
  ```json
  {
    "protocolId": "aave-v3-mainnet",
    "triggeredBy": "cron | log-event | manual",
    "eventDetails": {
      "txHash": "0x...",
      "eventName": "Upgraded",
      "targetContract": "0x87870Bca3F3fD6335c3F4cE8392d69350b4F4E2",
      "newImplementation": "0x..."
    }
  }
  ```
- **Response**:
  ```json
  {
    "snapshotId": "aave-v3-mainnet-21105420",
    "compositeScore": 1030,
    "riskTier": "LOW",
    "swarmGraphRef": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    "blockNumber": 21105420,
    "fingerprint": "0x..."
  }
  ```

---

## 4. Local Installation & Simulation

### Install Dependencies
```bash
cd cre
npm install
```

### Run Full Simulation
Simulates both the Cron Sweep and Log Trigger workflows end-to-end:
```bash
npm run simulate
```

### Simulate Specific Workflows
```bash
# Simulate only Cron Sweep
npm run simulate:cron

# Simulate only Log Trigger
npm run simulate:log
```

---

## 5. Chainlink CRE CLI Simulation

For environments with the official Chainlink CRE CLI installed:
```bash
cre workflow simulate ./workflows/cron.yaml
cre workflow simulate ./workflows/log_trigger.yaml
```

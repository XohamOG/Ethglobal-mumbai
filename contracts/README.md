# DeFi Provenance Graph — Smart Contracts (`contracts/`)

Smart contracts for the DeFi Provenance Graph protocol.

## Contracts Overview

1. **`RiskRegistry.sol`**
   - Central on-chain registry mapping `protocolId => RiskReport`.
   - Stores attested composite risk score, risk tier, Arkiv snapshot ID foreign key, and evaluation block number.
   - Protected by `onlyForwarder` modifier restricted to the authorized Chainlink Runtime Environment (CRE) forwarder address.
   - Emits `RiskReported(protocolId, compositeScore, riskTier, snapshotId, blockNumber)` indexed events for real-time frontend listener ingestion.

2. **`IRiskRegistry.sol`**
   - Standard interface for protocol registry queries and attestations.

3. **`mocks/MockTargetProtocol.sol`**
   - Mock upgradeable protocol contract emitting `Upgraded` and `AdminChanged` events, used to verify Chainlink CRE Log Triggers.

## Installation & Setup

```bash
cd contracts
npm install
```

## Compilation

```bash
npm run compile
```

## Running Tests

```bash
npm test
```

## Deployment

Deploy locally (starts Hardhat in-memory node):
```bash
npx hardhat run scripts/deploy.ts
```

Deploy to Sepolia testnet:
```bash
npm run deploy:sepolia
```

Deploy to Avalanche Fuji testnet:
```bash
npm run deploy:fuji
```

Deploy to Arkiv Rabdi testnet:
```bash
npm run deploy:rabdi
```

Export contract ABI for Frontend and CRE:
```bash
npm run export-abi
```

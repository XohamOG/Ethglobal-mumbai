# Why Arkiv? Architectural Justification (`/arkiv/why-arkiv.md`)

*Analyzing why centralized databases fail for DeFi provenance and what was intentionally kept off Arkiv.*

---

## 1. If You Swapped Arkiv for Postgres or Any Other Database, What Would Your Users Lose?

If we swapped Arkiv for PostgreSQL or any other centralized database, our users would suffer four major losses:

### A. Loss of Trustless Verification Without API Gatekeepers
- **In PostgreSQL**: Users and autonomous agents would be forced to trust that our centralized API server was honest, that our database was never compromised, and that our risk scoring was not secretly manipulated to downplay risks for favored protocols. Furthermore, centralized endpoints can be rate-limited, paywalled, geo-blocked, or shut down entirely.
- **On Arkiv**: The graph state is anchored on the decentralized Rabdi DB-Chain. Any developer, liquidator, or AI agent can query Arkiv directly using `@arkiv-network/sdk` without creating an account, acquiring an API key, or placing trust in Macaroon's servers.

### B. Loss of Provable Immutability & Forensic Auditability
- **In PostgreSQL**: A database administrator can silently execute `UPDATE contract_node_v1 SET riskScore = 0` or delete historical incident logs without leaving any cryptographic breadcrumbs.
- **On Arkiv**: Every entity creation, update, and expiration is signed by an on-chain key, assigned a deterministic entity key, committed in a verifiable transaction hash, and timestamped on the DB-chain. In an active exploit or hack, auditors possess an immutable, mathematically verifiable record of the exact multi-hop dependency state at that block.

### C. Loss of Native Composability with Autonomous AI Agents
- **In PostgreSQL**: Web3 AI agents and decentralized autonomous organizations (DAOs) cannot natively inspect a private PostgreSQL instance without complex, centralized oracle relayers.
- **On Arkiv**: Arkiv's decentralized SQL-like query interface allows on-chain agents and off-chain worker nodes to discover fresh protocol dependencies with zero infrastructure overhead.

### D. Loss of Automated Decentralized Expiration (BTL)
- **In PostgreSQL**: Managing data staleness requires maintaining custom cron scripts, garbage-collection workers, and database triggers that frequently fail silently.
- **On Arkiv**: Arkiv's native **Block-Time Lifetime (BTL)** automatically expires stale risk snapshots after 50,000 blocks (~7 days) if not refreshed by a new evaluation, guaranteeing that stale dependency information never poisons downstream consumer applications.

---

## 2. What Did You Keep Off Arkiv, and Why?

A core principle of scalable decentralized engineering is storing **structured, queryable state on-chain** while delegating **heavy unstructured binary blobs to decentralized artifact storage**. We intentionally kept the following off Arkiv:

### A. Raw Runtime EVM Bytecodes & Compiler Metadata (Kept on Ethereum Swarm)
- **What it is**: Uncompressed EVM deployment and runtime bytecodes, compiler ASTs, and Sourcify metadata JSONs (ranging from 50 KB to over 2 MB per contract).
- **Why kept off Arkiv**: Storing raw megabyte bytecode dumps inside Arkiv entities would bloat the DB-chain, needlessly increase transaction gas costs, and degrade query execution speed for clients filtering on lightweight metadata.
- **Where it lives instead**: We upload raw bytecodes to **Ethereum Swarm** (BZZ content-addressed decentralized storage) and store only the lightweight 32-byte content hash (`swarmBytecodeRef`) inside the Arkiv entity. Users and auditors needing full disassembled bytecode can fetch it on-demand from Swarm gateway.

### B. Raw Forensic RPC Execution Traces & Call Graphs (Kept on Ethereum Swarm)
- **What it is**: Multi-megabyte raw JSON-RPC execution traces (`debug_traceTransaction`), memory logs, and recursive call traces generated during lineage discovery.
- **Why kept off Arkiv**: These verbose forensic logs are only needed during in-depth post-mortem investigations. Storing hundreds of megabytes of raw traces on Arkiv would violate database efficiency.
- **Where it lives instead**: Stored on **Ethereum Swarm** as immutable forensic evidence archives (`swarmEvidenceRef`), while Arkiv retains the structured summary metrics (`riskScore`, `hop`, `category`, `compositeScore`, `fingerprint`).

### C. Ephemeral UI Coordinates & Canvas Layout State (Kept in Client Memory)
- **What it is**: Exact SVG/Canvas $X, Y$ coordinate offsets, node dragging positions, pan-and-zoom zoom ratios, and collapsible sidebar toggle flags.
- **Why kept off Arkiv**: Visual layout coordinates are purely ephemeral client-side presentation states. Storing UI rendering coordinates in a decentralized database would waste chain state and create merge collisions between independent users.
- **Where it lives instead**: Managed entirely in client React state (`ProvenanceGraphCanvas.tsx`).

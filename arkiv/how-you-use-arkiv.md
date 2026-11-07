# How We Use Arkiv (`/arkiv/how-you-use-arkiv.md`)

*Evaluating schema filtering, access control, expiration mechanics, and direct user-facing features powered by Arkiv.*

---

## 1. Do the Things You Filter On, Who Can Edit Each Entity, and When It Expires Fit What Your App Does?

**Yes.** Every single indexing parameter, permission boundary, and expiration configuration was intentionally selected to match the lifecycle of DeFi contract dependencies and risk analysis in our app:

### A. The Fields We Filter On
Our schema indexes five specific fields that directly reflect how DeFi analysts, security engineers, and automated agents inspect contract dependencies:
1. **`protocolId` (`string`, Indexed)**:
   - *Why it fits*: Protocols are the root entity of DeFi risk analysis. Users and agents almost always query dependencies scoped to a target protocol (e.g., `protocolId = "aave-v3-mainnet"` or `protocolId = "uniswap-v3"`).
2. **`hop` (`u64`, Indexed)**:
   - *Why it fits*: Systemic risk decays across topological distance. Hop 0 represents core proxies, Hop 1 represents implementation logic and governance timelocks, and Hop 2 represents upstream oracle price feeds. Filtering by `hop` allows consumers to isolate perimeter oracle hazards from core execution vulnerabilities.
3. **`category` (`string`, Indexed)**:
   - *Why it fits*: Allows consumers to instantly query specific architectural roles (e.g. `category = "oracle"` to inspect all Chainlink feeds, or `category = "multisig"` to audit Gnosis Safe signers).
4. **`riskScore` (`dec`, Indexed)**:
   - *Why it fits*: Enables risk desks and liquidation bots to run real-time anomaly alerts (e.g. `riskScore > 15.0`) to catch contracts undergoing governance drift or oracle staleness.
5. **`sourcifyStatus` (`string`, Indexed)**:
   - *Why it fits*: Flags unverified contracts (`not_found` or `partial_match`) that introduce severe black-box execution risks.

---

### B. Who Can Edit Each Entity (Ownership & Permissions)
- **Designated Indexing & Attestation Key**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Why this fits what our product does**:
  - In a decentralized risk intelligence platform, **integrity of the evaluation is paramount**. If arbitrary third parties could modify a contract's `riskScore`, replace its `adminAddress`, or point its `bytecodeHash` to malicious code, the entire trust model would disintegrate.
  - Entities are written exclusively by the consensus-driven indexing worker and Chainlink Runtime Environment (CRE) attestation pipeline.
  - **Permissionless Read Access**: While writes are restricted to the verified indexing signer, **reads are 100% permissionless**. Anyone can query, filter, and audit our Arkiv entities without requesting access keys or paying subscription fees.

---

### C. When It Expires (Block-Time Lifetime — BTL)
- **Macro Entity (`protocol_registry_v1`)**:
  - **Expiration**: `ExpirationTime.max()` (Permanent).
  - *Why it fits*: The canonical identity of a protocol (name, chain ID, repository) is permanent and should never expire.
- **Micro & Evaluation Entities (`contract_node_v1`, `risk_snapshot_v1`)**:
  - **Expiration**: `ExpirationTime.fromBlocks(50_000)` (~7 days).
  - *Why it fits*: DeFi smart contracts and governance parameters are dynamic: proxies get upgraded, admin multi-sigs rotate signers, and oracle heartbeats adjust. Storing ephemeral risk assessments permanently creates "zombie data."
  - If a protocol is deprecated or if our indexing pipeline ceases evaluating it, the entities automatically expire after 50,000 blocks, preventing outdated configurations from poisoning active queries.
  - Whenever a scheduled CRE cron sweep or reactive log trigger fires, a fresh evaluation is written with a renewed 50,000-block lifetime.

---

## 2. Does Each Arkiv Feature You Use Change Something Your Users See?

**Yes.** Arkiv is not a hidden background database in Macaroon; its capabilities directly drive visible interface elements and interactive controls:

### A. Live Arkiv Synced Status Indicator (Header Bar)
- **What the user sees**: In the top navigation bar, users see an active indicator:
  `Arkiv: Synced (Rabdi #7794095)` with a pulsing status dot.
- **Arkiv feature used**: Live connection to the Arkiv Rabdi testnet via `@arkiv-network/sdk`, verifying real-time synchronization between the on-chain DB and the interactive canvas.

### B. Interactive Hop-Filter Tabs Driven by Arkiv Attributes
- **What the user sees**: Navigation tabs for **"All Hops (15)"**, **"Hop 0 · Core (3)"**, **"Hop 1 · Logic & Gov (7)"**, and **"Hop 2 · Oracles (5)"**.
- **Arkiv feature used**: Filter queries on the indexed `hop` attribute (`u64`) in `contract_node_v1`. Clicking a tab instantly isolates that dependency tier on the canvas.

### C. Live Entity Key & One-Click Block Explorer Action
- **What the user sees**: When clicking any node in the graph, the right collapsible inspector displays:
  - The live Arkiv Entity Key: `Key: 0x8a1819d7...` with a one-click copy button.
  - An owner tag: `Owner: 0xf39Fd6...2266`.
  - A primary call-to-action button: **"Open Arkiv Entity Explorer"** linking directly to `https://rabdi.explorer.arkiv.network/entity/<key>`.
- **Arkiv feature used**: Unique deterministic 32-byte `$key` generated on-chain by the Arkiv DB-Chain for every entity.

### D. Block-Time Lifetime (BTL) Expiration Badge
- **What the user sees**: Inside the contract lineage parameters table, users see:
  `btlExpiration: 50,000 blocks (~7d BTL)`.
- **Arkiv feature used**: Arkiv's native `$expiresAt` block timestamp, proving to users that the node data is verified and fresh.

### E. Attested Composite Risk Score Badge
- **What the user sees**: A live risk score badge (`13.7 LOW RISK`) at the top right of the protocol card and audit view.
- **Arkiv feature used**: Live query against the `risk_snapshot_v1` entity where `compositeScore` is attested by Chainlink CRE and stored in Arkiv.

### F. Dual-Persistence Architecture Indicator: Arkiv + Swarm
- **What the user sees**: In the property sheet, users see structured metadata queried from **Arkiv** side-by-side with raw bytecode evidence fetched from **Swarm** (`bzz://632a1a8a...`).
- **Arkiv feature used**: Arkiv stores the lightweight `swarmBytecodeRef` attribute, seamlessly connecting structured relational data on Arkiv with bulk audit blobs on Swarm.


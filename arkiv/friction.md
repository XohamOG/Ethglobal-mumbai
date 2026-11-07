# Arkiv Friction Report & Developer Feedback (`/arkiv/friction.md`)

*Actionable, developer-focused feedback from building Macaroon (DeFi Provenance Graph) on Arkiv Rabdi Testnet at ETHGlobal Mumbai.*

---

## 1. What We Don't Have Yet That Would Make Building Easier

Based on our experience building a multi-hop graph on Arkiv, these three developer tools would dramatically improve building and debugging on the network:

| Proposed Tool | What It Does | Why It Is Needed |
| :--- | :--- | :--- |
| **Relational Data Dashboard** | Visualizing connections and relationships between entities | In graph architectures, entities reference each other (e.g. `protocol_registry_v1` links to 15 `contract_node_v1` entities across hops 0, 1, 2, which link to `risk_snapshot_v1`). Currently, the Arkiv Explorer displays entities as isolated flat cards. A relationship dashboard showing directed edges between entity keys would let developers and users explore multi-entity models visually. |
| **Visual Query Debugger** | Understanding queries, indexing, and errors | Constructing filter queries (`and(eq("arkiv.schema", "contract_node_v1"), ...)`) can fail silently if a field isn't indexed, if types don't match, or if syntax is malformed. An interactive query debugger in the Arkiv Hub—showing query execution plans, autocomplete for schema fields, and warnings when filtering on unindexed attributes—would save hours of developer trial-and-error. |
| **Entity Lifecycle Explorer** | Tracking ownership, expiry, and entity management | Entities use Block-Time Lifetime (BTL) expiration (e.g., 50,000 blocks). Currently, developers have to manually inspect hex block heights (`0x51150`) to figure out when entities expire. A lifecycle dashboard with countdown meters, expiration warning alerts, and batch renewal controls would make managing expiring state simple and reliable. 
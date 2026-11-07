# Arkiv + Swarm integration

DeFi Provenance Graph keeps its **queryable graph** in Arkiv and its **raw evidence blobs** in Swarm.
Each Arkiv entity carries the Swarm reference of the blob that backs it.

> Status of this document: everything below was run for real on the Swarm **Sepolia testnet** and Arkiv **Rabdi**
> on 2026-11-07. Items that are not finished are marked **TODO** or **Limitation**, not papered over.

---

## 1. What lives where

| Layer | What we keep there | Why |
|---|---|---|
| **Arkiv** (Rabdi, chain 7794095) | `ProtocolRegistry`, `ContractNode` (15 per run), `RiskSnapshot`: addresses, hop, category, risk scores, tier, fingerprint, proxy/admin info. All the fields the frontend filters and queries on. | Small, indexed, queryable, expires on its own (`RiskSnapshot` and `ContractNode` ~50,000 blocks). |
| **Swarm** (Sepolia testnet) | Four JSON blobs: `full-graph.json` (21 KB, nodes + edges), `audit-log.json` (5 KB, raw RPC / storage-slot / oracle evidence), `bytecode-dump.json` (227 KB, runtime bytecode + slot dumps), `protocol-meta.json` (0.4 KB, protocol description). | Too large and not queryable. They are evidence that must be immutable and content-addressed. |

Kept off Arkiv on purpose: raw bytecode, RPC traces and the full adjacency list. Arkiv stores only the pointer.

### Which entity field holds the Swarm reference

| Arkiv schema | Field | Points to |
|---|---|---|
| `risk_snapshot_v1` | `swarmGraphRef` | `full-graph.json` |
| `risk_snapshot_v1` | `swarmEvidenceRef` | `audit-log.json` |
| `contract_node_v1` | `swarmBytecodeRef` | `bytecode-dump.json` |
| `protocol_registry_v1` | `swarmMetaRef` | `protocol-meta.json` |

Schemas: [`storage/arkiv/schemas.ts`](../storage/arkiv/schemas.ts). We store plain references (no feeds).

---

## 2. One Arkiv entity and the Swarm reference it points to

**Arkiv entity** (`risk_snapshot_v1`, snapshot `aave-v3-mainnet-26358641`):

- Entity key: `0xd62280d9a68a47d18a8db013dfc291b8c6deef856bbff29aa50ec61ce69fb274`
- Explorer: https://rabdi.explorer.arkiv.network/entity/0xd62280d9a68a47d18a8db013dfc291b8c6deef856bbff29aa50ec61ce69fb274
- Field `swarmGraphRef` = `656bd0d3f41a001afe4ce6fead3447993bfaf531d6b117cc4ddbfe0d825491d2`

**Swarm reference it points to** (`full-graph.json`, 21 KB):

- Link: http://127.0.0.1:1633/bzz/656bd0d3f41a001afe4ce6fead3447993bfaf531d6b117cc4ddbfe0d825491d2/

> **Limitation:** this link opens only through our own Bee node on the Swarm *testnet*. The public
> `api.gateway.ethswarm.org` serves mainnet and cannot resolve testnet references.
> **TODO before judging:** expose a read-only gateway URL for the Bee node (tunnel or hosted box) and replace
> the `127.0.0.1` links with it. The local node is also in crash recovery at the time of writing (see section 7).
> The raw bytes are kept in [`storage/swarm/blobs/`](../storage/swarm/blobs/) so the content can be inspected without the node.

Other entities from the same run:

| Entity | Arkiv key | Swarm field → reference |
|---|---|---|
| `protocol_registry_v1` (Aave V3) | `0x97bd43199d4ecc6289caf7a9ab18478ebcf7954a2925184a7ff4da071d5ddfc6` | `swarmMetaRef` → `d8c8dc3a48961c6ae659a28ce7ab5d444cdf451179dfdeed7987dc8e69db2b69` |
| `risk_snapshot_v1` | `0xd62280d9a68a47d18a8db013dfc291b8c6deef856bbff29aa50ec61ce69fb274` | `swarmEvidenceRef` → `05b90068c703131862da74fb6815850927f3e2348c3938db78b142d5129ef865` |
| `contract_node_v1` (all 15) | one key per node, listed in the ingestion log | `swarmBytecodeRef` → `3b8a310fa645b4d7b320c47a43a78e0e9e136419b1b4e61d34420f5dfb244a89` |

Writing wallet on Arkiv: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
(This is the well-known Hardhat dev account. The Rabdi testnet holds only testnet tGLM, so nothing of value is exposed, but anyone can sign with this key.)

Machine-readable copy of all of the above: [`storage/swarm/published.json`](../storage/swarm/published.json).

---

## 3. Postage stamp, wallet, and Bee node

| | |
|---|---|
| Postage batch ID | `74abc115cada095d518acd652bcbed50fd9829b957e541144f920c0c3b3760ba` |
| Batch parameters | depth 17, amount 20,000,000,000 PLUR, immutable, about 27 days TTL at purchase |
| Bought by wallet | `0x517374A211ff03b5DF96e885Addc8595b1f79535` (the Bee node's own wallet, Sepolia) |
| Purchase | `POST /stamps/20000000000/17` on our node, tx `0x66b9ab255559c278e258abe5fbf460c8b1381ae8b781d7bd44258339965e84e2` |
| How the wallet was funded | 0.3 Sepolia ETH sent by the team, then 0.1 ETH swapped to ~0.42 sBZZ on Uniswap V3 (tx `0x2f7c9ebdbc4b6519336a12870c839ca5bcb71e0f6b1ab6fb48313b94bddb9856`) |
| Upload service | Our own **Bee 2.8.3** full node in Docker (`ethersphere/bee:2.8.3`), container `bee-sepolia`, `BEE_MAINNET=false`, Sepolia (chain 11155111, network id 10), API on `127.0.0.1:1633` |
| Chain RPC used by Bee | `https://sepolia.gateway.tenderly.co` |

No third-party upload service or borrowed batch was used.

---

## 4. Files in this repo that upload to or read from Swarm

| File | Role |
|---|---|
| [`storage/swarm/client.ts`](../storage/swarm/client.ts) | `SwarmStorageClient`: `uploadJson()` (`POST /bzz`, with `Swarm-Postage-Batch-Id`) and `getJson()` (`GET /bzz/<ref>/`). Returns only references issued by Bee. Throws on failure; there is no fake or local fallback. |
| [`storage/swarm/publish-artifacts.ts`](../storage/swarm/publish-artifacts.ts) | Runs the ingestion with Arkiv writes disabled, uploads the four blobs, then reads each one back to verify. Writes `published.json`. |
| [`graph-service/src/ingestion.ts`](../graph-service/src/ingestion.ts) | Production path. Uploads the blobs through `tryUpload()` and passes the references into the Arkiv entities. |
| [`graph-service/src/server.ts`](../graph-service/src/server.ts) | `GET /swarm/:reference` reads a blob back from Swarm. |
| [`frontend/src/components/graph/EntityPropertySheet.tsx`](../frontend/src/components/graph/EntityPropertySheet.tsx) | Reads `swarmBytecodeRef` from the entity and links to the blob via `NEXT_PUBLIC_SWARM_GATEWAY`. |
| [`frontend/src/app/audit/page.tsx`](../frontend/src/app/audit/page.tsx) | Shows the snapshot's Swarm references and links to them. |

---

## 5. Run one upload and one read yourself

**Needs:** Node 22+, a Bee node on Swarm testnet with a usable postage batch (sections 3 and 6),
internet access for the Ethereum mainnet RPC used by the ingestion (public RPC by default).

**Upload (minimal, no repo code):**

```bash
curl -s -X POST \
  -H "Swarm-Postage-Batch-Id: <BATCH_ID>" \
  -H "Content-Type: application/json" \
  --data-binary '{"hello":"arkiv+swarm"}' \
  "http://127.0.0.1:1633/bzz?name=hello.json"
# expect: {"reference":"<64 hex chars>"}
```

**Read:**

```bash
curl -s http://127.0.0.1:1633/bzz/<REFERENCE>/
# expect: {"hello":"arkiv+swarm"}
```

**Upload and read with the repo code (all four blobs):**

```bash
cd graph-service
npm install && (cd ../storage && npm install)
export SWARM_BEE_URL=http://127.0.0.1:1633
export SWARM_POSTAGE_BATCH_ID=<BATCH_ID>
node --import tsx ../storage/swarm/publish-artifacts.ts
```

Expected output: four lines `[Swarm] Uploaded <name> -> <64 hex>`, then four lines
`[verify] OK <name> <ref>`, then `Manifest written to .../storage/swarm/published.json`.

**Full flow (Swarm blobs and Arkiv entities):** put `ARKIV_ACCESS_KEY`, `ARKIV_PRIVATE_KEY`,
`SWARM_BEE_URL`, `SWARM_POSTAGE_BATCH_ID` in `graph-service/.env`, then:

```bash
cd graph-service
node --env-file=.env --import tsx src/ingestion.ts
```

Expected: `[Arkiv] ProtocolRegistry confirmed on-chain!`, 15 `ContractNode on-chain` lines, `RiskSnapshot confirmed on-chain!`.

**Check the link between Arkiv and Swarm:** query `risk_snapshot_v1` on Rabdi (for example with
`ArkivStorageClient.getLatestSnapshot()` in `storage/arkiv/client.ts`), take `swarmGraphRef`, and fetch
`/bzz/<swarmGraphRef>/` from the Bee node. The JSON returned contains the same `snapshotId` and `fingerprint` as the entity.

---

## 6. Setting up the Bee node from scratch (Sepolia)

```bash
docker run -d --name bee-sepolia --restart unless-stopped \
  -p 127.0.0.1:1633:1633 -p 1634:1634 \
  -e BEE_API_ADDR=":1633" -e BEE_FULL_NODE=true -e BEE_SWAP_ENABLE=true \
  -e BEE_MAINNET=false -e BEE_PASSWORD="<password>" \
  -e BEE_BLOCKCHAIN_RPC_ENDPOINT="https://sepolia.gateway.tenderly.co" \
  -v bee-sepolia:/home/bee/.bee ethersphere/bee:2.8.3 start
curl -s localhost:1633/addresses            # wallet address to fund
# send Sepolia ETH, swap some to sBZZ (0x543dDb01Ba47acB11de34891cD86B675F04840db), wait for sync
curl -s -X POST localhost:1633/stamps/20000000000/17    # returns batchID
curl -s localhost:1633/stamps/<batchID>                 # wait for "usable": true
```

---

## 7. Where Swarm appears in the demo video

Swarm is used in the evidence step of the demo: the presenter opens a `RiskSnapshot` entity in the Rabdi explorer,
points at its `swarmGraphRef`, opens that reference through the public read-only gateway (section 2), and shows
`full-graph.json` returning the same `snapshotId` and `fingerprint` as the entity. The same step shows the node's
`swarmBytecodeRef` link in the frontend's entity inspector.

Video timestamp: see the video description (the video was not recorded when this file was written, so no time is claimed here).

---

## 8. What got in our way

- **No upload without a stamp.** The public gateway cannot buy stamps and serves mainnet only, so we had to run our own Bee node on Sepolia.
- **The original client faked references.** It fell back to a local keccak hash when the upload failed, and those hashes were not real Swarm references. We rewrote it to throw instead, and replaced every fake hash in the repo and docs.
- **No sBZZ faucet.** The docs only list Uniswap. We swapped Sepolia ETH to sBZZ on the V3 pool (fee 3000) from the node wallet.
- **Public RPC could not sync Bee.** `ethereum-sepolia-rpc.publicnode.com` returned `pruned history unavailable` and Bee stayed in "syncing postage contract data". Switching to `sepolia.gateway.tenderly.co` fixed it (about 20 minutes of sync). Several other free RPCs rate-limited `eth_getLogs`.
- **Rate limiting while sending transactions.** The first swap attempt failed with `exceeded maximum retry limit` because Bee was using the same RPC. Sending through another RPC worked.
- **Docker hung, and the forced restart left Bee in crash recovery.** After restart the 4.8 GB store is being rebuilt at a slow disk speed, and the node answers `503 Node is syncing` until it finishes.
- **Testnet references are not on the public gateway**, so a link judges can open needs us to expose our own node (see the TODO in section 2).
- **Stale Arkiv entities.** Earlier runs left entities on Rabdi whose `swarmBytecodeRef` is an old fake hash. They expire on their own; we did not delete them.
- **A bug fixed on the way:** `ProtocolRegistry.swarmMetaRef` was being filled with the graph reference instead of a real `protocol-meta.json` reference.

---

## Security note: encrypted references

**Careful: an encrypted Swarm reference contains its key, and Arkiv entities are public.**
We upload **unencrypted** blobs and store plain 32-byte references. The blobs hold only data that is already public
(on-chain bytecode, storage slots, oracle values, Sourcify metadata), so exposing them is intentional.
If we ever upload encrypted data, the 128-hex reference (reference + key) must **never** be written into an
entity as is: encrypt it first (for example to the viewer's public key) or keep it off Arkiv.
The Bee wallet password and keystore are in `storage/swarm/.bee/` (git-ignored) and are never committed.

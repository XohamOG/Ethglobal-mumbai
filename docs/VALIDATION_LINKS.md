# Live On-Chain Entities & Validation Links

This document provides complete on-chain verification links, storage slot references, and decentralized storage hashes for the Aave V3 Provenance Graph ingested on **Arkiv Rabdi Testnet** and **Ethereum Mainnet**.

---

## 1. Arkiv Rabdi DB-Chain Entities (Chain ID: 7794095)
- **Arkiv Rabdi Explorer**: [https://rabdi.explorer.arkiv.network](https://rabdi.explorer.arkiv.network)
- **RPC Endpoint**: `https://rpc.rabdi.db-chain.testnet.arkiv.network`

### A. Macro Entities
| Entity Name | Schema | Arkiv Entity Key | Transaction Hash |
| :--- | :--- | :--- | :--- |
| **Protocol Registry** (`aave-v3-mainnet`) | `protocol_registry_v1` | `0xc561566253956c5c8fec52d0cd49af8a5c40e1209c87894b863a5275dd665b50` | `0x6c1c94056203b3f407737621231bb3660b42dcb57dfadc095655522220363e81` |
| **Risk Snapshot** (Score: `14.75`) | `risk_snapshot_v1` | `0xf3ccb8f81475290b38ed5302d715e7931b9f5df445c1acf888fb3e07cab3f435` | `0xcbbf88c87aecd7583f45e8d2f3ad580a18b2991977e15bb81fe7eb34cf88efad` |

### B. Micro Entities (`contract_node_v1`)
| Node Name / Role | Contract Address | Hop | Category | Risk | Arkiv Entity Key |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pool (Proxy)** | `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2` | 0 | Proxy | 12 | `0x5df8dc59a35e80d99ba148ff61df9a96f13bce36c74d6f85ffad9ec6ce6bb1c2` |
| **Pool Implementation** | `0x728a138A4823392C2EFA55e028d434F526fE03CF` | 0 | Implementation | 0 | `0x8c9aabf09907be1699f7d2f93d39580b2a3fa95db7ba33cb92b67fec85a21234` |
| **PoolAddressesProvider** | `0x2f39D218133AFAb8F2b819B1066C7f434aD94e9e` | 0 | Proxy | 12 | `0x789c099e28bfbcab37b2d28f090d8a571fbaea0d0d8291079d2dfaa41be5e6e1` |
| **PoolConfigurator (Proxy)** | `0x64b761D848206f447Fe2dd461b0c635Ec39EbB27` | 0 | Proxy | 12 | `0x4d667c4be44062eb142b6279f0458df261d7b1d9dfd70a41763aaeb5c55c065f` |
| **Configurator Impl** | `0xFF42Ce30054dcE7dc7C1282a9a497aa58eaBCe99` | 0 | Implementation | 0 | `0xecb6538411d3557e4e892c57f7ca723aece2b919597288ff3f1d8c1c4ad3d9ca` |
| **ACLManager** | `0xc2aaCf6553D20d1e9d78E365AAba8032af9c85b0` | 0 | Implementation | 15 | `0x992b5746f52bcd5aac5603e41662755f82c716255d026b89ab36dba091c096f9` |
| **Governance Executor** | `0xEE56e2B3D491590B5b31738cC34d5232F378a8D5` | 1 | Governance | 5 | `0x9c42403b9ad6fceb20c24b611d279cf733f39a70f7cfcb64b22896f6004b7713` |
| **Emergency Guardian Safe** | `0x2CFe3ec4d5a6811f4B8067F0DE7e47DfA938Aa30` | 1 | Multisig | 12 | `0xdc4779bc5c03c5ae147748834925828fb4429e7102e38c3aaec042e947d06df1` |
| **AaveOracle** | `0x54586bE62E3c3580375aE3723C145253060Ca0C2` | 1 | Oracle | 0 | `0x8f0376c6bbd85d77da711ee1b4ca3f5c1d3ecfa7c865f577ba79f2257321528c` |
| **ReservesSetupHelper** | `0x3523d24217794F19E92e9A2B68e0dEda4e773410` | 1 | Helper | 10 | `0x4333474e92374c06693a55e21fb7fdc84525e764995e2000cfab4a3454a332a5` |
| **Chainlink ETH/USD** | `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` | 2 | Oracle | 7 | `0xfb155363ba554abd9bfc2897f57c627005c147351fc271914219a552d1460b93` |
| **Chainlink USDC/USD** | `0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6` | 2 | Oracle | 15 | `0x136f67e84438c57525e69ffb3b366ee15af1501aa7ce7f05349e66125652daca` |
| **Chainlink BTC/USD** | `0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c` | 2 | Oracle | 7 | `0x609eae7d9cea83cdaf5e9544405787948e059e53e130ddd5a15f64e2063d85c6` |
| **Chainlink DAI/USD** | `0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9` | 2 | Oracle | 7 | `0xe744d8c25d90837051efd266a9a3dfa1d3a5f83b23c5fff3f4ef0eabbb785212` |
| **Chainlink USDT/USD** | `0x3E7d1eAB13ad0104d2750B8863b489D65364e32D` | 2 | Oracle | 15 | `0x25c172e7d75052be81afc80c004a94c6e901586bba3d1d719ed1d1ff05ce3891` |

---

## 2. Ethereum Mainnet On-Chain Verification

### A. EIP-1967 Proxy Resolution
- **Pool Proxy**: [`0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`](https://etherscan.io/address/0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2#readProxyContract)
  - Slot `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc` dynamically points to:
    [`0x728a138A4823392C2EFA55e028d434F526fE03CF`](https://etherscan.io/address/0x728a138A4823392C2EFA55e028d434F526fE03CF#code)
- **PoolConfigurator Proxy**: [`0x64b761D848206f447Fe2dd461b0c635Ec39EbB27`](https://etherscan.io/address/0x64b761D848206f447Fe2dd461b0c635Ec39EbB27#readProxyContract)
  - Slot points to: [`0xFF42Ce30054dcE7dc7C1282a9a497aa58eaBCe99`](https://etherscan.io/address/0xFF42Ce30054dcE7dc7C1282a9a497aa58eaBCe99#code)

### B. Governance & Emergency Controls
- **Governance Executor (Timelock v2)**: [`0xEE56e2B3D491590B5b31738cC34d5232F378a8D5`](https://etherscan.io/address/0xEE56e2B3D491590B5b31738cC34d5232F378a8D5#code)
  - Verification: 86,400s delay configured in contract storage.
- **Aave Emergency Guardian Safe**: [`0x2CFe3ec4d5a6811f4B8067F0DE7e47DfA938Aa30`](https://etherscan.io/address/0x2CFe3ec4d5a6811f4B8067F0DE7e47DfA938Aa30)
  - Verified via [Safe Transaction Service API](https://safe-transaction-mainnet.safe.global/api/v1/safes/0x2CFe3ec4d5a6811f4B8067F0DE7e47DfA938Aa30/): Threshold 4 of 7 signers.

### C. Price Oracle & Chainlink Feeds
- **AaveOracle**: [`0x54586bE62E3c3580375aE3723C145253060Ca0C2`](https://etherscan.io/address/0x54586bE62E3c3580375aE3723C145253060Ca0C2#code)
- **ETH / USD Feed**: [`0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419`](https://etherscan.io/address/0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419)
- **BTC / USD Feed**: [`0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c`](https://etherscan.io/address/0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c)
- **USDC / USD Feed**: [`0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6`](https://etherscan.io/address/0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6)
- **DAI / USD Feed**: [`0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9`](https://etherscan.io/address/0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9)
- **USDT / USD Feed**: [`0x3E7d1eAB13ad0104d2750B8863b489D65364e32D`](https://etherscan.io/address/0x3E7d1eAB13ad0104d2750B8863b489D65364e32D)

---

## 3. Swarm Decentralized Artifacts (BZZ Gateway)
All immutable execution artifacts are stored on Swarm:
- **Full Ingested Graph JSON**: [https://api.gateway.ethswarm.org/bzz/3a5194ce284962a9b0598c0b1e001e96a5d63a573a4a2423b47913b71b2c8e7d](https://api.gateway.ethswarm.org/bzz/3a5194ce284962a9b0598c0b1e001e96a5d63a573a4a2423b47913b71b2c8e7d)
- **Ingestion Audit Log**: [https://api.gateway.ethswarm.org/bzz/1c6ae2662e9ce2923f7a559df208b6a1b10c4e1f23caa26a91e42a0e72882fbb](https://api.gateway.ethswarm.org/bzz/1c6ae2662e9ce2923f7a559df208b6a1b10c4e1f23caa26a91e42a0e72882fbb)
- **Bytecode Dump**: [https://api.gateway.ethswarm.org/bzz/632a1a8aeaecade273e5f6e0f8581921c21ea5d8d9bd4fa64f0e1823671510e9](https://api.gateway.ethswarm.org/bzz/632a1a8aeaecade273e5f6e0f8581921c21ea5d8d9bd4fa64f0e1823671510e9)

---

## 4. Graph Edge Topology & Traversal
The graph edges model physical contract-to-contract relationships:
1. `proxy_implementation`: Resolves dynamic logic execution via EIP-1967 delegatecall.
2. `registry`: Central factory mapping service identifiers to active proxies.
3. `governance`: Access control roles permitted to queue/execute proposal transactions.
4. `multisig`: Safe multisig owners and threshold controllers.
5. `oracle_feed`: Aggregator query targets for price determination.
6. `cross_protocol`: Semantic macro-dependencies (e.g. Aave V3 lending core dependent on Chainlink price oracles).

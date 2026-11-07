# Chainlink CRE Project: Fingerprint Drift Workflow

A real Chainlink Runtime Environment (CRE) workflow, built with `@chainlink/cre-sdk` and run with the official **CRE CLI**.
It keeps the DeFi Provenance Graph honest: it checks Aave V3 on Ethereum mainnet and only rebuilds the graph when something actually changed.

```
 CRON trigger
     │
     ▼
 EVM reads (CRE EVMClient, Ethereum mainnet, finalized block, DON consensus)
   Pool / Configurator revisions · PoolAddressesProvider registry · AaveOracle price sources ·
   ACL emergency admin · Timelock delay · Safe owners + threshold         (fingerprint-spec.json)
     │  keccak256(sorted "<id>=<result>" lines)  ──► live fingerprint
     ▼
 HTTP GET  graph-service /fingerprint/aave-v3-mainnet   (fingerprint stored in Arkiv)
     │
     ├── equal   ─► NO DRIFT: log and stop. Nothing is rebuilt.
     └── differs ─► HTTP POST graph-service /rebuild  ─► re-ingest the 2-hop graph, rescore,
                                                        write Arkiv entities + Swarm evidence
```

Why this satisfies the CRE track: a CRE workflow orchestrates **a blockchain (EVM reads on mainnet)** and **an external system (graph-service HTTP API backed by Arkiv/Swarm)**, and is demonstrated with a **successful `cre workflow simulate`**.

## Run it (simulation)

1. Install the CRE CLI (Windows PowerShell): `irm https://app.chain.link/cre/install.ps1 | iex`, open a new terminal, then `cre version`.
   Install Bun (>= 1.2.21): https://bun.sh
2. `cre login` (free account), `cre whoami`.
3. Start graph-service (`cd graph-service && npm start`). Optionally set `CRE_API_KEY` in `graph-service/.env`, and the same value as `GRAPH_SERVICE_API_KEY_ENV` in `cre/cre-project/.env` (copy `.env.example`).
4. From this folder:
   ```bash
   cd fingerprint-drift-workflow && bun install && cd ..
   cre workflow simulate fingerprint-drift-workflow --target staging-settings
   ```
   Add `--non-interactive --trigger-index 0` to skip the prompt, `-v` for verbose logs.

### What you will see
- **First run** (no matching fingerprint in Arkiv): `no stored snapshot / DRIFT DETECTED` → `/rebuild` → `REBUILT score=… tier=…`
- **Second run**: `NO DRIFT - snapshot … is still accurate. Nothing to rebuild.`
- **Forcing a change for the demo**: edit one value in graph-service's stored snapshot, or temporarily change an `id` or `data` entry in `fingerprint-spec.json`. The live fingerprint changes, so the workflow rebuilds.

## Files
| File | Purpose |
| --- | --- |
| `fingerprint-drift-workflow/main.ts` | Workflow (cron → EVM reads → HTTP compare → HTTP rebuild) |
| `fingerprint-drift-workflow/fingerprint-spec.json` | The exact `eth_call`s making up the fingerprint. Shared with graph-service so both sides compute the same value. |
| `project.yaml` / `secrets.yaml` / `workflow.yaml` | CRE CLI configuration (no secret values) |
| `.env.example` | Template for local secrets. Copy it to `.env`, which is gitignored. |

## Secrets
Nothing sensitive is committed. The graph-service API key reaches the workflow through the CRE secrets mechanism (`secrets.yaml` → env var → `runtime secret`), and `CRE_ETH_PRIVATE_KEY` is only needed for `--broadcast`.

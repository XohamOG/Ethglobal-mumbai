"use client";

import React, { useState } from "react";
import { AAVE_NODES } from "@/lib/graph-data";
import { Database, Copy, Check, ExternalLink, Code2 } from "lucide-react";

export function ArkivSchemaTab() {
  const [selectedSchema, setSelectedSchema] = useState<"contract_node" | "risk_snapshot" | "protocol_registry">("contract_node");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (txt: string, key: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const schemaDefinitions = {
    protocol_registry: {
      tag: "protocol_registry_v1",
      name: "ProtocolRegistry",
      role: "Macro Identity Entity (Near-Permanent)",
      lifetime: "ExpirationTime.max() (~7,884,000 blocks)",
      cardinality: "1 entity per protocol ecosystem",
      columns: [
        { name: "protocolId", type: "str().indexed()", desc: "Unique protocol slug ('aave-v3-mainnet')" },
        { name: "name", type: "str().indexed()", desc: "Display title ('Aave V3')" },
        { name: "category", type: "str().indexed()", desc: "Ecosystem category ('lending', 'dex', 'oracle')" },
        { name: "chainId", type: "str().indexed()", desc: "EIP-155 Chain ID ('1' for Ethereum Mainnet)" },
        { name: "version", type: "str()", desc: "Semantic protocol release version ('3.1.0')" },
        { name: "sourceRepo", type: "str()", desc: "Canonical address book repository URL" },
        { name: "swarmMetaRef", type: "str()", desc: "Swarm BZZ content hash pointing to protocol-meta.json" },
        { name: "createdAt", type: "u64()", desc: "Unix timestamp of initial Arkiv registration" },
      ],
      sdkQuery: `// Query active ProtocolRegistry from Arkiv
const { entities } = await publicClient
  .select({ protocolId: true, name: true, category: true, swarmMetaRef: true })
  .from(ProtocolRegistry)
  .where(eq("chainId", str("1")))
  .fetch();`,
    },
    contract_node: {
      tag: "contract_node_v1",
      name: "ContractNode",
      role: "Micro Graph Node Entity (Scoped to Evaluation Snapshot)",
      lifetime: "Medium BTL (~50,000 blocks, refreshed on rebuild)",
      cardinality: "N entities per evaluation snapshot (15 for Aave V3)",
      columns: [
        { name: "contractAddress", type: "str().indexed()", desc: "Checksummed EVM contract address" },
        { name: "protocolId", type: "str().indexed()", desc: "Foreign Key -> ProtocolRegistry.protocolId" },
        { name: "snapshotId", type: "str().indexed()", desc: "Foreign Key -> RiskSnapshot.snapshotId" },
        { name: "hop", type: "u64().indexed()", desc: "Provenance hierarchy (0 = Core, 1 = Direct, 2 = Transitive)" },
        { name: "category", type: "str().indexed()", desc: "Contract type ('proxy', 'implementation', 'oracle', 'multisig')" },
        { name: "sourcifyStatus", type: "str().indexed()", desc: "Sourcify status ('full_match', 'partial_match', 'not_found')" },
        { name: "riskScore", type: "dec().indexed()", desc: "Computed 7-factor risk metric [0.0 - 100.0]" },
        { name: "referencedProtocolId", type: "str().indexed()", desc: "Cross-protocol dependency link (e.g. 'chainlink-mainnet')" },
        { name: "proxyType", type: "str()", desc: "Proxy pattern ('eip1967', 'beacon', 'eip897', 'none')" },
        { name: "adminType", type: "str()", desc: "Governance admin type ('timelock', 'safe', 'eoa', 'none')" },
        { name: "adminAddress", type: "str()", desc: "Resolved admin wallet or timelock contract address" },
        { name: "bytecodeHash", type: "str()", desc: "Keccak256 hash of deployed runtime bytecode" },
        { name: "safeOwnerCount", type: "u64()", desc: "Number of signers if admin is Gnosis Safe" },
        { name: "safeThreshold", type: "u64()", desc: "Signature threshold if admin is Gnosis Safe" },
        { name: "safeOwners", type: "bytes()", desc: "METADATA: Unindexed JSON array string of owner addresses" },
        { name: "oracleStaleness", type: "dec()", desc: "Oracle heartbeat ratio: (now - updatedAt) / heartbeat" },
        { name: "oracleHeartbeat", type: "u64()", desc: "Chainlink expected heartbeat duration in seconds" },
        { name: "contractName", type: "str()", desc: "Verified contract identifier from Sourcify mirror" },
        { name: "swarmBytecodeRef", type: "str()", desc: "Swarm hash pointing to bytecode-dump.json" },
        { name: "updatedAt", type: "u64()", desc: "Ethereum block number when node was evaluated" },
      ],
      sdkQuery: `// Query Hop 1 direct dependencies for Aave V3
const { entities } = await publicClient
  .select({ contractAddress: true, category: true, riskScore: true, sourcifyStatus: true })
  .from(ContractNode)
  .where(and(
    eq("protocolId", str("aave-v3-mainnet")),
    eq("hop", u64(1))
  ))
  .fetch();`,
    },
    risk_snapshot: {
      tag: "risk_snapshot_v1",
      name: "RiskSnapshot",
      role: "Macro Evaluation State Entity (Ephemeral with BTL TTL)",
      lifetime: "Block-Time Lifetime (~50,000 blocks ≈ 7 days). Naturally expires.",
      cardinality: "1 entity per evaluation run per protocol",
      columns: [
        { name: "snapshotId", type: "str().indexed()", desc: "Unique evaluation slug ('{protocolId}-{blockNumber}')" },
        { name: "protocolId", type: "str().indexed()", desc: "Foreign Key -> ProtocolRegistry.protocolId" },
        { name: "compositeScore", type: "dec().indexed()", desc: "Propagated 2-hop composite risk score [0 - 100]" },
        { name: "riskTier", type: "str().indexed()", desc: "Categorical tier ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')" },
        { name: "evaluatedAt", type: "u64().indexed()", desc: "Block number when snapshot was attested" },
        { name: "fingerprint", type: "str()", desc: "Deterministic Keccak256 protocol fingerprint hash" },
        { name: "swarmGraphRef", type: "str()", desc: "Swarm BZZ hash pointing to full-graph.json" },
        { name: "swarmEvidenceRef", type: "str()", desc: "Swarm BZZ hash pointing to audit-log.json" },
        { name: "triggeredBy", type: "str()", desc: "Trigger source ('cron', 'log-event', 'manual')" },
        { name: "hop0AvgScore", type: "dec()", desc: "Average risk subscore for Hop 0 core contracts" },
        { name: "hop1AvgScore", type: "dec()", desc: "Average risk subscore for Hop 1 direct dependencies" },
        { name: "hop2AvgScore", type: "dec()", desc: "Average risk subscore for Hop 2 transitive feeds" },
        { name: "nodeCount", type: "u64()", desc: "Total number of contract nodes in this topology" },
      ],
      sdkQuery: `// Query latest active RiskSnapshot before BTL expiration
const { entities } = await publicClient
  .select({ snapshotId: true, compositeScore: true, riskTier: true, fingerprint: true, swarmGraphRef: true })
  .from(RiskSnapshot)
  .where(eq("protocolId", str("aave-v3-mainnet")))
  .orderBy(desc("evaluatedAt"))
  .limit(1)
  .fetch();`,
    },
  };

  const curr = schemaDefinitions[selectedSchema];

  return (
    <div className="space-y-6 text-[#ececf2]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[4px] bg-[#17171d] border border-[#282832]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[2px] bg-[#282832] border border-[#7d8495]/40 flex items-center justify-center text-[#d6d8e4]">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-[#ececf2]">Arkiv DB-Chain Relational Schemas</h3>
            <p className="text-xs text-[#aaaab8] font-mono">
              Rabdi Testnet (Chain ID 7794095) · SDK @arkiv-network/sdk@1.0.1
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://rabdi.explorer.arkiv.network"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-[#d6d8e4] hover:text-[#ececf2] flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#0e0e12] border border-[#282832] transition-colors"
          >
            <span>Rabdi Block Explorer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Schema Selector Tabs */}
      <div className="flex gap-2 border-b border-[#282832] pb-3 text-xs font-mono">
        {[
          { key: "contract_node", label: "ContractNode (Micro)" },
          { key: "risk_snapshot", label: "RiskSnapshot (BTL TTL)" },
          { key: "protocol_registry", label: "ProtocolRegistry (Macro)" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setSelectedSchema(t.key as any)}
            className={`px-3 py-1.5 rounded-[2px] transition-all cursor-pointer ${
              selectedSchema === t.key
                ? "bg-[#282832] text-[#ececf2] border border-[#7d8495]/40 font-semibold"
                : "text-[#aaaab8] hover:text-[#ececf2] hover:bg-[#17171d]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Selected Schema Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-[2px] bg-[#17171d] border border-[#282832]">
          <span className="text-[#7d8495] block text-[10px] uppercase">Schema Tag</span>
          <span className="text-[#ececf2] font-semibold text-xs mt-0.5 block">{curr.tag}</span>
        </div>
        <div className="p-3 rounded-[2px] bg-[#17171d] border border-[#282832]">
          <span className="text-[#7d8495] block text-[10px] uppercase">Entity Role</span>
          <span className="text-[#d6d8e4] font-semibold text-xs mt-0.5 block truncate">{curr.role}</span>
        </div>
        <div className="p-3 rounded-[2px] bg-[#17171d] border border-[#282832]">
          <span className="text-[#7d8495] block text-[10px] uppercase">BTL Lifetime Policy</span>
          <span className="text-[#d6d8e4] font-semibold text-xs mt-0.5 block truncate">{curr.lifetime}</span>
        </div>
        <div className="p-3 rounded-[2px] bg-[#17171d] border border-[#282832]">
          <span className="text-[#7d8495] block text-[10px] uppercase">Cardinality</span>
          <span className="text-[#b068ff] font-semibold text-xs mt-0.5 block truncate">{curr.cardinality}</span>
        </div>
      </div>

      {/* Columns Specification Table */}
      <div className="rounded-[4px] border border-[#282832] bg-[#17171d] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#282832] flex items-center justify-between text-xs font-mono">
          <span className="font-serif font-bold text-[#ececf2]">{curr.name} Typed Attribute Columns</span>
          <span className="text-[#7d8495]">{curr.columns.length} Defined Attributes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#282832] text-[#7d8495] text-[10px] uppercase bg-[#0e0e12]">
                <th className="py-2.5 px-4">Column Name</th>
                <th className="py-2.5 px-4">Arkiv SDK Type</th>
                <th className="py-2.5 px-4">Indexing</th>
                <th className="py-2.5 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282832] text-[#ececf2]">
              {curr.columns.map((col) => {
                const isIndexed = col.type.includes(".indexed()");
                const isBytes = col.type.includes("bytes()");
                return (
                  <tr key={col.name} className="hover:bg-[#282832]/40 transition-colors">
                    <td className="py-2 px-4 font-semibold text-[#ececf2]">{col.name}</td>
                    <td className="py-2 px-4 text-[#d6d8e4]">{col.type}</td>
                    <td className="py-2 px-4">
                      {isIndexed ? (
                        <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] bg-[#0e0e12] text-[#d6d8e4] border border-[#282832] font-semibold">
                          INDEXED
                        </span>
                      ) : isBytes ? (
                        <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] bg-[#0e0e12] text-[#b068ff] border border-[#282832] font-semibold">
                          STORED BYTES
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] bg-[#0e0e12] text-[#aaaab8] border border-[#282832]">
                          STORED
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-[#aaaab8] text-[11px]">{col.desc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Snippet */}
      <div className="rounded-[4px] border border-[#282832] bg-[#17171d] p-4 text-xs font-mono">
        <div className="flex items-center justify-between mb-2 text-[#aaaab8]">
          <span className="flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-[#d6d8e4]" />
            <span>SDK Query Example (@arkiv-network/sdk@1.0.1)</span>
          </span>
          <button
            onClick={() => copy(curr.sdkQuery, "code")}
            className="hover:text-[#ececf2] cursor-pointer"
            title="Copy code"
          >
            {copiedKey === "code" ? (
              <Check className="w-3.5 h-3.5 text-[#b068ff]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#7d8495]" />
            )}
          </button>
        </div>
        <pre className="text-[#ececf2] overflow-x-auto p-3 rounded-[2px] bg-[#0e0e12] border border-[#282832]">
          {curr.sdkQuery}
        </pre>
      </div>

      {/* Live In-Memory Node State Table */}
      <div className="rounded-[4px] border border-[#282832] bg-[#17171d] p-4">
        <div className="flex items-center justify-between mb-3 text-xs font-mono">
          <span className="font-serif font-bold text-[#ececf2]">Live Arkiv Verified Nodes (Aave V3 Snapshot)</span>
          <span className="text-[#d6d8e4] font-semibold">{AAVE_NODES.length} Active Nodes</span>
        </div>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left text-[11px] font-mono">
            <thead>
              <tr className="border-b border-[#282832] text-[#7d8495] text-[10px] uppercase sticky top-0 bg-[#0e0e12]">
                <th className="py-2 px-3">Hop</th>
                <th className="py-2 px-3">Label</th>
                <th className="py-2 px-3">Address</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Proxy</th>
                <th className="py-2 px-3">Admin</th>
                <th className="py-2 px-3">Sourcify</th>
                <th className="py-2 px-3">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282832] text-[#ececf2]">
              {AAVE_NODES.map((n) => (
                <tr key={n.id} className="hover:bg-[#282832]/40 transition-colors">
                  <td className="py-1.5 px-3 font-bold text-[#ececf2]">{n.hop}</td>
                  <td className="py-1.5 px-3 font-semibold text-[#ececf2]">{n.label}</td>
                  <td className="py-1.5 px-3 text-[#aaaab8] truncate max-w-[140px]">{n.address}</td>
                  <td className="py-1.5 px-3 uppercase text-[10px] text-[#d6d8e4]">{n.category}</td>
                  <td className="py-1.5 px-3 uppercase text-[10px] text-[#aaaab8]">{n.proxyType}</td>
                  <td className="py-1.5 px-3 capitalize text-[10px] text-[#aaaab8]">{n.adminType}</td>
                  <td className="py-1.5 px-3 text-[#d6d8e4] font-semibold text-[10px]">{n.sourcifyStatus}</td>
                  <td className="py-1.5 px-3 font-bold text-[#ececf2]">{n.riskScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import mockGraphData from "@/lib/mock-graph.json";
import { PROTOCOLS } from "@/lib/graph-data";
import { Copy, Check, FileJson, Hash, HardDrive } from "lucide-react";

export function SwarmArtifactsTab() {
  const [activeBlob, setActiveBlob] = useState<"full_graph" | "audit_log" | "bytecode_dump" | "protocol_meta">("full_graph");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (txt: string, key: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const aave = PROTOCOLS[0];

  const blobDefinitions = {
    full_graph: {
      title: "full-graph.json",
      role: "Complete 2-Hop Graph Topology & Adjacency Matrix",
      referencedBy: "RiskSnapshot.swarmGraphRef",
      hash: aave.swarmGraphRef,
      size: "21.9 KB",
      description: "Full adjacency graph containing all 15 nodes, edge directional labels, cross-protocol pointers, and individual 7-factor score matrices.",
      payload: mockGraphData,
    },
    audit_log: {
      title: "audit-log.json",
      role: "Cryptographic Raw Evidence & RPC Traversal Receipts",
      referencedBy: "RiskSnapshot.swarmEvidenceRef",
      hash: aave.swarmEvidenceRef,
      size: "8.4 KB",
      description: "Immutable log of raw eth_getStorageAt slot dumps, Sourcify match hashes, Gnosis Safe transaction service owner responses, and Chainlink latestRoundData outputs.",
      payload: {
        snapshotId: aave.swarmEvidenceRef,
        protocolId: "aave-v3-mainnet",
        attestedBlock: 26354138,
        consensusTimestamp: 1733458000,
        rpcProvider: "Ethereum Mainnet via Infura/Alchemy",
        storageSlotReceipts: {
          "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2": {
            slot: "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
            raw: "0x000000000000000000000000728a138a4823392c2efa55e028d434f526fe03cf",
            resolvedAddress: "0x728a138A4823392C2EFA55e028d434F526fE03CF",
            proxyStandard: "EIP-1967 Transparent Proxy"
          },
          "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e": {
            slot: "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103",
            raw: "0x000000000000000000000000ee56e2b3d491590b5b31738cc34d5232f378a8d5",
            resolvedAddress: "0xEE56e2B3D491590B5b31738cC34d5232F378a8D5",
            adminStandard: "EIP-1967 Admin Slot"
          }
        },
        sourcifyAttestations: {
          "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2": { status: "full_match", compiler: "v0.8.10+commit.fc410830" },
          "0x728a138A4823392C2EFA55e028d434F526fE03CF": { status: "full_match", compiler: "v0.8.10+commit.fc410830" },
          "0x54586bE62E3c3580375aE3723C145253060Ca0C2": { status: "full_match", compiler: "v0.8.10+commit.fc410830" }
        }
      },
    },
    bytecode_dump: {
      title: "bytecode-dump.json",
      role: "EVM Runtime Bytecode Hex & Storage Dumps",
      referencedBy: "ContractNode.swarmBytecodeRef",
      hash: "3b8a310fa645b4d7b320c47a43a78e0e9e136419b1b4e61d34420f5dfb244a89",
      size: "46.2 KB",
      description: "Raw compiled runtime bytecode dump of Aave Pool Implementation contract, used for fingerprinting and on-chain drift verification.",
      payload: {
        contractAddress: "0x728a138A4823392C2EFA55e028d434F526fE03CF",
        bytecodeHash: "0x96107dc4006b4c7fecd1827cfb275ffeef31e6194cd50466f85f8eb24ccf2679",
        bytecodeLengthBytes: 24576,
        runtimeBytecodePrefix: "0x608060405234801561001057600080fd5b50600436106101185760003560e01c80630b9276661461011d57...",
        fingerprintContribution: "impl:0x96107dc4006b4c7fecd1827cfb275ffeef31e6194cd50466f85f8eb24ccf2679",
        immutable: true,
      },
    },
    protocol_meta: {
      title: "protocol-meta.json",
      role: "Protocol Identity & Canonical Address Book Manifest",
      referencedBy: "ProtocolRegistry.swarmMetaRef",
      hash: "e751dc5390f04681cd534c49f788701fc76c6c64b01eb7f4f99404d20a99ccee",
      size: "4.8 KB",
      description: "Ecosystem metadata, official addresses book exports from @bgd-labs/aave-address-book, GitHub commit shas, and protocol documentation links.",
      payload: {
        protocolId: "aave-v3-mainnet",
        name: "Aave V3",
        repository: "https://github.com/bgd-labs/aave-address-book",
        npmPackage: "@bgd-labs/aave-address-book@1.24.0",
        marketDeployments: {
          POOL: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
          POOL_ADDRESSES_PROVIDER: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
          ACL_MANAGER: "0xc2aaCf6553D20d1e9d78E365AAba8032af9c85b0",
          POOL_CONFIGURATOR: "0x64b761D848206f447Fe2dd461b0c635Ec39EbB27",
          ORACLE: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
          POOL_DATA_PROVIDER: "0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3"
        }
      },
    },
  };

  const curr = blobDefinitions[activeBlob];

  return (
    <div className="space-y-6 text-[#ececf2]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[4px] bg-[#17171d] border border-[#282832]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[2px] bg-[#282832] border border-[#7d8495]/40 flex items-center justify-center text-[#d6d8e4]">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-[#ececf2]">Swarm Decentralized Forensic Evidence</h3>
            <p className="text-xs text-[#aaaab8] font-mono">
              Immutable Content-Addressed Blob Storage (BZZ)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#d6d8e4] px-2.5 py-1 rounded-[2px] bg-[#0e0e12] border border-[#282832]">
            Content-Hash Verified
          </span>
        </div>
      </div>

      {/* Blob Selector Tabs */}
      <div className="flex gap-2 border-b border-[#282832] pb-3 text-xs font-mono">
        {[
          { key: "full_graph", label: "full-graph.json" },
          { key: "audit_log", label: "audit-log.json" },
          { key: "bytecode_dump", label: "bytecode-dump.json" },
          { key: "protocol_meta", label: "protocol-meta.json" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveBlob(t.key as any)}
            className={`px-3 py-1.5 rounded-[2px] transition-all cursor-pointer ${
              activeBlob === t.key
                ? "bg-[#282832] text-[#ececf2] border border-[#7d8495]/40 font-semibold"
                : "text-[#aaaab8] hover:text-[#ececf2] hover:bg-[#17171d]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Selected Blob Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-[2px] bg-[#17171d] border border-[#282832]">
          <span className="text-[#7d8495] block text-[10px] uppercase">Artifact Name</span>
          <span className="text-[#ececf2] font-semibold text-xs mt-0.5 block">{curr.title}</span>
        </div>
        <div className="p-3 rounded-[2px] bg-[#17171d] border border-[#282832]">
          <span className="text-[#7d8495] block text-[10px] uppercase">Referenced In Arkiv</span>
          <span className="text-[#d6d8e4] font-semibold text-xs mt-0.5 block truncate">{curr.referencedBy}</span>
        </div>
        <div className="p-3 rounded-[2px] bg-[#17171d] border border-[#282832]">
          <span className="text-[#7d8495] block text-[10px] uppercase">Payload Size</span>
          <span className="text-[#ececf2] font-semibold text-xs mt-0.5 block">{curr.size}</span>
        </div>
        <div className="p-3 rounded-[2px] bg-[#17171d] border border-[#282832]">
          <span className="text-[#7d8495] block text-[10px] uppercase">Cryptographic Role</span>
          <span className="text-[#b068ff] font-semibold text-xs mt-0.5 block truncate">{curr.role}</span>
        </div>
      </div>

      {/* Swarm Content Hash (BZZ) */}
      <div className="p-3.5 rounded-[4px] bg-[#0e0e12] border border-[#282832] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-[#d6d8e4] shrink-0" />
          <span className="text-[#7d8495]">Swarm BZZ Content Hash:</span>
          <span className="text-[#ececf2] font-semibold break-all">{curr.hash}</span>
        </div>
        <button
          onClick={() => copy(curr.hash || "", "hash")}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#282832] border border-[#7d8495]/40 text-[#ececf2] hover:bg-[#7d8495]/40 transition-colors cursor-pointer ml-auto shrink-0"
        >
          {copiedKey === "hash" ? <Check className="w-3.5 h-3.5 text-[#b068ff]" /> : <Copy className="w-3.5 h-3.5 text-[#aaaab8]" />}
          <span>Copy Hash</span>
        </button>
      </div>

      {/* Real-time JSON Payload Viewer */}
      <div className="rounded-[4px] border border-[#282832] bg-[#17171d] overflow-hidden text-xs font-mono">
        <div className="px-4 py-3 border-b border-[#282832] bg-[#0e0e12] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#aaaab8]">
            <FileJson className="w-4 h-4 text-[#d6d8e4]" />
            <span>Raw Verifiable Swarm Payload: {curr.title}</span>
          </div>
          <button
            onClick={() => copy(JSON.stringify(curr.payload, null, 2), "json")}
            className="flex items-center gap-1 text-[11px] text-[#aaaab8] hover:text-[#ececf2] cursor-pointer"
          >
            {copiedKey === "json" ? <Check className="w-3.5 h-3.5 text-[#b068ff]" /> : <Copy className="w-3.5 h-3.5 text-[#7d8495]" />}
            <span>Copy Raw JSON</span>
          </button>
        </div>

        <pre className="p-4 text-[#ececf2] overflow-x-auto max-h-[460px] overflow-y-auto leading-relaxed bg-[#0e0e12]">
          {JSON.stringify(curr.payload, null, 2)}
        </pre>
      </div>
    </div>
  );
}

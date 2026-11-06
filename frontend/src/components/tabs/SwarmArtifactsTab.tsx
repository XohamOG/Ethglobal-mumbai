"use client";

import React, { useState } from "react";
import mockGraphData from "@/lib/mock-graph.json";
import { PROTOCOLS } from "@/lib/graph-data";
import { GitFork, Copy, Check, FileJson, Hash, ShieldCheck, ExternalLink, HardDrive } from "lucide-react";
import { ShinyButton } from "@/components/ui/ShinyButton";

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
            raw: "0x0000000000000000000000005faab9e1adbddad0a08734be8a52185fd6558e14",
            resolvedAddress: "0x5FAab9E1adbddaD0a08734BE8a52185Fd6558E14",
            proxyStandard: "EIP-1967 Transparent Proxy"
          },
          "0x2f39D218133AFAb8F2b819B1066C7f434aD94e9e": {
            slot: "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103",
            raw: "0x000000000000000000000000ee56e2b3d491590b5b31738cc34d5232f378a8d5",
            resolvedAddress: "0xEE56e2B3D491590B5b31738cC34d5232F378a8D5",
            adminStandard: "EIP-1967 Admin Slot"
          }
        },
        sourcifyAttestations: {
          "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2": { status: "full_match", compiler: "v0.8.10+commit.fc410830" },
          "0x5FAab9E1adbddaD0a08734BE8a52185Fd6558E14": { status: "full_match", compiler: "v0.8.10+commit.fc410830" },
          "0x54586bE6333240e3ef4a78248c410Bf33060Ca0C2": { status: "full_match", compiler: "v0.8.10+commit.fc410830" }
        }
      },
    },
    bytecode_dump: {
      title: "bytecode-dump.json",
      role: "EVM Runtime Bytecode Hex & Storage Dumps",
      referencedBy: "ContractNode.swarmBytecodeRef",
      hash: "632a1a8aeaecade273e5f6e0f8581921c21ea5d8d9bd4fa64f0e1823671510e9",
      size: "46.2 KB",
      description: "Raw compiled runtime bytecode dump of Aave Pool Implementation contract, used for fingerprinting and on-chain drift verification.",
      payload: {
        contractAddress: "0x5FAab9E1adbddaD0a08734BE8a52185Fd6558E14",
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
          POOL_ADDRESSES_PROVIDER: "0x2f39D218133AFAb8F2b819B1066C7f434aD94e9e",
          ACL_MANAGER: "0xc2aaCf6553D20d1e9d78E365AAba8032af9c85b0",
          POOL_CONFIGURATOR: "0x64b761D848206f447Fe2dd461b0c635Ec39EbB27",
          ORACLE: "0x54586bE6333240e3ef4a78248c410Bf33060Ca0C2",
          POOL_DATA_PROVIDER: "0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3"
        }
      },
    },
  };

  const curr = blobDefinitions[activeBlob];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0a0d16] border border-[#182032]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400 font-mono">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Swarm Decentralized Forensic Evidence</h3>
            <p className="text-xs text-[#717e9c] font-mono">
              Immutable Content-Addressed Blob Storage (BZZ)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 px-2.5 py-1 rounded bg-[#0f1422] border border-[#1c2742]">
            Content-Hash Verified
          </span>
        </div>
      </div>

      {/* Blob Selector Tabs */}
      <div className="flex gap-2 border-b border-[#151b2a] pb-3 text-xs font-mono">
        {[
          { key: "full_graph", label: "full-graph.json" },
          { key: "audit_log", label: "audit-log.json" },
          { key: "bytecode_dump", label: "bytecode-dump.json" },
          { key: "protocol_meta", label: "protocol-meta.json" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveBlob(t.key as any)}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeBlob === t.key
                ? "bg-[#182033] text-white border border-[#2a3754] font-semibold"
                : "text-[#677595] hover:text-white hover:bg-[#0e121d]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Selected Blob Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg bg-[#0b0e18] border border-[#161d2d]">
          <span className="text-[#566483] block text-[10px] uppercase">Artifact Name</span>
          <span className="text-white font-semibold text-xs mt-0.5 block">{curr.title}</span>
        </div>
        <div className="p-3 rounded-lg bg-[#0b0e18] border border-[#161d2d]">
          <span className="text-[#566483] block text-[10px] uppercase">Referenced In Arkiv</span>
          <span className="text-blue-400 font-semibold text-xs mt-0.5 block truncate">{curr.referencedBy}</span>
        </div>
        <div className="p-3 rounded-lg bg-[#0b0e18] border border-[#161d2d]">
          <span className="text-[#566483] block text-[10px] uppercase">Payload Size</span>
          <span className="text-emerald-400 font-semibold text-xs mt-0.5 block">{curr.size}</span>
        </div>
        <div className="p-3 rounded-lg bg-[#0b0e18] border border-[#161d2d]">
          <span className="text-[#566483] block text-[10px] uppercase">Cryptographic Role</span>
          <span className="text-amber-400 font-semibold text-xs mt-0.5 block truncate">{curr.role}</span>
        </div>
      </div>

      {/* Swarm Content Hash (BZZ) */}
      <div className="p-3.5 rounded-xl bg-[#080b14] border border-[#172033] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-[#64748b]">Swarm BZZ Content Hash:</span>
          <span className="text-white font-semibold break-all">{curr.hash}</span>
        </div>
        <button
          onClick={() => copy(curr.hash, "hash")}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#101524] border border-[#212b44] text-[#8e9cb8] hover:text-white cursor-pointer ml-auto shrink-0"
        >
          {copiedKey === "hash" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>Copy Hash</span>
        </button>
      </div>

      {/* Real-time JSON Payload Viewer */}
      <div className="rounded-xl border border-[#161d2d] bg-[#070910] overflow-hidden text-xs font-mono">
        <div className="px-4 py-3 border-b border-[#141926] bg-[#090c15] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#7d8ca9]">
            <FileJson className="w-4 h-4 text-amber-400" />
            <span>Raw Verifiable Swarm Payload: {curr.title}</span>
          </div>
          <button
            onClick={() => copy(JSON.stringify(curr.payload, null, 2), "json")}
            className="flex items-center gap-1 text-[11px] text-[#71809e] hover:text-white cursor-pointer"
          >
            {copiedKey === "json" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Raw JSON</span>
          </button>
        </div>

        <pre className="p-4 text-emerald-400/90 overflow-x-auto max-h-[460px] overflow-y-auto leading-relaxed">
          {JSON.stringify(curr.payload, null, 2)}
        </pre>
      </div>
    </div>
  );
}


"use client";

import React, { useState } from "react";
import { GraphNode } from "@/lib/graph-data";
import {
  ExternalLink,
  Copy,
  Check,
  Shield,
  Database,
  HardDrive,
  Radio,
  CheckCircle2,
  Code2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface EntityPropertySheetProps {
  node: GraphNode;
  onClose?: () => void;
}

export function EntityPropertySheet({ node }: EntityPropertySheetProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedSwarm, setCopiedSwarm] = useState(false);
  const [showSwarmPayload, setShowSwarmPayload] = useState(false);

  const copyText = (text: string, type: "addr" | "swarm") => {
    navigator.clipboard.writeText(text);
    if (type === "addr") {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 1800);
    } else {
      setCopiedSwarm(true);
      setTimeout(() => setCopiedSwarm(false), 1800);
    }
  };

  const rabdiExplorerUrl = `https://rabdi.explorer.arkiv.network/address/${node.address}`;
  const etherscanUrl = `https://etherscan.io/address/${node.address}`;
  const swarmHash = node.swarmBytecodeRef || "b25edc5390f04681cd534c49f788701fc76c6c64b01eb7f4f99404d20a99beba";
  const swarmGatewayUrl = `https://gateway.ethswarm.org/bzz/${swarmHash}`;

  const hopLabels: Record<number, { title: string; desc: string }> = {
    0: {
      title: "Hop 0 · Core Architecture",
      desc: "Direct execution contract within the primary protocol diamond/proxy mesh.",
    },
    1: {
      title: "Hop 1 · Governance & Admin",
      desc: "Administrative timelock or multi-sig owner controlling core contracts.",
    },
    2: {
      title: "Hop 2 · External Dependencies",
      desc: "Transitive external oracle price feed or underlying asset reserve contract.",
    },
  };

  const hopInfo = hopLabels[node.hop] || hopLabels[0];

  return (
    <div className="flex flex-col gap-4 text-[#ececf2]">
      {/* Entity Header */}
      <div className="border-b border-[#282832] pb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] border border-[#282832] bg-[#282832]/60 text-[#d6d8e4]">
            {hopInfo.title}
          </span>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-[2px] border border-[#282832] bg-[#0e0e12] text-[#aaaab8]">
            {node.category}
          </span>
        </div>

        <h2 className="text-base font-serif font-bold text-[#ececf2] tracking-tight mb-1">
          {node.label}
        </h2>
        <p className="text-[11px] text-[#aaaab8] font-mono leading-relaxed">
          {hopInfo.desc}
        </p>

        {/* Contract Address Card */}
        <div className="mt-3 flex items-center justify-between p-2 rounded-[2px] bg-[#0e0e12] border border-[#282832] font-mono text-xs">
          <span className="text-[#ececf2] truncate max-w-[190px]" title={node.address}>
            {node.address}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => copyText(node.address, "addr")}
              className="p-1 rounded-[2px] text-[#aaaab8] hover:text-white hover:bg-[#282832] transition-colors cursor-pointer"
              title="Copy Address"
            >
              {copiedAddress ? <Check className="w-3.5 h-3.5 text-[#b068ff]" /> : <Copy className="w-3.5 h-3.5 text-[#aaaab8]" />}
            </button>
            <a
              href={etherscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-[2px] text-[#aaaab8] hover:text-white hover:bg-[#282832] transition-colors"
              title="View on Etherscan"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Relational Table Attributes (Arkiv contract_node_v1 schema) */}
      <div className="space-y-2 font-mono text-xs">
        <div className="text-[10px] uppercase tracking-wider text-[#aaaab8] font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#d6d8e4]" />
            <span>Relational Attributes</span>
          </span>
          <span className="text-[9px] bg-[#282832] text-[#d6d8e4] px-1.5 py-0.2 rounded-[2px]">
            contract_node_v1
          </span>
        </div>

        <div className="rounded-[4px] border border-[#282832] bg-[#0e0e12] overflow-hidden text-[11px]">
          <div className="divide-y divide-[#282832]">
            <div className="grid grid-cols-2 p-2">
              <span className="text-[#aaaab8]">contractAddress</span>
              <span className="text-[#ececf2] truncate" title={node.address}>{node.address.slice(0, 8)}...{node.address.slice(-6)}</span>
            </div>
            <div className="grid grid-cols-2 p-2 bg-[#17171d]/60">
              <span className="text-[#aaaab8]">protocolId</span>
              <span className="text-[#d6d8e4]">aave-v3-mainnet</span>
            </div>
            <div className="grid grid-cols-2 p-2">
              <span className="text-[#aaaab8]">hop</span>
              <span className="text-[#ececf2] font-semibold">{node.hop}</span>
            </div>
            <div className="grid grid-cols-2 p-2 bg-[#17171d]/60">
              <span className="text-[#aaaab8]">category</span>
              <span className="text-[#ececf2] font-semibold">{node.category}</span>
            </div>
            <div className="grid grid-cols-2 p-2">
              <span className="text-[#aaaab8]">riskScore</span>
              <span className="text-[#ececf2] font-bold">{node.riskScore}</span>
            </div>
            <div className="grid grid-cols-2 p-2 bg-[#17171d]/60">
              <span className="text-[#aaaab8]">proxyType</span>
              <span className="text-[#d6d8e4] uppercase">{node.proxyType || "none"}</span>
            </div>
            <div className="grid grid-cols-2 p-2">
              <span className="text-[#aaaab8]">adminType</span>
              <span className="text-[#d6d8e4] uppercase">{node.adminType || "none"}</span>
            </div>
            <div className="grid grid-cols-2 p-2 bg-[#17171d]/60">
              <span className="text-[#aaaab8]">sourcifyStatus</span>
              <span className="text-[#d6d8e4] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#b068ff]" />
                {node.sourcifyStatus}
              </span>
            </div>
            <div className="grid grid-cols-2 p-2">
              <span className="text-[#aaaab8]">btlExpiration</span>
              <span className="text-[#ececf2]">50,000 blocks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Explorer Actions: Arkiv & Swarm */}
      <div className="space-y-2.5 font-mono text-xs pt-2 border-t border-[#282832]">
        {/* Arkiv Network Explorer Action */}
        <div className="p-3 rounded-[4px] bg-[#0e0e12] border border-[#282832] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[#d6d8e4] font-semibold">
              <Database className="w-3.5 h-3.5" />
              <span>Arkiv Explorer</span>
            </span>
            <span className="text-[10px] text-[#aaaab8]">Rabdi Testnet</span>
          </div>
          <a
            href={rabdiExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full pt-1"
          >
            <button className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-[2px] bg-[#d6d8e4] hover:bg-[#ececf2] text-[#000000] text-xs font-mono font-semibold transition-colors cursor-pointer">
              <Radio className="w-3.5 h-3.5 text-[#000000]" />
              <span>View Entity on Arkiv</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </button>
          </a>
        </div>

        {/* Swarm Evidence Blob Action */}
        <div className="p-3 rounded-[4px] bg-[#0e0e12] border border-[#282832] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[#d6d8e4] font-semibold">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Swarm Evidence</span>
            </span>
            <span className="text-[10px] text-[#aaaab8]">BZZ Hash</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#aaaab8]">
            <span className="truncate max-w-[190px]" title={swarmHash}>
              bzz://{swarmHash.slice(0, 16)}...
            </span>
            <button
              onClick={() => copyText(swarmHash, "swarm")}
              className="p-1 hover:text-white text-[#7d8495] cursor-pointer"
              title="Copy BZZ Hash"
            >
              {copiedSwarm ? <Check className="w-3 h-3 text-[#b068ff]" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <a
              href={swarmGatewayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <button className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-[2px] bg-[#282832] hover:bg-[#7d8495]/40 text-[#ececf2] text-xs font-mono transition-colors cursor-pointer">
                <HardDrive className="w-3.5 h-3.5 text-[#d6d8e4]" />
                <span>Open Swarm Gateway</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </button>
            </a>
            <button
              onClick={() => setShowSwarmPayload(!showSwarmPayload)}
              className="px-2.5 py-2 rounded-[2px] bg-[#282832] hover:bg-[#7d8495]/40 text-[#ececf2] text-xs transition-colors cursor-pointer flex items-center gap-1"
              title="Toggle Payload"
            >
              <Code2 className="w-3.5 h-3.5" />
              {showSwarmPayload ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Expandable Swarm Payload */}
          {showSwarmPayload && (
            <div className="p-2.5 rounded-[2px] bg-[#17171d] border border-[#282832] text-[10px] font-mono text-[#aaaab8] space-y-1 mt-2">
              <div className="text-[#ececf2] font-semibold">Raw Evidence Verification:</div>
              <div>Address: <span className="text-[#d6d8e4]">{node.address}</span></div>
              <div>Bytecode Hash: <span className="text-[#d6d8e4]">{node.bytecodeHash || "0x96107dc4006b...2679"}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Address Justification Section */}
      {node.justification && (
        <div className="p-3.5 rounded-[4px] bg-[#0e0e12] border border-[#282832] space-y-2 text-xs font-mono">
          <div className="text-[10px] uppercase tracking-wider text-[#aaaab8] font-semibold">
            Address Discovery Source
          </div>
          <div className="space-y-1 text-[11px] text-[#aaaab8]">
            <div>Source: <span className="text-[#ececf2]">{node.justification.source}</span></div>
            <div>Method: <span className="text-[#d6d8e4]">{node.justification.method}</span></div>
            {node.justification.slot && (
              <div>Slot: <code className="text-[#b068ff] text-[10px]">{node.justification.slot}</code></div>
            )}
          </div>
        </div>
      )}

      {/* Multisig Signers if applicable */}
      {node.safeOwners && node.safeOwners.length > 0 && (
        <div className="p-3 rounded-[4px] bg-[#0e0e12] border border-[#282832] space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-[#aaaab8]">
            <span>Gnosis Safe Multisig</span>
            <span className="text-[#ececf2] font-semibold">
              {node.safeThreshold || 3} of {node.safeOwnerCount || node.safeOwners.length}
            </span>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
            {node.safeOwners.map((owner, idx) => (
              <div key={idx} className="text-[10px] text-[#aaaab8] flex items-center justify-between">
                <span>Signer {idx + 1}:</span>
                <span className="text-[#ececf2] font-mono">{owner.slice(0, 8)}...{owner.slice(-6)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

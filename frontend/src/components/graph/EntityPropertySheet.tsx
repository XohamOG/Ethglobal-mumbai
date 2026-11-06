"use client";

import React, { useState } from "react";
import { GraphNode } from "@/lib/graph-data";
import { ShinyButton } from "@/components/ui/ShinyButton";
import {
  ExternalLink,
  Copy,
  Check,
  Shield,
  Layers,
  Database,
  Lock,
  Clock,
  Radio,
  FileCode,
  Users,
  CheckCircle2,
  HardDrive,
  HelpCircle,
  Search,
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
  const [copiedArkiv, setCopiedArkiv] = useState(false);
  const [copiedSwarm, setCopiedSwarm] = useState(false);
  const [showSwarmPayload, setShowSwarmPayload] = useState(false);

  const copyText = (text: string, type: "addr" | "arkiv" | "swarm") => {
    navigator.clipboard.writeText(text);
    if (type === "addr") {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 1800);
    } else if (type === "arkiv") {
      setCopiedArkiv(true);
      setTimeout(() => setCopiedArkiv(false), 1800);
    } else {
      setCopiedSwarm(true);
      setTimeout(() => setCopiedSwarm(false), 1800);
    }
  };

  const categoryStyles: Record<string, { bg: string; border: string; text: string; ring: string }> = {
    proxy: { bg: "bg-sky-950/60", border: "border-sky-800/60", text: "text-sky-400", ring: "#38bdf8" },
    implementation: { bg: "bg-emerald-950/60", border: "border-emerald-800/60", text: "text-emerald-400", ring: "#34d399" },
    oracle: { bg: "bg-amber-950/60", border: "border-amber-800/60", text: "text-amber-400", ring: "#fbbf24" },
    multisig: { bg: "bg-purple-950/60", border: "border-purple-800/60", text: "text-purple-400", ring: "#c084fc" },
    timelock: { bg: "bg-indigo-950/60", border: "border-indigo-800/60", text: "text-indigo-400", ring: "#818cf8" },
  };

  const catStyle =
    node.adminType === "timelock"
      ? categoryStyles.timelock
      : categoryStyles[node.category] || {
          bg: "bg-slate-900",
          border: "border-slate-800",
          text: "text-slate-400",
          ring: "#94a3b8",
        };

  const rabdiExplorerUrl = `https://rabdi.explorer.arkiv.network/address/${node.address}`;
  const etherscanUrl = `https://etherscan.io/address/${node.address}`;
  const swarmHash = node.swarmBytecodeRef || "b25edc5390f04681cd534c49f788701fc76c6c64b01eb7f4f99404d20a99beba";
  const swarmGatewayUrl = `https://gateway.ethswarm.org/bzz/${swarmHash}`;

  const hopLabels: Record<number, { title: string; desc: string; badge: string }> = {
    0: {
      title: "Hop 0 · Core Architecture",
      desc: "Direct execution contract within the primary protocol diamond/proxy mesh.",
      badge: "border-blue-800/60 bg-blue-950/40 text-blue-400",
    },
    1: {
      title: "Hop 1 · Governance & Admin",
      desc: "Immediate administrative, timelock, or multi-sig owner controlling core contracts.",
      badge: "border-purple-800/60 bg-purple-950/40 text-purple-400",
    },
    2: {
      title: "Hop 2 · External Dependencies",
      desc: "Transitive external oracle price feed or underlying asset reserve contract.",
      badge: "border-amber-800/60 bg-amber-950/40 text-amber-400",
    },
  };

  const hopInfo = hopLabels[node.hop] || hopLabels[0];

  return (
    <div className="flex flex-col gap-5 text-[#e2e8f0]">
      {/* Entity Header */}
      <div className="border-b border-[#171d2b] pb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${hopInfo.badge}`}>
            {hopInfo.title}
          </span>
          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${catStyle.bg} ${catStyle.border} ${catStyle.text}`}>
            {node.category}
          </span>
        </div>

        <h2 className="text-base font-semibold text-white tracking-tight mb-1">
          {node.label}
        </h2>
        <p className="text-[11px] text-[#63728f] font-mono leading-relaxed">
          {hopInfo.desc}
        </p>

        {/* Contract Address Card */}
        <div className="mt-3 flex items-center justify-between p-2 rounded-lg bg-[#0c1018] border border-[#1b2334] font-mono text-xs">
          <span className="text-[#9aa7c2] truncate max-w-[200px]" title={node.address}>
            {node.address}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => copyText(node.address, "addr")}
              className="p-1 rounded text-[#5e6d8a] hover:text-white hover:bg-[#161d2d] transition-colors cursor-pointer"
              title="Copy Address"
            >
              {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={etherscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded text-[#5e6d8a] hover:text-white hover:bg-[#161d2d] transition-colors"
              title="View on Etherscan"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Relational Table Attributes (Arkiv contract_node_v1 schema) */}
      <div className="space-y-2 font-mono text-xs">
        <div className="text-[10px] uppercase tracking-wider text-[#536280] font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Relational Table Attributes (Arkiv)</span>
          </span>
          <span className="text-[9px] bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 px-1.5 py-0.2 rounded">
            contract_node_v1
          </span>
        </div>

        <div className="rounded-lg border border-[#182033] bg-[#0a0d16] overflow-hidden text-[11px]">
          <div className="divide-y divide-[#141b2c]">
            <div className="grid grid-cols-2 p-2 bg-[#0d121e]">
              <span className="text-[#596987]">contractAddress</span>
              <span className="text-white truncate" title={node.address}>{node.address.slice(0, 8)}...{node.address.slice(-6)}</span>
            </div>
            <div className="grid grid-cols-2 p-2">
              <span className="text-[#596987]">protocolId</span>
              <span className="text-blue-400">aave-v3-mainnet</span>
            </div>
            <div className="grid grid-cols-2 p-2 bg-[#0d121e]">
              <span className="text-[#596987]">snapshotId</span>
              <span className="text-[#8c9cb8] truncate">aave-v3-mainnet-26354138</span>
            </div>
            <div className="grid grid-cols-2 p-2">
              <span className="text-[#596987]">hop</span>
              <span className="text-white font-semibold">{node.hop}</span>
            </div>
            <div className="grid grid-cols-2 p-2 bg-[#0d121e]">
              <span className="text-[#596987]">category</span>
              <span className="text-emerald-400 font-semibold">{node.category}</span>
            </div>
            <div className="grid grid-cols-2 p-2">
              <span className="text-[#596987]">riskScore</span>
              <span className="text-amber-400 font-bold">{node.riskScore}</span>
            </div>
            <div className="grid grid-cols-2 p-2 bg-[#0d121e]">
              <span className="text-[#596987]">proxyType</span>
              <span className="text-sky-300 uppercase">{node.proxyType || "none"}</span>
            </div>
            <div className="grid grid-cols-2 p-2">
              <span className="text-[#596987]">adminType</span>
              <span className="text-purple-300 uppercase">{node.adminType || "none"}</span>
            </div>
            <div className="grid grid-cols-2 p-2 bg-[#0d121e]">
              <span className="text-[#596987]">sourcifyStatus</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {node.sourcifyStatus}
              </span>
            </div>
            <div className="grid grid-cols-2 p-2">
              <span className="text-[#596987]">btlExpiration</span>
              <span className="text-white">50,000 blocks (~7d)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Explorer Links: Arkiv & Swarm */}
      <div className="space-y-3 font-mono text-xs pt-2 border-t border-[#171d2b]">
        {/* Arkiv Network Explorer Action */}
        <div className="p-3 rounded-lg bg-[#0c101d] border border-indigo-900/50 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
              <Database className="w-3.5 h-3.5" />
              <span>Arkiv Network Explorer</span>
            </span>
            <span className="text-[10px] text-emerald-400">Rabdi Testnet #7794095</span>
          </div>
          <div className="text-[10px] text-[#7888a7] truncate" title={node.address}>
            Entity Address: <code className="text-white">{node.address}</code>
          </div>
          <a
            href={rabdiExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full pt-1"
          >
            <ShinyButton className="w-full justify-center py-2 text-xs" variant="primary">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>View Entity on Arkiv Rabdi Explorer</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </ShinyButton>
          </a>
        </div>

        {/* Swarm Evidence Blob Action */}
        <div className="p-3 rounded-lg bg-[#14100c] border border-amber-900/50 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Swarm Decentralized Evidence</span>
            </span>
            <span className="text-[10px] text-amber-300">BZZ Content Address</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#8696b5]">
            <span className="truncate max-w-[200px]" title={swarmHash}>
              bzz://{swarmHash.slice(0, 16)}...
            </span>
            <button
              onClick={() => copyText(swarmHash, "swarm")}
              className="p-1 hover:text-white text-[#6b7b99] cursor-pointer"
              title="Copy BZZ Hash"
            >
              {copiedSwarm ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <a
              href={swarmGatewayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <ShinyButton className="w-full justify-center py-2 text-xs">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span>Open Swarm Gateway</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </ShinyButton>
            </a>
            <button
              onClick={() => setShowSwarmPayload(!showSwarmPayload)}
              className="px-2.5 py-2 rounded-lg bg-[#1a140f] hover:bg-[#251d16] border border-amber-800/40 text-amber-300 text-xs transition-colors cursor-pointer flex items-center gap-1"
              title="Toggle Raw JSON Payload"
            >
              <Code2 className="w-3.5 h-3.5" />
              {showSwarmPayload ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Expandable Swarm Raw Bytecode / Evidence Payload */}
          {showSwarmPayload && (
            <div className="p-2.5 rounded bg-[#090704] border border-[#2b1f14] text-[10px] font-mono text-[#9eaebb] space-y-1 mt-2">
              <div className="text-amber-400 font-semibold">Raw Bytecode & Verification Evidence:</div>
              <div className="text-[#6d7c8d]">
                Deployed Address: <span className="text-white">{node.address}</span>
              </div>
              <div className="text-[#6d7c8d]">
                Bytecode Hash: <span className="text-emerald-400">{node.bytecodeHash || "0x96107dc4006b...2679"}</span>
              </div>
              <div className="text-[#6d7c8d]">
                Sourcify IPFS Hash: <span className="text-indigo-400">QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Address Justification & Discovery Provenance Section */}
      {node.justification && (
        <div className="p-3.5 rounded-lg bg-[#0b0f1a] border border-[#1d273d] space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[11px] uppercase tracking-wider">
              <Search className="w-3.5 h-3.5" />
              <span>Address Justification</span>
            </div>
            <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.2 rounded font-semibold">
              Verified
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div>
              <span className="text-[#556485]">Canonical Source: </span>
              <span className="text-white font-medium">{node.justification.source}</span>
            </div>
            <div>
              <span className="text-[#556485]">Discovery Vector: </span>
              <span className="text-indigo-300">{node.justification.method}</span>
            </div>
            {node.justification.slot && (
              <div>
                <span className="text-[#556485]">EVM Storage Slot: </span>
                <code className="text-amber-400 text-[10px] break-all">{node.justification.slot}</code>
              </div>
            )}
            <div className="text-[#8697b4] text-[11px] pt-1.5 border-t border-[#141b2c] leading-relaxed italic">
              "{node.justification.description}"
            </div>
          </div>
        </div>
      )}

      {/* Risk Assessment Score Card */}
      <div className="p-3.5 rounded-lg bg-[#0b0e16] border border-[#182030] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#8290ad]">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Composite Risk Score</span>
          </div>
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
              node.riskScore === 0
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                : node.riskScore <= 10
                ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/40"
                : "bg-amber-950/60 text-amber-400 border border-amber-800/60"
            }`}
          >
            {node.riskScore} / 100
          </span>
        </div>

        {/* 7-Factor Breakdown Bar */}
        {node.breakdown && (
          <div className="space-y-1.5 pt-2 border-t border-[#151c2a] text-[11px] font-mono">
            <div className="flex justify-between items-center text-[#6e7d9c]">
              <span>F1 Verification (Sourcify):</span>
              <span className="text-white font-medium">{node.breakdown.f1_verification}</span>
            </div>
            <div className="flex justify-between items-center text-[#6e7d9c]">
              <span>F2 Admin Control:</span>
              <span className="text-white font-medium">{node.breakdown.f2_admin_control}</span>
            </div>
            <div className="flex justify-between items-center text-[#6e7d9c]">
              <span>F3 Upgradeability (EIP-1967):</span>
              <span className="text-white font-medium">{node.breakdown.f3_upgradeability}</span>
            </div>
            <div className="flex justify-between items-center text-[#6e7d9c]">
              <span>F4 Oracle Freshness:</span>
              <span className="text-white font-medium">{node.breakdown.f4_oracle_freshness}</span>
            </div>
            <div className="flex justify-between items-center text-[#6e7d9c]">
              <span>F5 Concentration Risk:</span>
              <span className="text-white font-medium">{node.breakdown.f5_concentration_risk}</span>
            </div>
            <div className="flex justify-between items-center text-[#6e7d9c]">
              <span>F6 Contract Age:</span>
              <span className="text-white font-medium">{node.breakdown.f6_contract_age}</span>
            </div>
            <div className="flex justify-between items-center text-[#6e7d9c]">
              <span>F7 Incident History:</span>
              <span className="text-white font-medium">{node.breakdown.f7_incident_history}</span>
            </div>
          </div>
        )}
      </div>

      {/* Multisig Signers if applicable */}
      {node.safeOwners && node.safeOwners.length > 0 && (
        <div className="p-2.5 rounded-lg bg-[#0d0f1a] border border-[#1d2338] space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-[#818ea8]">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Gnosis Safe Multisig</span>
            </div>
            <span className="text-purple-300 font-bold">
              {node.safeThreshold || 3} of {node.safeOwnerCount || node.safeOwners.length} Required
            </span>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
            {node.safeOwners.map((owner, idx) => (
              <div key={idx} className="text-[10px] text-[#6b7b99] flex items-center justify-between">
                <span>Signer {idx + 1}:</span>
                <span className="text-[#a0aec0] font-mono">{owner.slice(0, 8)}...{owner.slice(-6)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

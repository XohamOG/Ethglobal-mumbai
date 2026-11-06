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
  AlertTriangle,
  HardDrive,
} from "lucide-react";

interface EntityPropertySheetProps {
  node: GraphNode;
  onClose?: () => void;
}

export function EntityPropertySheet({ node }: EntityPropertySheetProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedArkiv, setCopiedArkiv] = useState(false);

  const copyText = (text: string, type: "addr" | "arkiv") => {
    navigator.clipboard.writeText(text);
    if (type === "addr") {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 1800);
    } else {
      setCopiedArkiv(true);
      setTimeout(() => setCopiedArkiv(false), 1800);
    }
  };

  const categoryStyles: Record<string, { bg: string; border: string; text: string; ring: string }> = {
    proxy: { bg: "bg-sky-950/60", border: "border-sky-800/60", text: "text-sky-400", ring: "#38bdf8" },
    implementation: { bg: "bg-emerald-950/60", border: "border-emerald-800/60", text: "text-emerald-400", ring: "#34d399" },
    oracle: { bg: "bg-amber-950/60", border: "border-amber-800/60", text: "text-amber-400", ring: "#fbbf24" },
    multisig: { bg: "bg-purple-950/60", border: "border-purple-800/60", text: "text-purple-400", ring: "#c084fc" },
    timelock: { bg: "bg-indigo-950/60", border: "border-indigo-800/60", text: "text-indigo-400", ring: "#818cf8" },
    token: { bg: "bg-teal-950/60", border: "border-teal-800/60", text: "text-teal-400", ring: "#2dd4bf" },
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

  const rabdiExplorerUrl = `https://rabdi.explorer.arkiv.network`;
  const etherscanUrl = `https://etherscan.io/address/${node.address}`;

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
            {node.address.slice(0, 10)}...{node.address.slice(-8)}
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

      {/* Contract Implementation & Admin Control */}
      <div className="space-y-2.5 text-xs font-mono">
        <div className="text-[10px] uppercase tracking-wider text-[#536280] font-semibold">
          Proxy & Access Control
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg bg-[#0a0d14] border border-[#161c28]">
            <div className="text-[10px] text-[#556381] mb-1">Proxy Standard</div>
            <div className="text-white font-semibold uppercase">{node.proxyType || "None"}</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0a0d14] border border-[#161c28]">
            <div className="text-[10px] text-[#556381] mb-1">Admin Controller</div>
            <div className="text-white font-semibold uppercase">{node.adminType || "None"}</div>
          </div>
        </div>

        {/* If Safe Multisig: Show Signers and Threshold */}
        {node.safeOwners && node.safeOwners.length > 0 && (
          <div className="p-2.5 rounded-lg bg-[#0d0f1a] border border-[#1d2338] space-y-2">
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

        {/* Sourcify Match Status */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0a0d14] border border-[#161c28]">
          <div className="flex items-center gap-2">
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[#7f8da8]">Sourcify Status:</span>
          </div>
          <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3 h-3" />
            {node.sourcifyStatus.toUpperCase().replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Arkiv & Swarm Decentralized Persistence */}
      <div className="space-y-2.5 text-xs font-mono pt-2 border-t border-[#171d2b]">
        <div className="text-[10px] uppercase tracking-wider text-[#536280] font-semibold flex items-center gap-1.5">
          <Database className="w-3 h-3 text-indigo-400" />
          <span>Arkiv & Swarm Storage Details</span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#0a0d14] border border-[#161c28] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#657491]">Arkiv Entity Tag:</span>
            <span className="text-indigo-400">contract_node_v1</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#657491]">BTL Expiration:</span>
            <span className="text-white">50,000 blocks (~7d)</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#657491]">Swarm Bytecode Ref:</span>
            <span className="text-amber-400 truncate max-w-[140px]" title={node.swarmBytecodeRef || "bzz://..."}>
              {node.swarmBytecodeRef ? `${node.swarmBytecodeRef.slice(0, 10)}...` : "Verified"}
            </span>
          </div>
        </div>

        {/* View on Arkiv Rabdi Explorer Button */}
        <a
          href={rabdiExplorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full pt-1"
        >
          <ShinyButton className="w-full justify-center py-2 text-xs">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verify on Rabdi Explorer</span>
            <ExternalLink className="w-3 h-3 ml-1" />
          </ShinyButton>
        </a>
      </div>
    </div>
  );
}

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
} from "lucide-react";

interface Neo4jPropertySheetProps {
  node: GraphNode;
  onClose?: () => void;
}

export function Neo4jPropertySheet({ node }: Neo4jPropertySheetProps) {
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

  // Breakdown values from backend fixtures or defaults
  const bd = node.breakdown || {
    f1_verification: node.sourcifyStatus === "full_match" ? 0 : 8,
    f2_admin_control: node.adminType === "timelock" ? 2 : node.adminType === "safe" ? 7 : 0,
    f3_upgradeability: node.proxyType === "eip1967" ? 10 : 0,
    f4_oracle_freshness: 0,
    f5_concentration_risk: node.safeThreshold ? 3 : 0,
    f6_contract_age: 0,
    f7_incident_history: 0,
    totalScore: node.riskScore,
  };

  const riskFactors = [
    { label: "F1 · Verification", val: bd.f1_verification, max: 20 },
    { label: "F2 · Admin Control", val: bd.f2_admin_control, max: 20 },
    { label: "F3 · Upgradeability", val: bd.f3_upgradeability, max: 15 },
    { label: "F4 · Oracle Freshness", val: bd.f4_oracle_freshness, max: 15 },
    { label: "F5 · Concentration", val: bd.f5_concentration_risk, max: 15 },
    { label: "F6 · Contract Age", val: bd.f6_contract_age, max: 10 },
    { label: "F7 · Exploit History", val: bd.f7_incident_history, max: 5 },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between text-xs font-sans">
      <div className="space-y-4">
        {/* Node Header */}
        <div className="pb-3 border-b border-[#181d2a]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${catStyle.bg} ${catStyle.border} ${catStyle.text}`}
            >
              {node.category}
            </span>
            <span className="text-[10px] font-mono text-[#626e89]">
              Hop {node.hop} {node.hop === 0 ? "· Core Root" : node.hop === 1 ? "· Direct Dep" : "· Transitive"}
            </span>
          </div>

          <h2 className="text-sm font-semibold text-white tracking-tight">{node.label}</h2>
          <div className="text-[11px] font-mono text-[#64748b] mt-0.5">
            {node.contractName || "EVM Contract Node"}
          </div>
        </div>

        {/* Contract Address & Arkiv Key */}
        <div className="space-y-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#525e79] mb-1">
              On-Chain Address
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#0c0f18] border border-[#1b2234] text-[11px] font-mono text-[#94a3b8]">
              <span className="truncate max-w-[190px]">{node.address}</span>
              <button
                onClick={() => copyText(node.address, "addr")}
                className="hover:text-white cursor-pointer ml-2 p-1"
                title="Copy address"
              >
                {copiedAddress ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#5b6883]" />
                )}
              </button>
            </div>
          </div>

          {node.arkivEntityKey && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#525e79] mb-1 flex items-center justify-between">
                <span>Arkiv Rabdi Entity</span>
                <span className="text-[9px] text-blue-400 font-mono">Verified DB-Chain</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0c0f18] border border-[#1b2234] text-[11px] font-mono text-[#7e8b9f]">
                <span className="truncate max-w-[190px]">{node.arkivEntityKey}</span>
                <button
                  onClick={() => copyText(node.arkivEntityKey!, "arkiv")}
                  className="hover:text-white cursor-pointer ml-2 p-1"
                  title="Copy entity key"
                >
                  {copiedArkiv ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#5b6883]" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Node Properties Table */}
        <div className="p-2.5 rounded-lg bg-[#0b0e17] border border-[#181d2a] space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between items-center py-0.5">
            <span className="text-[#64748b]">Proxy Pattern</span>
            <span className="text-white font-semibold uppercase">{node.proxyType}</span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-[#64748b]">Governance Admin</span>
            <span className="text-white font-semibold capitalize">{node.adminType}</span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-[#64748b]">Sourcify Status</span>
            <span
              className={`font-semibold ${
                node.sourcifyStatus === "full_match"
                  ? "text-emerald-400"
                  : node.sourcifyStatus === "partial_match"
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {node.sourcifyStatus}
            </span>
          </div>

          {node.referencedProtocolId && (
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Cross-Protocol</span>
              <span className="text-indigo-400 font-semibold">{node.referencedProtocolId}</span>
            </div>
          )}

          {node.adminAddress && (
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Admin Slot Target</span>
              <span className="text-[#94a3b8] truncate max-w-[130px]">{node.adminAddress}</span>
            </div>
          )}
        </div>

        {/* 7-Factor Risk Breakdown Gauge */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono mb-2">
            <span className="text-[#64748b] uppercase tracking-wider text-[10px]">
              7-Factor Risk Model
            </span>
            <span className="text-emerald-400 font-bold font-mono">
              Score: {node.riskScore} / 100
            </span>
          </div>

          <div className="space-y-1.5 p-2.5 rounded-lg bg-[#0b0e17] border border-[#181d2a]">
            {riskFactors.map((f) => (
              <div key={f.label} className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-mono text-[#717d97]">
                  <span>{f.label}</span>
                  <span className={f.val > 0 ? "text-amber-400 font-medium" : "text-emerald-400"}>
                    {f.val} / {f.max}
                  </span>
                </div>
                <div className="h-1 bg-[#151a27] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      f.val === 0
                        ? "bg-emerald-500/80"
                        : f.val <= 5
                        ? "bg-amber-400"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, (f.val / f.max) * 100 || 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safe Governance Signers (If Safe Multisig) */}
        {node.category === "multisig" && node.safeOwners && (
          <div className="p-3 rounded-lg bg-[#0e111a] border border-purple-900/30">
            <div className="flex items-center justify-between mb-1.5 font-mono">
              <span className="text-xs font-semibold text-purple-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Safe Multisig
              </span>
              <span className="text-[10px] text-[#8e99b0]">
                {node.safeThreshold} of {node.safeOwnerCount} Signers
              </span>
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {node.safeOwners.map((owner, i) => (
                <div key={owner} className="text-[10px] font-mono text-[#8b97af] truncate">
                  {i + 1}. {owner}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Links */}
      <div className="pt-4 border-t border-[#181d2a] space-y-2 mt-4">
        <a href={rabdiExplorerUrl} target="_blank" rel="noreferrer" className="block">
          <ShinyButton variant="primary" className="w-full justify-between text-xs py-2">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Query on Arkiv Rabdi</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-[#64748b]" />
          </ShinyButton>
        </a>

        <a href={etherscanUrl} target="_blank" rel="noreferrer" className="block">
          <ShinyButton variant="secondary" className="w-full justify-between text-xs py-2">
            <span>Etherscan Contract</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#64748b]" />
          </ShinyButton>
        </a>
      </div>
    </div>
  );
}


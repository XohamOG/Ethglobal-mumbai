"use client";

import React, { useState } from "react";
import { GraphNode, getRiskScoreConfig } from "@/lib/graph-data";
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
  const [copiedArkivKey, setCopiedArkivKey] = useState(false);
  const [copiedSwarm, setCopiedSwarm] = useState(false);
  const [showSwarmPayload, setShowSwarmPayload] = useState(false);

  const nodeRisk = getRiskScoreConfig(node.riskScore);

  const copyText = (text: string, type: "addr" | "arkiv" | "swarm") => {
    navigator.clipboard.writeText(text);
    if (type === "addr") {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 1800);
    } else if (type === "arkiv") {
      setCopiedArkivKey(true);
      setTimeout(() => setCopiedArkivKey(false), 1800);
    } else {
      setCopiedSwarm(true);
      setTimeout(() => setCopiedSwarm(false), 1800);
    }
  };

  const arkivKey = node.arkivEntityKey || node.address;
  const rabdiExplorerUrl = node.arkivEntityKey
    ? `https://rabdi.explorer.arkiv.network/entity/${node.arkivEntityKey}`
    : `https://rabdi.explorer.arkiv.network/address/${node.address}`;
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
      title: "Hop 2 · Price Feed Dependencies",
      desc: "Upstream Chainlink Oracle aggregator feeds supplying real-time pricing data.",
    },
  };

  const currentHopInfo = hopLabels[node.hop] || hopLabels[0];

  return (
    <div className="space-y-5 text-left text-[#f3f3f3]">
      {/* Header Info */}
      <div className="border-b border-[#212121] pb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#101010] border border-[#212121] uppercase tracking-wider text-[#9c9c9c]">
            {node.category}
          </span>
          {node.hop !== undefined && (
            <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#101010] border border-[#212121] uppercase tracking-wider text-[#9c9c9c]">
              Hop {node.hop}
            </span>
          )}
        </div>

        <h3 className="text-[18px] font-normal text-[#f3f3f3] tracking-tight">
          {node.label}
        </h3>
        <p className="text-[12px] text-[#9c9c9c] font-mono mt-0.5">
          {node.contractName || "Verified EVM Contract"}
        </p>

        {/* Address Pill with Copy & External link */}
        <div className="mt-3 flex items-center justify-between bg-[#101010] px-3 py-2 rounded-[4px] border border-[#212121] text-[11px] font-mono text-[#9c9c9c]">
          <span className="truncate max-w-[210px]">{node.address}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => copyText(node.address, "addr")}
              className="p-1 hover:text-[#f3f3f3] cursor-pointer"
              title="Copy Address"
            >
              {copiedAddress ? <Check className="w-3.5 h-3.5 text-[#98ff38]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={etherscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:text-[#f3f3f3]"
              title="View on Etherscan"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Hop Classification Card */}
      <div className="p-3.5 rounded-[8px] bg-[#101010] border border-[#212121] space-y-1">
        <div className="text-[11px] uppercase tracking-wider text-[#6f6759]">
          {currentHopInfo.title}
        </div>
        <p className="text-[12px] text-[#9c9c9c] leading-relaxed">
          {currentHopInfo.desc}
        </p>
      </div>

      {/* Risk Assessment Score Card */}
      <div className="p-4 rounded-[8px] bg-[#101010] border border-[#212121] space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[12px] uppercase tracking-wider text-[#9c9c9c]">
            <Shield className="w-3.5 h-3.5 text-[#6f6759]" />
            <span>Risk Score</span>
          </span>
          <span className="text-[12px] font-mono text-[#98ff38] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#98ff38]" />
            <span>{node.riskScore} ({nodeRisk.tier})</span>
          </span>
        </div>

        {/* 7-Factor Score Breakdown */}
        {node.breakdown && (
          <div className="space-y-1.5 pt-2 border-t border-[#212121] text-[11px] font-mono text-[#9c9c9c]">
            <div className="flex justify-between">
              <span>F1 Verification:</span>
              <span className="text-[#f3f3f3]">{node.breakdown.f1_verification} pts</span>
            </div>
            <div className="flex justify-between">
              <span>F2 Admin Control:</span>
              <span className="text-[#f3f3f3]">{node.breakdown.f2_admin_control} pts</span>
            </div>
            <div className="flex justify-between">
              <span>F3 Upgradeability:</span>
              <span className="text-[#f3f3f3]">{node.breakdown.f3_upgradeability} pts</span>
            </div>
            <div className="flex justify-between">
              <span>F4 Oracle Staleness:</span>
              <span className="text-[#f3f3f3]">{node.breakdown.f4_oracle_freshness} pts</span>
            </div>
            <div className="flex justify-between">
              <span>F5 Concentration:</span>
              <span className="text-[#f3f3f3]">{node.breakdown.f5_concentration_risk} pts</span>
            </div>
            <div className="flex justify-between">
              <span>F6 Contract Age:</span>
              <span className="text-[#f3f3f3]">{node.breakdown.f6_contract_age} pts</span>
            </div>
          </div>
        )}
      </div>

      {/* Technical Properties Table */}
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-widest text-[#9c9c9c]">
          Contract Lineage Parameters
        </div>
        <div className="rounded-[8px] border border-[#212121] overflow-hidden text-[12px]">
          <div className="divide-y divide-[#212121]">
            <div className="grid grid-cols-2 p-2.5 bg-[#080808]">
              <span className="text-[#9c9c9c]">proxyType</span>
              <span className="text-[#f3f3f3] uppercase font-mono">{node.proxyType || "none"}</span>
            </div>
            <div className="grid grid-cols-2 p-2.5">
              <span className="text-[#9c9c9c]">adminType</span>
              <span className="text-[#f3f3f3] uppercase font-mono">{node.adminType || "none"}</span>
            </div>
            <div className="grid grid-cols-2 p-2.5 bg-[#080808]">
              <span className="text-[#9c9c9c]">sourcifyStatus</span>
              <span className="text-[#98ff38] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#98ff38]" />
                {node.sourcifyStatus}
              </span>
            </div>
            <div className="grid grid-cols-2 p-2.5">
              <span className="text-[#9c9c9c]">btlExpiration</span>
              <span className="text-[#f3f3f3]">50,000 blocks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Explorer Actions: Arkiv & Swarm */}
      <div className="space-y-3 text-[12px] pt-3 border-t border-[#212121]">
        {/* Arkiv Network Explorer Action */}
        <div className="p-4 rounded-[8px] bg-[#101010] border border-[#212121] space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[#f3f3f3]">
              <Database className="w-3.5 h-3.5 text-[#6f6759]" />
              <span>Arkiv Rabdi DB-Chain</span>
            </span>
            <span className="text-[11px] text-[#9c9c9c] font-mono">#7794095</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#9c9c9c] font-mono bg-[#080808] px-3 py-2 rounded-[4px] border border-[#212121]">
            <span className="truncate max-w-[210px]" title={arkivKey}>
              Key: {arkivKey.slice(0, 10)}...{arkivKey.slice(-6)}
            </span>
            <button
              onClick={() => copyText(arkivKey, "arkiv")}
              className="p-1 hover:text-[#f3f3f3] cursor-pointer"
              title="Copy Arkiv Entity Key"
            >
              {copiedArkivKey ? <Check className="w-3.5 h-3.5 text-[#98ff38]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* White Pill Button — Primary CTA */}
          <a
            href={rabdiExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full pt-1"
          >
            <button className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-[#ffffff] hover:bg-[#f3f3f3] text-[#101010] text-[12px] uppercase font-normal tracking-wider transition-colors cursor-pointer">
              <Radio className="w-3.5 h-3.5 text-[#101010]" />
              <span>Open Arkiv Entity Explorer</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </button>
          </a>
        </div>

        {/* Swarm Evidence Blob Action */}
        <div className="p-4 rounded-[8px] bg-[#101010] border border-[#212121] space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[#f3f3f3]">
              <HardDrive className="w-3.5 h-3.5 text-[#6f6759]" />
              <span>Swarm Evidence</span>
            </span>
            <span className="text-[11px] text-[#9c9c9c] font-mono">BZZ Blob</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#9c9c9c] font-mono bg-[#080808] px-3 py-2 rounded-[4px] border border-[#212121]">
            <span className="truncate max-w-[210px]" title={swarmHash}>
              bzz://{swarmHash.slice(0, 16)}...
            </span>
            <button
              onClick={() => copyText(swarmHash, "swarm")}
              className="p-1 hover:text-[#f3f3f3] cursor-pointer"
              title="Copy BZZ Hash"
            >
              {copiedSwarm ? <Check className="w-3.5 h-3.5 text-[#98ff38]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {/* Ghost Outline Button */}
            <a
              href={swarmGatewayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <button className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-[8px] border border-[#474747] hover:border-[#ffffff] bg-transparent text-[#f3f3f3] text-[12px] uppercase tracking-wider transition-colors cursor-pointer">
                <HardDrive className="w-3.5 h-3.5 text-[#6f6759]" />
                <span>Open Gateway</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </button>
            </a>
            <button
              onClick={() => setShowSwarmPayload(!showSwarmPayload)}
              className="px-3 py-2 rounded-[8px] border border-[#212121] hover:border-[#474747] bg-[#080808] text-[#9c9c9c] hover:text-[#f3f3f3] text-[12px] transition-colors cursor-pointer flex items-center gap-1"
              title="Toggle Payload"
            >
              <Code2 className="w-3.5 h-3.5" />
              {showSwarmPayload ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Expandable Swarm Payload */}
          {showSwarmPayload && (
            <div className="p-3 rounded-[4px] bg-[#080808] border border-[#212121] text-[11px] font-mono text-[#9c9c9c] space-y-1 mt-2">
              <div className="text-[#f3f3f3]">Raw Evidence Verification:</div>
              <div>Address: <span className="text-[#f3f3f3]">{node.address}</span></div>
              <div>Bytecode Hash: <span className="text-[#f3f3f3]">{node.bytecodeHash || "0x96107dc4006b...2679"}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Address Justification Section */}
      {node.justification && (
        <div className="p-3.5 rounded-[8px] bg-[#101010] border border-[#212121] space-y-2 text-[12px] font-mono">
          <div className="text-[10px] uppercase tracking-wider text-[#9c9c9c]">
            Address Discovery Source
          </div>
          <div className="space-y-1 text-[11px] text-[#9c9c9c]">
            <div>Source: <span className="text-[#f3f3f3]">{node.justification.source}</span></div>
            <div>Method: <span className="text-[#6f6759]">{node.justification.method}</span></div>
            {node.justification.slot && (
              <div>Slot: <code className="text-[#f3f3f3] text-[10px]">{node.justification.slot}</code></div>
            )}
          </div>
        </div>
      )}

      {/* Multisig Signers if applicable */}
      {node.safeOwners && node.safeOwners.length > 0 && (
        <div className="p-3.5 rounded-[8px] bg-[#101010] border border-[#212121] space-y-2 text-[12px] font-mono">
          <div className="flex items-center justify-between text-[#9c9c9c]">
            <span>Gnosis Safe Multisig</span>
            <span className="text-[#f3f3f3]">
              {node.safeThreshold || 3} of {node.safeOwnerCount || node.safeOwners.length}
            </span>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
            {node.safeOwners.map((owner, idx) => (
              <div key={idx} className="text-[10px] text-[#9c9c9c] flex items-center justify-between">
                <span>Signer {idx + 1}:</span>
                <span className="text-[#f3f3f3] font-mono">{owner.slice(0, 8)}...{owner.slice(-6)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

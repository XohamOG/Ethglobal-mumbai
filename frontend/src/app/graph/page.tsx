"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PROTOCOLS, AAVE_NODES, AAVE_EDGES, GraphNode } from "@/lib/graph-data";
import { ShinyButton } from "@/components/ui/ShinyButton";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

function GraphViewerContent() {
  const searchParams = useSearchParams();
  const protocolId = searchParams.get("protocol") || "aave-v3-mainnet";
  const protocol = PROTOCOLS.find((p) => p.protocolId === protocolId) || PROTOCOLS[0];

  const [selectedNode, setSelectedNode] = useState<GraphNode>(AAVE_NODES[0]);
  const [activeHopFilter, setActiveHopFilter] = useState<number | "all">("all");
  const [copied, setCopied] = useState(false);

  const filteredNodes =
    activeHopFilter === "all"
      ? AAVE_NODES
      : AAVE_NODES.filter((n) => n.hop === activeHopFilter);

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-[#ededed]">
      {/* Top Header */}
      <header className="h-14 border-b border-[#1b1f2b] px-6 flex items-center justify-between bg-[#0b0d13]/80 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-xs text-[#808a9f] hover:text-white transition-colors cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </Link>
          <span className="text-[#202534]">/</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-white">{protocol.name}</span>
            <span className="text-xs font-mono text-[#68728a]">· Dependency Graph</span>
          </div>
        </div>

        {/* Global Protocol Score Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded border border-[#212736] bg-[#11141c] text-xs font-mono">
            <span className="text-[#6d7790]">Composite Risk:</span>
            <span className="text-emerald-400 font-semibold">{protocol.compositeScore}</span>
            <span className="text-[10px] text-emerald-500/80 px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-900/60">
              {protocol.riskTier}
            </span>
          </div>

          <div className="text-xs text-[#525a70] font-mono hidden sm:block">
            Arkiv BTL: 50,000 blks
          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Graph View + Inspector */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Control Column */}
        <div className="w-full md:w-64 border-r border-[#1b1f2b] bg-[#0c0e14] p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#636c84] mb-3">
              Hop Level Depth
            </div>
            <div className="flex flex-col gap-1 mb-6">
              {[
                { id: "all", label: "All Layers (2 Hops)" },
                { id: 0, label: "Hop 0 · Core Protocol" },
                { id: 1, label: "Hop 1 · Direct Dependencies" },
                { id: 2, label: "Hop 2 · Transitive Dependencies" },
              ].map((item) => (
                <button
                  key={String(item.id)}
                  onClick={() => setActiveHopFilter(item.id as number | "all")}
                  className={`w-full text-left px-3 py-2 rounded text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                    activeHopFilter === item.id
                      ? "bg-[#161a24] text-white border border-[#272e40]"
                      : "text-[#737c94] hover:text-white hover:bg-[#11141d]"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] font-mono text-[#4b5368]">
                    {item.id === "all"
                      ? AAVE_NODES.length
                      : AAVE_NODES.filter((n) => n.hop === item.id).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="text-xs font-mono uppercase tracking-wider text-[#636c84] mb-3">
              Contracts in Layer
            </div>
            <div className="flex flex-col gap-1 max-h-[380px] overflow-y-auto pr-1">
              {filteredNodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`w-full text-left px-2.5 py-2 rounded text-xs transition-colors cursor-pointer flex flex-col gap-0.5 ${
                    selectedNode.id === node.id
                      ? "bg-[#151922] text-white border border-[#2e374d]"
                      : "text-[#7e879f] hover:text-white hover:bg-[#0f121a]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{node.label}</span>
                    <span
                      className={`text-[10px] font-mono ${
                        node.riskScore === 0
                          ? "text-emerald-400"
                          : node.riskScore <= 10
                          ? "text-emerald-300"
                          : "text-amber-400"
                      }`}
                    >
                      {node.riskScore}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#4e556b] truncate">
                    {node.address.slice(0, 8)}...{node.address.slice(-6)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#181c26] text-[11px] text-[#555d73] font-mono">
            <span>Evaluated block: #{protocol.lastEvaluatedBlock}</span>
          </div>
        </div>

        {/* Center: Graph Canvas Area */}
        <div className="flex-1 bg-[#090a0f] p-6 relative overflow-auto flex flex-col">
          {/* Legend Banner */}
          <div className="flex items-center justify-between text-xs text-[#6e7790] pb-4 mb-4 border-b border-[#181c26]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-blue-500"></span> Proxy Contract
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-emerald-500"></span> Implementation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-amber-500"></span> Oracle Feed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-purple-500"></span> Multisig Safe
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#4b5368]">
              Click any node to inspect on Arkiv
            </span>
          </div>

          {/* Structured Multi-Column Hop Graph Visualizer */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Hop 0 Column */}
            <div className="flex flex-col gap-3">
              <div className="text-xs font-mono font-medium text-blue-400/90 pb-2 border-b border-blue-900/40 flex items-center justify-between">
                <span>Hop 0 · Core</span>
                <span className="text-[10px] text-[#586177]">Root Contracts</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {AAVE_NODES.filter((n) => n.hop === 0).map((node) => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedNode.id === node.id
                        ? "bg-[#131722] border-blue-500/80 shadow-sm shadow-blue-500/10"
                        : "bg-[#0e1118] border-[#1d2230] hover:border-[#2e374c]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-white truncate">{node.label}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/60">
                        {node.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#5b647c]">
                      <span>{node.proxyType !== "none" ? node.proxyType : "immutable"}</span>
                      <span className="text-emerald-400">Score {node.riskScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hop 1 Column */}
            <div className="flex flex-col gap-3">
              <div className="text-xs font-mono font-medium text-emerald-400/90 pb-2 border-b border-emerald-900/40 flex items-center justify-between">
                <span>Hop 1 · Direct Deps</span>
                <span className="text-[10px] text-[#586177]">Implementations & Admin</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {AAVE_NODES.filter((n) => n.hop === 1).map((node) => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedNode.id === node.id
                        ? "bg-[#131722] border-emerald-500/80 shadow-sm shadow-emerald-500/10"
                        : "bg-[#0e1118] border-[#1d2230] hover:border-[#2e374c]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-white truncate">{node.label}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          node.category === "multisig"
                            ? "bg-purple-950/60 text-purple-400 border-purple-900/60"
                            : "bg-emerald-950/60 text-emerald-400 border-emerald-900/60"
                        }`}
                      >
                        {node.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#5b647c]">
                      <span>{node.adminType}</span>
                      <span className="text-emerald-400">Score {node.riskScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hop 2 Column */}
            <div className="flex flex-col gap-3">
              <div className="text-xs font-mono font-medium text-amber-400/90 pb-2 border-b border-amber-900/40 flex items-center justify-between">
                <span>Hop 2 · Transitive Deps</span>
                <span className="text-[10px] text-[#586177]">Chainlink Oracles</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {AAVE_NODES.filter((n) => n.hop === 2).map((node) => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedNode.id === node.id
                        ? "bg-[#131722] border-amber-500/80 shadow-sm shadow-amber-500/10"
                        : "bg-[#0e1118] border-[#1d2230] hover:border-[#2e374c]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-white truncate">{node.label}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-900/60">
                        oracle
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#5b647c]">
                      <span>🔗 {node.referencedProtocolId}</span>
                      <span className="text-emerald-400">Score {node.riskScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Detail Inspector Panel */}
        <div className="w-full md:w-80 border-l border-[#1b1f2b] bg-[#0c0e14] p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1b1f2b] mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#68728a]">
                Contract Inspector
              </span>
              <span className="text-xs font-mono text-emerald-400">Hop {selectedNode.hop} Node</span>
            </div>

            <div className="mb-4">
              <h2 className="text-base font-semibold text-white mb-1">{selectedNode.label}</h2>
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#7a849d] bg-[#11141c] p-2 rounded border border-[#1e2332]">
                <span className="truncate">{selectedNode.address}</span>
                <button
                  onClick={() => copyAddress(selectedNode.address)}
                  className="hover:text-white cursor-pointer ml-auto shrink-0"
                  title="Copy address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Spec Attributes */}
            <div className="space-y-2.5 text-xs mb-6">
              <div className="flex items-center justify-between py-1 border-b border-[#161a25]">
                <span className="text-[#646e86]">Arkiv Entity</span>
                <span className="font-mono text-blue-400">ContractNode</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#161a25]">
                <span className="text-[#646e86]">Category</span>
                <span className="font-mono text-white capitalize">{selectedNode.category}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#161a25]">
                <span className="text-[#646e86]">Proxy Resolution</span>
                <span className="font-mono text-white uppercase">{selectedNode.proxyType}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#161a25]">
                <span className="text-[#646e86]">Admin Governance</span>
                <span className="font-mono text-white capitalize">{selectedNode.adminType}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#161a25]">
                <span className="text-[#646e86]">Sourcify Status</span>
                <span className="font-mono text-emerald-400">{selectedNode.sourcifyStatus}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#161a25]">
                <span className="text-[#646e86]">Node Risk Score</span>
                <span className="font-mono text-emerald-400 font-bold">{selectedNode.riskScore} / 100</span>
              </div>

              {selectedNode.referencedProtocolId && (
                <div className="flex items-center justify-between py-1 border-b border-[#161a25]">
                  <span className="text-[#646e86]">Cross-Protocol Dep</span>
                  <span className="font-mono text-indigo-400 font-semibold">
                    {selectedNode.referencedProtocolId}
                  </span>
                </div>
              )}
            </div>

            {/* Multisig Signers Metadata Box (If Safe) */}
            {selectedNode.category === "multisig" && selectedNode.safeOwners && (
              <div className="p-3 rounded-lg bg-[#11131b] border border-purple-900/40 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold text-purple-400">
                    Safe Governance Metadata
                  </span>
                  <span className="text-[10px] font-mono text-[#778096]">
                    {selectedNode.safeThreshold} of {selectedNode.safeOwnerCount} Signers
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#58627a] mb-2">
                  Stored as bytes() metadata column in Arkiv:
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {selectedNode.safeOwners.map((owner, i) => (
                    <div key={owner} className="text-[10px] font-mono text-[#8a94ac] truncate">
                      {i + 1}. {owner}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#181c26] space-y-2">
            <a
              href={`https://etherscan.io/address/${selectedNode.address}`}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <ShinyButton variant="secondary" className="w-full justify-between">
                <span>View on Etherscan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </ShinyButton>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GraphViewerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-xs text-[#6e7790] font-mono">Loading provenance graph...</div>}>
      <GraphViewerContent />
    </Suspense>
  );
}

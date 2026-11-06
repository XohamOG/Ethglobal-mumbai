"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PROTOCOLS, AAVE_NODES, AAVE_EDGES, GraphNode } from "@/lib/graph-data";
import { InteractiveGraphCanvas } from "@/components/graph/InteractiveGraphCanvas";
import { ShinyButton } from "@/components/ui/ShinyButton";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Network,
  LayoutGrid,
  ShieldCheck,
  ChevronRight,
  Database,
  GitBranch,
} from "lucide-react";

function GraphViewerContent() {
  const searchParams = useSearchParams();
  const protocolId = searchParams.get("protocol") || "aave-v3-mainnet";
  const protocol = PROTOCOLS.find((p) => p.protocolId === protocolId) || PROTOCOLS[0];

  const [selectedNode, setSelectedNode] = useState<GraphNode>(AAVE_NODES[0]);
  const [viewMode, setViewMode] = useState<"canvas" | "grid">("canvas");
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
    <div className="min-h-screen flex flex-col bg-[#08090e] text-[#ededed]">
      {/* Top Navbar */}
      <header className="h-14 border-b border-[#181c28] px-6 flex items-center justify-between bg-[#0b0d14]/90 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-xs text-[#7e88a0] hover:text-white transition-colors cursor-pointer py-1 px-2 rounded hover:bg-[#151824]">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Protocols</span>
            </button>
          </Link>
          <span className="text-[#202536]">/</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-white tracking-tight">{protocol.name}</span>
            <span className="text-xs font-mono text-[#586178]">· 2-Hop Dependency Graph</span>
          </div>
        </div>

        {/* View Mode Switcher & Global Risk Metric */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#10131c] border border-[#1e2332] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode("canvas")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === "canvas" ? "bg-[#1b2130] text-white" : "text-[#67718a] hover:text-white"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Canvas</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-[#1b2130] text-white" : "text-[#67718a] hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Layers</span>
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-emerald-900/50 bg-emerald-950/30 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[#8e98af]">Composite Score:</span>
            <span className="text-emerald-400 font-bold">{protocol.compositeScore}</span>
            <span className="text-[10px] text-emerald-400 font-semibold uppercase">
              ({protocol.riskTier})
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Hop Navigator */}
        <div className="w-full md:w-60 border-r border-[#161a26] bg-[#0a0c12] p-4 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#555e75] mb-2.5">
              Hop Layers
            </div>
            <div className="flex flex-col gap-1 mb-6">
              {[
                { id: "all", label: "All Hops (Full Graph)" },
                { id: 0, label: "Hop 0 · Core Roots" },
                { id: 1, label: "Hop 1 · Direct Deps" },
                { id: 2, label: "Hop 2 · Oracles" },
              ].map((item) => (
                <button
                  key={String(item.id)}
                  onClick={() => setActiveHopFilter(item.id as number | "all")}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                    activeHopFilter === item.id
                      ? "bg-[#151924] text-white border border-[#262e42]"
                      : "text-[#6d768e] hover:text-white hover:bg-[#0f121b]"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] font-mono text-[#4b546b]">
                    {item.id === "all"
                      ? AAVE_NODES.length
                      : AAVE_NODES.filter((n) => n.hop === item.id).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="text-[11px] font-mono uppercase tracking-wider text-[#555e75] mb-2.5">
              Indexed Nodes ({filteredNodes.length})
            </div>
            <div className="flex flex-col gap-1 max-h-[360px] overflow-y-auto pr-1">
              {filteredNodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`w-full text-left px-2.5 py-2 rounded-md text-xs transition-colors cursor-pointer flex flex-col gap-0.5 ${
                    selectedNode.id === node.id
                      ? "bg-[#141824] text-white border border-[#2b354d]"
                      : "text-[#7a839a] hover:text-white hover:bg-[#0e1017]"
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
                  <span className="text-[10px] font-mono text-[#4a5266] truncate">
                    {node.address.slice(0, 8)}...{node.address.slice(-6)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#161a25] text-[10px] text-[#4d556c] font-mono flex items-center justify-between">
            <span>Arkiv BTL Active</span>
            <span>Block #{protocol.lastEvaluatedBlock}</span>
          </div>
        </div>

        {/* Center: Main Visualization Area */}
        <div className="flex-1 bg-[#08090e] p-6 overflow-auto flex flex-col">
          {viewMode === "canvas" ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between text-xs text-[#6e7790] pb-3 mb-3">
                <span className="text-xs font-mono text-[#5b647c]">
                  Multi-hop dependency network representation
                </span>
                <span className="text-[11px] font-mono text-[#474f63]">
                  Interactive Bezier Connections · Click nodes to inspect
                </span>
              </div>
              <InteractiveGraphCanvas
                nodes={filteredNodes}
                edges={AAVE_EDGES}
                selectedNodeId={selectedNode.id}
                onSelectNode={(node) => setSelectedNode(node)}
              />
            </div>
          ) : (
            /* Layer Grid View */
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Hop 0 */}
              <div className="flex flex-col gap-3">
                <div className="text-xs font-mono font-medium text-blue-400 pb-2 border-b border-blue-900/30 flex items-center justify-between">
                  <span>Hop 0 · Core Protocol</span>
                  <span className="text-[10px] text-[#555d73]">Root Proxies</span>
                </div>
                <div className="flex flex-col gap-2">
                  {AAVE_NODES.filter((n) => n.hop === 0).map((node) => (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedNode.id === node.id
                          ? "bg-[#131724] border-blue-500/80 shadow-sm"
                          : "bg-[#0c0e16] border-[#1a1f2e] hover:border-[#2a3248]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-white truncate">{node.label}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/60">
                          {node.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#555d73]">
                        <span>{node.proxyType}</span>
                        <span className="text-emerald-400">Score {node.riskScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hop 1 */}
              <div className="flex flex-col gap-3">
                <div className="text-xs font-mono font-medium text-emerald-400 pb-2 border-b border-emerald-900/30 flex items-center justify-between">
                  <span>Hop 1 · Direct Deps</span>
                  <span className="text-[10px] text-[#555d73]">Impls & Governance</span>
                </div>
                <div className="flex flex-col gap-2">
                  {AAVE_NODES.filter((n) => n.hop === 1).map((node) => (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedNode.id === node.id
                          ? "bg-[#131724] border-emerald-500/80 shadow-sm"
                          : "bg-[#0c0e16] border-[#1a1f2e] hover:border-[#2a3248]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-white truncate">{node.label}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-900/60">
                          {node.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#555d73]">
                        <span>{node.adminType}</span>
                        <span className="text-emerald-400">Score {node.riskScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hop 2 */}
              <div className="flex flex-col gap-3">
                <div className="text-xs font-mono font-medium text-amber-400 pb-2 border-b border-amber-900/30 flex items-center justify-between">
                  <span>Hop 2 · Transitive</span>
                  <span className="text-[10px] text-[#555d73]">Oracle Feeds</span>
                </div>
                <div className="flex flex-col gap-2">
                  {AAVE_NODES.filter((n) => n.hop === 2).map((node) => (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedNode.id === node.id
                          ? "bg-[#131724] border-amber-500/80 shadow-sm"
                          : "bg-[#0c0e16] border-[#1a1f2e] hover:border-[#2a3248]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-white truncate">{node.label}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-900/60">
                          oracle
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#555d73]">
                        <span>🔗 {node.referencedProtocolId}</span>
                        <span className="text-emerald-400">Score {node.riskScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Detail Inspector Panel */}
        <div className="w-full md:w-80 border-l border-[#161a26] bg-[#0a0c12] p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#181c28] mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#636c84]">
                Node Inspector
              </span>
              <span className="text-xs font-mono text-emerald-400">Hop {selectedNode.hop}</span>
            </div>

            <div className="mb-4">
              <h2 className="text-base font-semibold text-white mb-1 tracking-tight">
                {selectedNode.label}
              </h2>
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#78829a] bg-[#0f1118] p-2 rounded-lg border border-[#1c2130]">
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
            <div className="space-y-2 text-xs mb-6">
              <div className="flex items-center justify-between py-1 border-b border-[#141722]">
                <span className="text-[#5f6880]">Arkiv Entity</span>
                <span className="font-mono text-blue-400 font-semibold">ContractNode</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#141722]">
                <span className="text-[#5f6880]">Contract Category</span>
                <span className="font-mono text-white capitalize">{selectedNode.category}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#141722]">
                <span className="text-[#5f6880]">Proxy Resolution</span>
                <span className="font-mono text-white uppercase">{selectedNode.proxyType}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#141722]">
                <span className="text-[#5f6880]">Admin Type</span>
                <span className="font-mono text-white capitalize">{selectedNode.adminType}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#141722]">
                <span className="text-[#5f6880]">Sourcify Mirror</span>
                <span className="font-mono text-emerald-400 font-medium">
                  {selectedNode.sourcifyStatus}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#141722]">
                <span className="text-[#5f6880]">Risk Score</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {selectedNode.riskScore} / 100
                </span>
              </div>

              {selectedNode.referencedProtocolId && (
                <div className="flex items-center justify-between py-1 border-b border-[#141722]">
                  <span className="text-[#5f6880]">Cross-Protocol Link</span>
                  <span className="font-mono text-indigo-400 font-semibold">
                    {selectedNode.referencedProtocolId}
                  </span>
                </div>
              )}
            </div>

            {/* Multisig Signers Metadata Box */}
            {selectedNode.category === "multisig" && selectedNode.safeOwners && (
              <div className="p-3 rounded-lg bg-[#0e1017] border border-purple-900/30 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold text-purple-400">
                    Safe Multisig Governance
                  </span>
                  <span className="text-[10px] font-mono text-[#767e94]">
                    {selectedNode.safeThreshold} of {selectedNode.safeOwnerCount} Required
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#4f566c] mb-2">
                  Signers stored as bytes() metadata column in Arkiv:
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {selectedNode.safeOwners.map((owner, i) => (
                    <div key={owner} className="text-[10px] font-mono text-[#828c9f] truncate">
                      {i + 1}. {owner}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#161a25]">
            <a
              href={`https://etherscan.io/address/${selectedNode.address}`}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <ShinyButton variant="secondary" className="w-full justify-between">
                <span>View on Etherscan</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#6c768e]" />
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
    <Suspense fallback={<div className="min-h-screen bg-[#08090e] flex items-center justify-center text-xs text-[#6e7790] font-mono">Loading provenance graph...</div>}>
      <GraphViewerContent />
    </Suspense>
  );
}

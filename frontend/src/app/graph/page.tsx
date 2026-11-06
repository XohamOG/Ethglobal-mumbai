"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PROTOCOLS, AAVE_NODES, AAVE_EDGES, GraphNode, getRiskScoreConfig } from "@/lib/graph-data";
import { ProvenanceGraphCanvas } from "@/components/graph/ProvenanceGraphCanvas";
import { EntityPropertySheet } from "@/components/graph/EntityPropertySheet";
import { CreTriggerModal } from "@/components/cre/CreTriggerModal";
import { DecryptedText } from "@/components/ui/DecryptedText";
import {
  ArrowLeft,
  ShieldCheck,
  Zap,
  Sliders,
} from "lucide-react";

function GraphViewerContent() {
  const searchParams = useSearchParams();
  const protocolId = searchParams.get("protocol") || "aave-v3-mainnet";

  const protocol = PROTOCOLS.find((p) => p.protocolId === protocolId) || PROTOCOLS[0];

  const [selectedNode, setSelectedNode] = useState<GraphNode>(AAVE_NODES[0]);
  const [activeHopFilter, setActiveHopFilter] = useState<number | "all">("all");
  const [isCreModalOpen, setIsCreModalOpen] = useState(false);

  // Dynamic shared state across Graph canvas and CRE modal
  const [nodes, setNodes] = useState<GraphNode[]>(AAVE_NODES);
  const [compositeScore, setCompositeScore] = useState<number>(protocol.compositeScore || 13.7);
  const [isRebuilding, setIsRebuilding] = useState<boolean>(false);
  const [mutatedNodeInfo, setMutatedNodeInfo] = useState<{
    id: string;
    label: string;
    oldAddress: string;
    newAddress: string;
    reason?: string;
  } | null>(null);

  const liveRisk = getRiskScoreConfig(compositeScore);

  const handleResetBaseline = async () => {
    try {
      await fetch("http://localhost:3002/api/cre/reset", { method: "POST" }).catch(() => null);
    } catch {}
    setNodes(AAVE_NODES);
    setCompositeScore(13.7);
    setMutatedNodeInfo(null);
    setIsRebuilding(false);
    setSelectedNode(AAVE_NODES[0]);
  };

  const filteredNodes =
    activeHopFilter === "all"
      ? nodes
      : nodes.filter((n) => n.hop === activeHopFilter);

  return (
    <div className="h-screen flex flex-col bg-[#101010] text-[#f3f3f3] overflow-hidden">
      {/* Top Header Bar — Hyperstudio Specification */}
      <header className="h-16 border-b border-[#212121] px-6 sm:px-10 flex items-center justify-between bg-[#101010] shrink-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-[13px] text-[#9c9c9c] hover:text-[#f3f3f3] transition-colors cursor-pointer py-1.5 px-3 rounded-[8px] border border-[#212121] hover:border-[#474747] bg-[#080808] uppercase tracking-wider">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
          </Link>
          <span className="text-[#212121]">/</span>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-normal text-[#f3f3f3] tracking-tight">
              <DecryptedText text={protocol.name} speed={30} maxIterations={8} animateOn="view" />
            </span>
            <span className="text-[12px] text-[#9c9c9c] uppercase tracking-wider font-mono">
              · Topology Graph
            </span>
          </div>
        </div>

        {/* Hyperstudio Header Actions */}
        <div className="flex items-center gap-3">
          {/* Ghost Outline Button — Demo Sandbox */}
          <Link
            href="/demo"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-transparent hover:bg-[#1a1a1a] text-[#9c9c9c] hover:text-[#f3f3f3] border border-[#212121] hover:border-[#474747] text-[12px] uppercase tracking-wider transition-colors"
            title="Open Interactive Demo Chaos Sandbox"
          >
            <Sliders className="w-3.5 h-3.5 text-[#6f6759]" />
            <span className="hidden md:inline">Simulation Sandbox</span>
          </Link>

          {/* Status Badge Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#1a1a1a] border border-[#212121] text-[12px] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#98ff38]" />
            <span className="text-[#9c9c9c]">Risk:</span>
            <span className="text-[#98ff38] font-mono">{compositeScore}</span>
            <span className="text-[#9c9c9c]">({liveRisk.tier})</span>
          </div>

          {/* White Pill Button — Primary CTA */}
          <button
            onClick={() => setIsCreModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#ffffff] hover:bg-[#f3f3f3] text-[#101010] text-[12px] uppercase font-normal tracking-wider transition-colors cursor-pointer"
            title="Trigger Chainlink CRE Consensus Verification"
          >
            <Zap className="w-3.5 h-3.5 text-[#101010]" />
            <span>Audit CRE</span>
          </button>
        </div>
      </header>

      {/* Main Graph View - 100% Dedicated */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left Filter & Layer Sidebar — Carbon Depth (#080808) */}
        <div className="w-full md:w-60 border-r border-[#212121] bg-[#080808] p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-[#9c9c9c] mb-3">
                Provenance Hops
              </div>
              <div className="flex flex-col gap-1">
                {[
                  { id: "all", label: "All Contracts (15)" },
                  { id: 0, label: "Hop 0 · Core Mesh (6)" },
                  { id: 1, label: "Hop 1 · Governance (4)" },
                  { id: 2, label: "Hop 2 · Oracles (5)" },
                ].map((item) => (
                  <button
                    key={String(item.id)}
                    onClick={() => setActiveHopFilter(item.id as number | "all")}
                    className={`w-full text-left px-3 py-2 rounded-[4px] text-[13px] transition-colors cursor-pointer flex items-center justify-between ${
                      activeHopFilter === item.id
                        ? "bg-[#1a1a1a] text-[#f3f3f3] border border-[#212121]"
                        : "text-[#9c9c9c] hover:text-[#f3f3f3] hover:bg-[#101010] border border-transparent"
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Node List */}
            <div>
              <div className="text-[11px] uppercase tracking-widest text-[#9c9c9c] mb-3">
                Active Contracts
              </div>
              <div className="space-y-1 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
                {filteredNodes.map((n) => {
                  const nodeRisk = getRiskScoreConfig(n.riskScore);
                  const isSelected = selectedNode.id === n.id;
                  return (
                    <button
                      key={n.id}
                      onClick={() => setSelectedNode(n)}
                      className={`w-full text-left px-3 py-2 rounded-[4px] text-[12px] transition-colors cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? "bg-[#1a1a1a] text-[#f3f3f3] border border-[#474747]"
                          : "bg-transparent border border-transparent hover:border-[#212121] hover:bg-[#101010] text-[#9c9c9c] hover:text-[#f3f3f3]"
                      }`}
                    >
                      <span className="truncate max-w-[140px] font-normal">{n.label}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-[#101010] text-[#9c9c9c] border border-[#212121]">
                        {n.riskScore}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#212121] text-[11px] text-[#9c9c9c] font-mono space-y-1.5 mt-4">
            <div className="flex justify-between">
              <span>Arkiv BTL:</span>
              <span className="text-[#f3f3f3]">50,000 blocks</span>
            </div>
            <div className="flex justify-between">
              <span>Evaluated:</span>
              <span className="text-[#f3f3f3]">#{protocol.lastEvaluatedBlock}</span>
            </div>
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 bg-[#101010] p-4 overflow-hidden flex flex-col min-h-0">
          <ProvenanceGraphCanvas
            nodes={filteredNodes}
            edges={AAVE_EDGES}
            selectedNodeId={selectedNode.id}
            onSelectNode={(node) => setSelectedNode(node)}
            isRebuilding={isRebuilding}
            mutatedNodeId={mutatedNodeInfo?.id}
            onResetBaseline={handleResetBaseline}
          />
        </div>

        {/* Right Property Sheet (Entity Inspector) — Carbon Depth (#080808) */}
        <div className="w-full md:w-88 border-l border-[#212121] bg-[#080808] p-6 overflow-y-auto shrink-0">
          <EntityPropertySheet node={selectedNode} />
        </div>
      </div>

      {/* CRE Trigger Modal */}
      <CreTriggerModal
        isOpen={isCreModalOpen}
        onClose={() => setIsCreModalOpen(false)}
        onComplete={(newScore) => setCompositeScore(newScore)}
      />
    </div>
  );
}

export default function GraphViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0e0e12] flex items-center justify-center text-xs text-[#aaaab8] font-mono">
          Loading DeFi Provenance Graph...
        </div>
      }
    >
      <GraphViewerContent />
    </Suspense>
  );
}

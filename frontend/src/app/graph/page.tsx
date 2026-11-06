"use client";

import React, { Suspense, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PROTOCOLS, AAVE_NODES, AAVE_EDGES, GraphNode, getRiskScoreConfig } from "@/lib/graph-data";
import { ProvenanceGraphCanvas } from "@/components/graph/ProvenanceGraphCanvas";
import { EntityPropertySheet } from "@/components/graph/EntityPropertySheet";
import { CreTriggerModal } from "@/components/cre/CreTriggerModal";
import {
  ArrowLeft,
  Zap,
  Sliders,
  PanelRightClose,
  PanelRightOpen,
  ArrowRight,
} from "lucide-react";

export type GraphStage = "registry" | "hop0" | "hop1" | "hop2" | "all";

function GraphViewerContent() {
  const searchParams = useSearchParams();
  const protocolId = searchParams.get("protocol") || "aave-v3-mainnet";
  const protocol = PROTOCOLS.find((p) => p.protocolId === protocolId) || PROTOCOLS[0];

  const [activeStage, setActiveStage] = useState<GraphStage>("registry");
  const [selectedNode, setSelectedNode] = useState<GraphNode>(AAVE_NODES[1]); // Default to PoolAddressesProvider (Registry)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isCreModalOpen, setIsCreModalOpen] = useState(false);

  // Dynamic shared state
  const [nodes, setNodes] = useState<GraphNode[]>(AAVE_NODES);
  const [compositeScore, setCompositeScore] = useState<number>(protocol.compositeScore || 13.7);
  const [isRebuilding, setIsRebuilding] = useState<boolean>(false);
  const [mutatedNodeInfo, setMutatedNodeInfo] = useState<{
    id: string;
    label: string;
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
    setSelectedNode(AAVE_NODES[1]);
  };

  // Filter nodes based on active stage progression
  const stageFilteredNodes = useMemo(() => {
    switch (activeStage) {
      case "registry":
        return nodes.filter((n) => n.id === "aave-v3-addresses-provider");
      case "hop0":
        return nodes.filter((n) => n.hop === 0);
      case "hop1":
        return nodes.filter((n) => n.hop === 0 || n.hop === 1);
      case "hop2":
        return nodes.filter((n) => n.hop === 0 || n.hop === 1 || n.hop === 2);
      case "all":
      default:
        return nodes;
    }
  }, [nodes, activeStage]);

  // Filter edges based on visible nodes
  const stageFilteredEdges = useMemo(() => {
    const visibleIds = new Set(stageFilteredNodes.map((n) => n.id));
    return AAVE_EDGES.filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to));
  }, [stageFilteredNodes]);

  const handleAdvanceStage = (next: GraphStage) => {
    setActiveStage(next);
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    // Auto advance on progressive presentation clicks
    if (activeStage === "registry") {
      setActiveStage("hop0");
    } else if (activeStage === "hop0") {
      setActiveStage("hop1");
    } else if (activeStage === "hop1") {
      setActiveStage("hop2");
    }
  };

  const stageLabel = useMemo(() => {
    switch (activeStage) {
      case "registry":
        return "1/4 · Protocol Registry";
      case "hop0":
        return "2/4 · Hop 0 (Core Mesh)";
      case "hop1":
        return "3/4 · Hop 1 (Governance & Impl)";
      case "hop2":
        return "4/4 · Hop 2 (Oracles)";
      case "all":
        return "All Hops (15 Nodes)";
    }
  }, [activeStage]);

  return (
    <div className="h-screen flex flex-col bg-[#101010] text-[#f3f3f3] overflow-hidden select-none">
      {/* Top Header Bar — Hyperstudio Minimalist Specification */}
      <header className="h-14 border-b border-[#212121] px-5 flex items-center justify-between bg-[#101010] shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-[12px] text-[#9c9c9c] hover:text-[#f3f3f3] transition-colors cursor-pointer py-1.5 px-3 rounded-[8px] border border-[#212121] hover:border-[#474747] bg-[#080808] uppercase tracking-wider">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Macaroon</span>
            </button>
          </Link>
          <span className="text-[#212121]">/</span>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-normal text-[#f3f3f3] tracking-tight">
              Aave V3 Lineage
            </span>
            <span className="text-[11px] text-[#6f6759] uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-[#151515] border border-[#212121]">
              {stageLabel}
            </span>
          </div>
        </div>

        {/* Presentation Controls: Single 'View All Hops' button + Collapsible Inspector */}
        <div className="flex items-center gap-2.5">
          {/* View All Hops / Reset Button */}
          {activeStage !== "all" ? (
            <button
              onClick={() => setActiveStage("all")}
              className="px-4 py-1.5 rounded-full bg-[#ffffff] hover:bg-[#f3f3f3] text-[#101010] text-[12px] uppercase font-normal tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>View All Hops</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setActiveStage("registry")}
              className="px-3.5 py-1.5 rounded-[8px] bg-[#080808] hover:bg-[#1a1a1a] text-[#f3f3f3] border border-[#474747] text-[12px] uppercase font-normal tracking-wider transition-colors cursor-pointer"
            >
              Restart Flow
            </button>
          )}

          {/* Collapsible Inspector Toggle Button */}
          <button
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] uppercase tracking-wider transition-colors cursor-pointer border ${
              isInspectorOpen
                ? "bg-[#1a1a1a] border-[#474747] text-[#f3f3f3]"
                : "bg-[#080808] border-[#212121] text-[#9c9c9c] hover:text-[#f3f3f3] hover:border-[#474747]"
            }`}
            title="Toggle Entity Property Inspector Sheet"
          >
            {isInspectorOpen ? (
              <PanelRightClose className="w-3.5 h-3.5 text-[#6f6759]" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5 text-[#6f6759]" />
            )}
            <span>
              {isInspectorOpen ? "Hide Inspector" : "Inspect"}
            </span>
          </button>

          {/* Audit Action Button */}
          <button
            onClick={() => setIsCreModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#212121] hover:border-[#474747] bg-[#080808] text-[#f3f3f3] text-[12px] uppercase font-normal tracking-wider transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#6f6759]" />
            <span>Audit</span>
          </button>
        </div>
      </header>

      {/* Main Full-Bleed Graph Presentation Canvas */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Center Canvas */}
        <div className="flex-1 bg-[#101010] overflow-hidden flex flex-col min-h-0 relative">
          <ProvenanceGraphCanvas
            nodes={stageFilteredNodes}
            edges={stageFilteredEdges}
            selectedNodeId={selectedNode.id}
            onSelectNode={handleNodeClick}
            isRebuilding={isRebuilding}
            mutatedNodeId={mutatedNodeInfo?.id}
            onResetBaseline={handleResetBaseline}
            stage={activeStage}
            onAdvanceStage={handleAdvanceStage}
          />
        </div>

        {/* Collapsible Right Property Sheet (Entity Inspector) */}
        {isInspectorOpen && (
          <div className="w-full md:w-96 border-l border-[#212121] bg-[#080808] p-5 overflow-y-auto shrink-0 z-20 animate-fadeIn transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-[#212121] mb-4">
              <span className="text-[11px] uppercase tracking-wider text-[#9c9c9c]">
                Entity Inspector
              </span>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="text-[#9c9c9c] hover:text-[#f3f3f3] p-1 rounded hover:bg-[#1a1a1a] cursor-pointer"
                title="Collapse Inspector"
              >
                ✕
              </button>
            </div>
            <EntityPropertySheet node={selectedNode} />
          </div>
        )}
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
        <div className="min-h-screen bg-[#101010] flex items-center justify-center text-xs text-[#9c9c9c] font-mono">
          Loading Lineage Graph...
        </div>
      }
    >
      <GraphViewerContent />
    </Suspense>
  );
}

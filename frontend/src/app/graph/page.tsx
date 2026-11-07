"use client";

import React, { Suspense, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PROTOCOLS,
  AAVE_NODES,
  AAVE_EDGES,
  GraphNode,
  getRiskScoreConfig,
} from "@/lib/graph-data";
import { ProvenanceGraphCanvas } from "@/components/graph/ProvenanceGraphCanvas";
import { EntityPropertySheet } from "@/components/graph/EntityPropertySheet";
import { CreTriggerModal } from "@/components/cre/CreTriggerModal";
import { DemoModePanel } from "@/components/graph/DemoModePanel";
import {
  ArrowLeft,
  Zap,
  PanelRightClose,
  PanelRightOpen,
  Info,
  Compass,
  FileText,
} from "lucide-react";

// Hop-decay composite: hop0Avg * 1.0 + hop1Avg * 0.5 + hop2Avg * 0.25
function hopDecayComposite(list: GraphNode[]): number {
  const avg = (hop: number) => {
    const g = list.filter((n) => n.hop === hop);
    return g.length ? g.reduce((a, n) => a + n.riskScore, 0) / g.length : 0;
  };
  return avg(0) * 1.0 + avg(1) * 0.5 + avg(2) * 0.25;
}

function GraphViewerContent() {
  const searchParams = useSearchParams();
  const protocolId = searchParams.get("protocol") || "aave-v3-mainnet";
  const protocol = PROTOCOLS.find((p) => p.protocolId === protocolId) || PROTOCOLS[0];

  // Hop filter: "all" | 0 | 1 | 2
  const [activeHop, setActiveHop] = useState<number | "all">("all");

  // Selected node (default null => ALL nodes active and highlighted)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Collapsible inspector sidebar
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isCreModalOpen, setIsCreModalOpen] = useState(false);

  // Dynamic shared state
  const [nodes, setNodes] = useState<GraphNode[]>(AAVE_NODES);
  const [compositeScore, setCompositeScore] = useState<number>(
    protocol.compositeScore || 13.7
  );
  const [isRebuilding, setIsRebuilding] = useState<boolean>(false);
  const [mutatedNodeInfo, setMutatedNodeInfo] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const liveRisk = getRiskScoreConfig(compositeScore);

  // Demo mode: in-memory what-if overrides only (never persisted, lost on reload)
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [demoOverrides, setDemoOverrides] = useState<Record<string, number>>({});

  const displayNodes = useMemo(
    () =>
      Object.keys(demoOverrides).length === 0
        ? nodes
        : nodes.map((n) =>
            n.id in demoOverrides ? { ...n, riskScore: demoOverrides[n.id] } : n
          ),
    [nodes, demoOverrides]
  );

  const baselineFormula = useMemo(
    () => hopDecayComposite(nodes),
    [nodes]
  );
  const liveFormula = useMemo(
    () => hopDecayComposite(displayNodes),
    [displayNodes]
  );
  // Apply only the change caused by the sliders on top of the real baseline score
  const demoComposite = Number(
    Math.min(100, Math.max(0, compositeScore + (liveFormula - baselineFormula))).toFixed(1)
  );

  const selectedDisplayNode = selectedNode
    ? displayNodes.find((n) => n.id === selectedNode.id) || null
    : null;

  const handleResetBaseline = async () => {
    try {
      await fetch("http://localhost:3002/api/cre/reset", { method: "POST" }).catch(
        () => null
      );
    } catch {}
    setNodes(AAVE_NODES);
    setCompositeScore(13.7);
    setMutatedNodeInfo(null);
    setIsRebuilding(false);
    setSelectedNode(null);
  };

  // Node selection handler: selects node and automatically reveals property sheet
  const handleSelectNode = (node: GraphNode | null) => {
    setSelectedNode(node);
    if (node && !isDemoOpen) {
      setIsInspectorOpen(true);
    }
  };

  // Hop counts for clean badges
  const hopCounts = useMemo(() => {
    const counts = { 0: 0, 1: 0, 2: 0, all: nodes.length };
    nodes.forEach((n) => {
      if (n.hop === 0 || n.hop === 1 || n.hop === 2) {
        counts[n.hop]++;
      }
    });
    return counts;
  }, [nodes]);

  return (
    <div className="h-screen flex flex-col bg-[#101010] text-[#f3f3f3] overflow-hidden select-none">
      {/* Top Header Bar — Hyperstudio Specification */}
      <header className="h-14 border-b border-[#212121] px-4 sm:px-6 flex items-center justify-between bg-[#101010] shrink-0 z-30">
        {/* Left: Brand Link & Title */}
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
            <span className="text-[11px] text-[#9c9c9c] uppercase tracking-wider font-mono hidden md:inline">
              · Ethereum Mainnet
            </span>
          </div>
        </div>

        {/* Center: Hop Filter Tabs */}
        <div className="flex items-center bg-[#080808] border border-[#212121] p-0.5 rounded-[6px] text-[12px]">
          <button
            onClick={() => {
              setActiveHop("all");
              setSelectedNode(null);
            }}
            className={`px-3 py-1 rounded-[4px] uppercase tracking-wider transition-colors cursor-pointer ${
              activeHop === "all"
                ? "bg-[#1a1a1a] text-[#f3f3f3] border border-[#474747]"
                : "text-[#9c9c9c] hover:text-[#f3f3f3]"
            }`}
          >
            All Hops ({hopCounts.all})
          </button>

          <button
            onClick={() => {
              setActiveHop(0);
              setSelectedNode(null);
            }}
            className={`px-3 py-1 rounded-[4px] uppercase tracking-wider transition-colors cursor-pointer ${
              activeHop === 0
                ? "bg-[#1a1a1a] text-[#f3f3f3] border border-[#474747]"
                : "text-[#9c9c9c] hover:text-[#f3f3f3]"
            }`}
          >
            Hop 0 · Core ({hopCounts[0]})
          </button>

          <button
            onClick={() => {
              setActiveHop(1);
              setSelectedNode(null);
            }}
            className={`px-3 py-1 rounded-[4px] uppercase tracking-wider transition-colors cursor-pointer ${
              activeHop === 1
                ? "bg-[#1a1a1a] text-[#f3f3f3] border border-[#474747]"
                : "text-[#9c9c9c] hover:text-[#f3f3f3]"
            }`}
          >
            Hop 1 · Logic & Gov ({hopCounts[1]})
          </button>

          <button
            onClick={() => {
              setActiveHop(2);
              setSelectedNode(null);
            }}
            className={`px-3 py-1 rounded-[4px] uppercase tracking-wider transition-colors cursor-pointer ${
              activeHop === 2
                ? "bg-[#1a1a1a] text-[#f3f3f3] border border-[#474747]"
                : "text-[#9c9c9c] hover:text-[#f3f3f3]"
            }`}
          >
            Hop 2 · Oracles ({hopCounts[2]})
          </button>
        </div>

        {/* Right: Collapsible Inspector Toggle & Audit Button */}
        <div className="flex items-center gap-2">
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
            <span className="hidden sm:inline">
              {isInspectorOpen ? "Hide Inspector" : "Inspect"}
            </span>
            {selectedNode && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#98ff38]" />
            )}
          </button>

          {/* Audit Action Button */}
          <button
            onClick={() => setIsCreModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#212121] hover:border-[#474747] bg-[#080808] text-[#f3f3f3] text-[12px] uppercase font-normal tracking-wider transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#6f6759]" />
            <span className="hidden sm:inline">Audit</span>
          </button>

          {/* Scoring & RPC Traces Link */}
          <Link
            href={`/audit?protocol=${protocolId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#212121] hover:border-[#474747] bg-[#080808] text-[#f3f3f3] text-[12px] uppercase font-normal tracking-wider transition-colors cursor-pointer"
            title="Inspect Composite Risk Calculation & Raw RPC Traces"
          >
            <FileText className="w-3.5 h-3.5 text-[#6f6759]" />
            <span className="hidden sm:inline">Scoring & Traces</span>
          </Link>
        </div>
      </header>

      {/* Main Full-Bleed Graph Presentation Canvas */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Center Canvas */}
        <div className="flex-1 bg-[#101010] overflow-hidden flex flex-col min-h-0 relative">
          <ProvenanceGraphCanvas
            nodes={displayNodes}
            edges={AAVE_EDGES}
            selectedNodeId={selectedNode?.id || null}
            onSelectNode={handleSelectNode}
            isRebuilding={isRebuilding}
            mutatedNodeId={mutatedNodeInfo?.id}
            onResetBaseline={handleResetBaseline}
            activeHop={activeHop}
          />
        </div>

        {/* Collapsible Right Property Sheet (Entity Inspector) */}
        {isInspectorOpen && (
          <div className="w-full md:w-96 border-l border-[#212121] bg-[#080808] p-5 overflow-y-auto shrink-0 z-20 animate-fadeIn transition-all">
            {selectedNode ? (
              <EntityPropertySheet
                node={selectedNode}
                onClose={() => setIsInspectorOpen(false)}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-10 h-10 rounded-full border border-[#212121] bg-[#101010] flex items-center justify-center mb-3">
                  <Compass className="w-5 h-5 text-[#6f6759]" />
                </div>
                <h4 className="text-[14px] text-[#f3f3f3] font-normal mb-1">
                  Select a Node to Inspect
                </h4>
                <p className="text-[12px] text-[#9c9c9c] leading-relaxed max-w-xs">
                  Click any contract node in the graph to view on-chain bytecode provenance, EIP-1967 storage slots, Arkiv entity keys, and CRE consensus attestations.
                </p>
                <button
                  onClick={() => setIsInspectorOpen(false)}
                  className="mt-4 px-3 py-1 rounded-[6px] border border-[#212121] text-[11px] uppercase tracking-wider text-[#9c9c9c] hover:text-[#f3f3f3] hover:border-[#474747] cursor-pointer"
                >
                  Close Panel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Demo Mode (floating, graph page only) */}
      <DemoModePanel
        isOpen={isDemoOpen}
        onToggle={() => {
          if (isDemoOpen) setDemoOverrides({});
          setIsDemoOpen(!isDemoOpen);
          setIsInspectorOpen(false);
        }}
        selectedNode={selectedDisplayNode}
        baselineNodeScore={
          selectedNode ? nodes.find((n) => n.id === selectedNode.id)?.riskScore ?? null : null
        }
        baselineComposite={compositeScore}
        liveComposite={demoComposite}
        overrideCount={Object.keys(demoOverrides).length}
        onChangeScore={(id, score) =>
          setDemoOverrides((prev) => ({ ...prev, [id]: score }))
        }
        onResetNode={(id) =>
          setDemoOverrides((prev) => {
            const { [id]: _removed, ...rest } = prev;
            return rest;
          })
        }
        onResetAll={() => setDemoOverrides({})}
      />

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

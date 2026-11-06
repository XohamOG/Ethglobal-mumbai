"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PROTOCOLS, AAVE_NODES, AAVE_EDGES, GraphNode } from "@/lib/graph-data";
import { ProvenanceGraphCanvas } from "@/components/graph/ProvenanceGraphCanvas";
import { EntityPropertySheet } from "@/components/graph/EntityPropertySheet";
import { ArkivSchemaTab } from "@/components/tabs/ArkivSchemaTab";
import { SwarmArtifactsTab } from "@/components/tabs/SwarmArtifactsTab";
import { ChainlinkCreTab } from "@/components/tabs/ChainlinkCreTab";
import { Magnet } from "@/components/ui/Magnet";
import { DecryptedText } from "@/components/ui/DecryptedText";
import {
  ArrowLeft,
  ShieldCheck,
  Database,
  Radio,
  Share2,
  HardDrive,
  Zap,
} from "lucide-react";

type ActiveTab = "graph" | "arkiv" | "swarm" | "cre";

function GraphViewerContent() {
  const searchParams = useSearchParams();
  const protocolId = searchParams.get("protocol") || "aave-v3-mainnet";
  const initialTab = (searchParams.get("tab") as ActiveTab) || "graph";

  const protocol = PROTOCOLS.find((p) => p.protocolId === protocolId) || PROTOCOLS[0];

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [selectedNode, setSelectedNode] = useState<GraphNode>(AAVE_NODES[0]);
  const [activeHopFilter, setActiveHopFilter] = useState<number | "all">("all");

  // Dynamic shared state across Graph canvas and CRE tabs
  const [nodes, setNodes] = useState<GraphNode[]>(AAVE_NODES);
  const [compositeScore, setCompositeScore] = useState<number>(protocol.compositeScore || 14.75);
  const [riskTier, setRiskTier] = useState<string>(protocol.riskTier || "LOW");
  const [fingerprint, setFingerprint] = useState<string>(
    protocol.fingerprint || "0x39a7cd678a45f1e63df9441182b58d3e87149bc0d23f82fa05f4fb0b4993e06c"
  );
  const [isRebuilding, setIsRebuilding] = useState<boolean>(false);
  const [mutatedNodeInfo, setMutatedNodeInfo] = useState<{
    id: string;
    label: string;
    oldAddress: string;
    newAddress: string;
    reason?: string;
  } | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab") as ActiveTab;
    if (tab && ["graph", "arkiv", "swarm", "cre"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleResetBaseline = async () => {
    try {
      await fetch("http://localhost:3002/api/cre/reset", { method: "POST" }).catch(() => null);
    } catch {}
    setNodes(AAVE_NODES);
    setCompositeScore(14.75);
    setRiskTier("LOW");
    setFingerprint("0x39a7cd678a45f1e63df9441182b58d3e87149bc0d23f82fa05f4fb0b4993e06c");
    setMutatedNodeInfo(null);
    setIsRebuilding(false);
    setSelectedNode(AAVE_NODES[0]);
  };

  const filteredNodes =
    activeHopFilter === "all"
      ? nodes
      : nodes.filter((n) => n.hop === activeHopFilter);

  return (
    <div className="min-h-screen flex flex-col bg-[#07080d] text-[#e2e8f0]">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-[#141824] px-6 flex items-center justify-between bg-[#090b12]/95 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Magnet magnetStrength={0.25}>
              <button className="flex items-center gap-1.5 text-xs text-[#7e8aa6] hover:text-white transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-[#121622]">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Protocols</span>
              </button>
            </Magnet>
          </Link>
          <span className="text-[#1c2233]">/</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-white tracking-tight">
              <DecryptedText text={protocol.name} speed={30} maxIterations={8} animateOn="view" />
            </span>
            <span className="text-xs font-mono text-[#54607b]">· Provenance Engine</span>
          </div>
        </div>

        {/* Top Metric Bar */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0d1019] border border-[#1b2234] text-xs font-mono text-[#7885a2]">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Arkiv Rabdi</span>
            <span className="text-[#323d54]">·</span>
            <span className="text-blue-400">#7794095</span>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-md border text-xs font-mono transition-colors ${
              mutatedNodeInfo
                ? "border-amber-800/80 bg-amber-950/40 text-amber-300"
                : "border-emerald-900/60 bg-emerald-950/40 text-emerald-400"
            }`}
          >
            <ShieldCheck
              className={`w-3.5 h-3.5 ${mutatedNodeInfo ? "text-amber-400 animate-pulse" : "text-emerald-400"}`}
            />
            <span className="text-[#7f8da8]">Composite Risk:</span>
            <span className="font-bold">{compositeScore}</span>
            <span className="text-[10px] font-semibold uppercase">({riskTier})</span>
            {mutatedNodeInfo && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-900/80 text-amber-200 uppercase font-semibold">
                Drift Recalculated
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Sub-Header Tab Switcher */}
      <div className="h-12 border-b border-[#141824] bg-[#07090e] px-6 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("graph")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer ${
              activeTab === "graph"
                ? "bg-[#141824] text-white border border-[#232b3d] shadow-sm"
                : "text-[#6c7997] hover:text-white hover:bg-[#0c0e16]"
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Provenance Graph</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0a0d14] text-[#828fa9]">15 Nodes</span>
            {mutatedNodeInfo && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("arkiv")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer ${
              activeTab === "arkiv"
                ? "bg-[#141824] text-white border border-[#232b3d] shadow-sm"
                : "text-[#6c7997] hover:text-white hover:bg-[#0c0e16]"
            }`}
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Arkiv Schemas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
              3 Entities
            </span>
          </button>

          <button
            onClick={() => setActiveTab("swarm")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer ${
              activeTab === "swarm"
                ? "bg-[#141824] text-white border border-[#232b3d] shadow-sm"
                : "text-[#6c7997] hover:text-white hover:bg-[#0c0e16]"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            <span>Swarm Evidence</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
              4 Blobs
            </span>
          </button>

          <button
            onClick={() => setActiveTab("cre")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer ${
              activeTab === "cre"
                ? "bg-[#141824] text-white border border-[#232b3d] shadow-sm"
                : "text-[#6c7997] hover:text-white hover:bg-[#0c0e16]"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chainlink CRE</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              Orchestrator
            </span>
          </button>
        </div>

        {/* Right Info */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-[#5f6c8a]">
          <span>Evaluated Block: <strong className="text-white">#{protocol.lastEvaluatedBlock}</strong></span>
          <span className="text-[#252f44]">·</span>
          <span>Fingerprint: <code className="text-[#8997b6]">{fingerprint.slice(0, 10)}...</code></span>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "graph" && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Filter & Layer Sidebar */}
          <div className="w-full md:w-56 border-r border-[#141824] bg-[#080a10] p-4 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#4e5b77] mb-2.5">
                  Provenance Hops
                </div>
                <div className="flex flex-col gap-1">
                  {[
                    { id: "all", label: "All Layers (15)", count: nodes.length },
                    { id: 0, label: "Hop 0 · Core (6)", count: nodes.filter((n) => n.hop === 0).length },
                    { id: 1, label: "Hop 1 · Governance (4)", count: nodes.filter((n) => n.hop === 1).length },
                    { id: 2, label: "Hop 2 · Oracles & Assets (5)", count: nodes.filter((n) => n.hop === 2).length },
                  ].map((item) => (
                    <button
                      key={String(item.id)}
                      onClick={() => setActiveHopFilter(item.id as number | "all")}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer flex items-center justify-between ${
                        activeHopFilter === item.id
                          ? "bg-[#131722] text-white border border-[#232b3d]"
                          : "text-[#6c7997] hover:text-white hover:bg-[#0d1018]"
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Node List */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#4e5b77] mb-2">
                  Active Contracts
                </div>
                <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                  {filteredNodes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setSelectedNode(n)}
                      className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-mono transition-colors cursor-pointer flex items-center justify-between ${
                        selectedNode.id === n.id
                          ? "bg-[#151a28] text-white border border-[#273248]"
                          : "text-[#7582a0] hover:text-white hover:bg-[#0c0f16]"
                      }`}
                    >
                      <span className="truncate max-w-[130px] flex items-center gap-1.5">
                        {mutatedNodeInfo?.id === n.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        )}
                        <span>{n.label}</span>
                      </span>
                      <span
                        className={`text-[9px] font-bold ${
                          mutatedNodeInfo?.id === n.id
                            ? "text-amber-400"
                            : n.riskScore <= 10
                              ? "text-emerald-400"
                              : "text-amber-400"
                        }`}
                      >
                        {n.riskScore}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#141824] text-[10px] text-[#4d5a76] font-mono space-y-1">
              <div className="flex justify-between">
                <span>Arkiv BTL:</span>
                <span className="text-[#8896b4]">50k blocks</span>
              </div>
              <div className="flex justify-between">
                <span>Evaluated:</span>
                <span className="text-[#8896b4]">#{protocol.lastEvaluatedBlock}</span>
              </div>
            </div>
          </div>

          {/* Center Canvas */}
          <div className="flex-1 bg-[#06080d] p-5 overflow-hidden flex flex-col justify-between relative">
            <ProvenanceGraphCanvas
              nodes={filteredNodes}
              edges={AAVE_EDGES}
              selectedNodeId={selectedNode.id}
              onSelectNode={(node) => setSelectedNode(node)}
              isRebuilding={isRebuilding}
              mutatedNodeId={mutatedNodeInfo?.id}
              onResetBaseline={handleResetBaseline}
              onSwitchToCreTab={() => setActiveTab("cre")}
            />
          </div>

          {/* Right Property Sheet (Entity Inspector) */}
          <div className="w-full md:w-84 border-l border-[#141824] bg-[#090b12] p-5 overflow-y-auto">
            <EntityPropertySheet node={selectedNode} />
          </div>
        </div>
      )}

      {activeTab === "arkiv" && (
        <div className="flex-1 overflow-y-auto bg-[#07080d]">
          <ArkivSchemaTab />
        </div>
      )}

      {activeTab === "swarm" && (
        <div className="flex-1 overflow-y-auto bg-[#07080d]">
          <SwarmArtifactsTab />
        </div>
      )}

      {activeTab === "cre" && (
        <div className="flex-1 overflow-y-auto bg-[#07080d] p-6 max-w-7xl mx-auto w-full">
          <ChainlinkCreTab
            nodes={nodes}
            compositeScore={compositeScore}
            riskTier={riskTier}
            fingerprint={fingerprint}
            isRebuilding={isRebuilding}
            mutatedNodeInfo={mutatedNodeInfo}
            onRebuildStart={() => setIsRebuilding(true)}
            onRebuildComplete={(updatedNodes, newScore, newTier, newFp, mutation) => {
              setNodes(updatedNodes);
              setCompositeScore(newScore);
              setRiskTier(newTier);
              setFingerprint(newFp);
              setMutatedNodeInfo(mutation);
              setIsRebuilding(false);
              const updatedSelected = updatedNodes.find((n) => n.id === mutation.id);
              if (updatedSelected) setSelectedNode(updatedSelected);
            }}
            onResetBaseline={handleResetBaseline}
            onSwitchToGraphTab={() => setActiveTab("graph")}
          />
        </div>
      )}
    </div>
  );
}

export default function GraphViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07080d] flex items-center justify-center text-xs text-[#6e7790] font-mono">
          Loading DeFi Provenance Graph...
        </div>
      }
    >
      <GraphViewerContent />
    </Suspense>
  );
}

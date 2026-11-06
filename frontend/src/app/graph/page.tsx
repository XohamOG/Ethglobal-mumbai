"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PROTOCOLS, AAVE_NODES, AAVE_EDGES, GraphNode, getRiskScoreConfig } from "@/lib/graph-data";
import { ProvenanceGraphCanvas } from "@/components/graph/ProvenanceGraphCanvas";
import { EntityPropertySheet } from "@/components/graph/EntityPropertySheet";
import { ArkivSchemaTab } from "@/components/tabs/ArkivSchemaTab";
import { SwarmArtifactsTab } from "@/components/tabs/SwarmArtifactsTab";
import { ChainlinkCreTab } from "@/components/tabs/ChainlinkCreTab";
import { CreTriggerModal } from "@/components/cre/CreTriggerModal";
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
  const [isCreModalOpen, setIsCreModalOpen] = useState(false);

  // Dynamic shared state across Graph canvas and CRE tabs
  const [nodes, setNodes] = useState<GraphNode[]>(AAVE_NODES);
  const [compositeScore, setCompositeScore] = useState<number>(protocol.compositeScore || 13.7);
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

  const liveRisk = getRiskScoreConfig(compositeScore);

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
    setCompositeScore(13.7);
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
    <div className="min-h-screen flex flex-col bg-[#0e0e12] text-[#ececf2]">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-[#282832] px-6 flex items-center justify-between bg-[#17171d] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-xs font-mono text-[#aaaab8] hover:text-[#ececf2] transition-colors cursor-pointer py-1 px-2 rounded-[2px] hover:bg-[#282832]">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Protocols</span>
            </button>
          </Link>
          <span className="text-[#282832]">/</span>
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm text-[#ececf2] tracking-tight">
              <DecryptedText text={protocol.name} speed={30} maxIterations={8} animateOn="view" />
            </span>
            <span className="text-xs font-mono text-[#7d8495]">· Provenance Engine</span>
          </div>
        </div>

        {/* Top Metric Bar (Cyber Sigilism Monochrome) */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-[2px] bg-[#0e0e12] border border-[#282832] text-xs font-mono text-[#aaaab8]">
            <Radio className="w-3 h-3 text-[#b068ff]" />
            <span>Arkiv Rabdi Testnet</span>
            <span className="text-[#282832]">·</span>
            <span className="text-[#d6d8e4]">#7794095</span>
          </div>

          {/* CRE Trigger & Score Button with Dynamic Risk Color & Glass Hover */}
          <button
            onClick={() => setIsCreModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-1 rounded-[2px] border ${liveRisk.borderColor} hover:border-[#b068ff]/70 bg-[#17171d]/80 backdrop-blur-md hover:bg-[#282832]/80 text-xs font-mono transition-all duration-300 cursor-pointer text-[#ececf2] shadow-sm`}
            title="Click to Trigger Real-Time CRE Fingerprint Verification"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${liveRisk.textColor}`} />
            <span className="text-[#aaaab8]">Score:</span>
            <span className={`font-bold ${liveRisk.textColor}`}>{compositeScore}</span>
            <span className={`text-[10px] uppercase font-semibold ${liveRisk.textColor}`}>
              ({liveRisk.tier})
            </span>
            <span className="text-[10px] bg-[#d6d8e4] text-[#000000] px-1.5 py-0.2 rounded-[2px] font-semibold flex items-center gap-1 ml-1 hover:bg-white transition-colors">
              <Zap className="w-2.5 h-2.5" />
              Audit
            </span>
          </button>
        </div>
      </header>

      {/* Sub-Header Tab Switcher */}
      <div className="h-12 border-b border-[#282832] bg-[#0e0e12] px-6 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("graph")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[2px] text-xs font-mono transition-all cursor-pointer ${
              activeTab === "graph"
                ? "bg-[#282832] text-[#ececf2] border border-[#7d8495]/40 font-semibold"
                : "text-[#aaaab8] hover:text-[#ececf2] hover:bg-[#17171d]"
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-[#d6d8e4]" />
            <span>Provenance Graph</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-[2px] bg-[#17171d] text-[#aaaab8] border border-[#282832]">
              15 Nodes
            </span>
          </button>

          <button
            onClick={() => setActiveTab("arkiv")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[2px] text-xs font-mono transition-all cursor-pointer ${
              activeTab === "arkiv"
                ? "bg-[#282832] text-[#ececf2] border border-[#7d8495]/40 font-semibold"
                : "text-[#aaaab8] hover:text-[#ececf2] hover:bg-[#17171d]"
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#d6d8e4]" />
            <span>Arkiv Relational Schemas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-[2px] bg-[#17171d] text-[#aaaab8] border border-[#282832]">
              3 Entities
            </span>
          </button>

          <button
            onClick={() => setActiveTab("swarm")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[2px] text-xs font-mono transition-all cursor-pointer ${
              activeTab === "swarm"
                ? "bg-[#282832] text-[#ececf2] border border-[#7d8495]/40 font-semibold"
                : "text-[#aaaab8] hover:text-[#ececf2] hover:bg-[#17171d]"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-[#d6d8e4]" />
            <span>Swarm Forensic Evidence</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-[2px] bg-[#17171d] text-[#aaaab8] border border-[#282832]">
              4 Blobs
            </span>
          </button>

          <button
            onClick={() => setActiveTab("cre")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[2px] text-xs font-mono transition-all cursor-pointer ${
              activeTab === "cre"
                ? "bg-[#282832] text-[#ececf2] border border-[#7d8495]/40 font-semibold"
                : "text-[#aaaab8] hover:text-[#ececf2] hover:bg-[#17171d]"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#b068ff]" />
            <span>Chainlink CRE Consensus</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-[2px] bg-[#17171d] text-[#b068ff] border border-[#282832]">
              Simulator
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "graph" && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Filter & Layer Sidebar */}
          <div className="w-full md:w-56 border-r border-[#282832] bg-[#17171d] p-4 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#7d8495] mb-2.5">
                  Provenance Hops
                </div>
                <div className="flex flex-col gap-1">
                  {[
                    { id: "all", label: "All Contracts (15)" },
                    { id: 0, label: "Hop 0 · Core (6)" },
                    { id: 1, label: "Hop 1 · Governance (4)" },
                    { id: 2, label: "Hop 2 · Oracles (5)" },
                  ].map((item) => (
                    <button
                      key={String(item.id)}
                      onClick={() => setActiveHopFilter(item.id as number | "all")}
                      className={`w-full text-left px-2.5 py-1.5 rounded-[2px] text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
                        activeHopFilter === item.id
                          ? "bg-[#282832] text-[#ececf2] border border-[#7d8495]/40 font-semibold"
                          : "text-[#aaaab8] hover:text-[#ececf2] hover:bg-[#282832]/50"
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Node List with Glass Hover & Semantic Risk Colors */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#7d8495] mb-2">
                  Active Contracts
                </div>
                <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                  {filteredNodes.map((n) => {
                    const nodeRisk = getRiskScoreConfig(n.riskScore);
                    const isSelected = selectedNode.id === n.id;
                    return (
                      <button
                        key={n.id}
                        onClick={() => setSelectedNode(n)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-[2px] text-[11px] font-mono transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                          isSelected
                            ? `bg-[#282832] text-[#ececf2] border ${nodeRisk.borderColor} shadow-sm`
                            : "bg-[#17171d]/60 backdrop-blur-sm border border-transparent hover:border-[#282832] hover:bg-[#282832]/80 text-[#aaaab8] hover:text-[#ececf2]"
                        }`}
                      >
                        <span className="truncate max-w-[130px] group-hover:text-white transition-colors">{n.label}</span>
                        <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded-[2px] ${nodeRisk.badgeBg} ${nodeRisk.textColor} border ${nodeRisk.borderColor}`}>
                          {n.riskScore}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#282832] text-[10px] text-[#7d8495] font-mono space-y-1">
              <div className="flex justify-between">
                <span>Arkiv BTL:</span>
                <span className="text-[#ececf2]">50k blocks</span>
              </div>
              <div className="flex justify-between">
                <span>Evaluated:</span>
                <span className="text-[#ececf2]">#{protocol.lastEvaluatedBlock}</span>
              </div>
            </div>
          </div>

          {/* Center Canvas */}
          <div className="flex-1 bg-[#0e0e12] p-5 overflow-hidden flex flex-col justify-between">
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
          <div className="w-full md:w-84 border-l border-[#282832] bg-[#17171d] p-5 overflow-y-auto">
            <EntityPropertySheet node={selectedNode} />
          </div>
        </div>
      )}

      {activeTab === "arkiv" && (
        <div className="flex-1 overflow-y-auto bg-[#0e0e12] p-6 max-w-6xl mx-auto w-full">
          <ArkivSchemaTab />
        </div>
      )}

      {activeTab === "swarm" && (
        <div className="flex-1 overflow-y-auto bg-[#0e0e12] p-6 max-w-6xl mx-auto w-full">
          <SwarmArtifactsTab />
        </div>
      )}

      {activeTab === "cre" && (
        <div className="flex-1 overflow-y-auto bg-[#0e0e12] p-6 max-w-6xl mx-auto w-full">
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
              const target = updatedNodes.find((n) => n.id === mutation.id);
              if (target) setSelectedNode(target);
            }}
            onResetBaseline={handleResetBaseline}
            onSwitchToGraphTab={() => setActiveTab("graph")}
          />
        </div>
      )}

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

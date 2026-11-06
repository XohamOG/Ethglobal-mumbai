"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  DEMO_BASELINE_NODES,
  DEMO_BASELINE_EDGES,
  DEMO_SCENARIOS,
  DemoScenario,
  scoreDemoNode,
  calculateDemoCompositeRisk,
  computeDemoFingerprint,
} from "@/lib/demo-data";
import { GraphNode, GraphEdge, getRiskScoreConfig } from "@/lib/graph-data";
import { ProvenanceGraphCanvas } from "@/components/graph/ProvenanceGraphCanvas";
import { EntityPropertySheet } from "@/components/graph/EntityPropertySheet";
import { AnimatedScoreCard } from "@/components/ui/AnimatedScoreCard";
import {
  ShieldAlert,
  RotateCcw,
  Terminal,
  ArrowRight,
  ExternalLink,
  Flame,
  CheckCircle2,
  Sparkles,
  Zap,
  Sliders,
  Layers,
  Activity,
  ArrowLeft,
} from "lucide-react";

export default function DemoPage() {
  const [nodes, setNodes] = useState<GraphNode[]>(() => {
    return DEMO_BASELINE_NODES.map((n) => {
      const { score, breakdown } = scoreDemoNode(n);
      return { ...n, riskScore: score, breakdown };
    });
  });

  const [edges, setEdges] = useState<GraphEdge[]>(DEMO_BASELINE_EDGES);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(nodes[0]);
  const [activeScenarioId, setActiveScenarioId] = useState<number | null>(null);
  const [isRebuilding, setIsRebuilding] = useState<boolean>(false);
  const [mutatedNodeId, setMutatedNodeId] = useState<string | undefined>(undefined);
  const [logs, setLogs] = useState<string[]>([
    "[*] Sandbox initialized with clean DemoLend protocol baseline.",
    "[+] 14 Contracts bound across 2 hops. Consensus stable.",
    `[+] Canonical Keccak256 Fingerprint: ${computeDemoFingerprint(nodes).slice(0, 18)}...`,
  ]);

  // Calculate live composite risk across nodes
  const liveRiskAnalysis = useMemo(() => {
    return calculateDemoCompositeRisk(nodes);
  }, [nodes]);

  const liveFingerprint = useMemo(() => {
    return computeDemoFingerprint(nodes);
  }, [nodes]);

  const baselineFingerprint = useMemo(() => {
    return computeDemoFingerprint(DEMO_BASELINE_NODES);
  }, []);

  const isFingerprintDrifted = liveFingerprint !== baselineFingerprint;
  const scoreConfig = getRiskScoreConfig(liveRiskAnalysis.compositeScore);

  const appendLog = (msg: string) => {
    setLogs((prev) => [...prev.slice(-25), msg]);
  };

  // Reset to Baseline
  const handleResetBaseline = () => {
    const freshNodes = DEMO_BASELINE_NODES.map((n) => {
      const { score, breakdown } = scoreDemoNode(n);
      return { ...n, riskScore: score, breakdown };
    });
    setNodes(freshNodes);
    setEdges(DEMO_BASELINE_EDGES);
    setActiveScenarioId(null);
    setMutatedNodeId(undefined);
    setIsRebuilding(false);
    setSelectedNode(freshNodes[0]);
    appendLog("[*] System state RESET to pristine baseline. All parameters safe.");
  };

  // Trigger Scenario Attack
  const handleTriggerScenario = (scenario: DemoScenario) => {
    if (activeScenarioId === scenario.id) {
      handleResetBaseline();
      return;
    }

    setIsRebuilding(true);
    setActiveScenarioId(scenario.id);
    setMutatedNodeId(scenario.targetNodeId);

    appendLog(`\n======================================================`);
    appendLog(`[!] CHAOS SIMULATION: Scenario #${scenario.id} - ${scenario.title}`);
    appendLog(`[*] Injecting parameter mutation on: ${scenario.targetNodeLabel}...`);

    setTimeout(() => {
      let updatedNodes = DEMO_BASELINE_NODES.map((n) => ({ ...n }));
      let updatedEdges = [...DEMO_BASELINE_EDGES];

      switch (scenario.id) {
        case 1: {
          // Scenario 1: Proxy Implementation Upgrade
          updatedNodes = updatedNodes.map((n) => {
            if (n.id === "demo-pool-impl") {
              const mutated: GraphNode = {
                ...n,
                label: "DemoLend Pool Logic Impl (V2 Unverified)",
                address: "0x2222222222222222222222222222222222222222",
                sourcifyStatus: "partial_match",
                proxyType: "none",
                bytecodeHash: "0xb2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01",
                contractName: "DemoLendPoolImplementationV2_Unverified",
              };
              const { score, breakdown } = scoreDemoNode(mutated);
              return { ...mutated, riskScore: score, breakdown };
            }
            return n;
          });
          appendLog("[!] EIP-1967 Implementation storage slot changed -> 0x2222...2222");
          appendLog("[*] Chainlink CRE Log Trigger: 'Upgraded(address 0x2222...)' caught!");
          appendLog("[!] Fingerprint Drift: Bytecode hash altered. 2-Hop rebuild dispatched.");
          break;
        }

        case 2: {
          // Scenario 2: Admin / Governance Takeover
          updatedNodes = updatedNodes.map((n) => {
            if (n.id === "demo-pool-proxy") {
              const mutated: GraphNode = {
                ...n,
                label: "DemoLend Pool (EOA Controlled)",
                adminType: "eoa",
                adminAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
              };
              const { score, breakdown } = scoreDemoNode(mutated);
              return { ...mutated, riskScore: score, breakdown };
            }
            return n;
          });
          // Update Edge
          updatedEdges = updatedEdges.map((e) => {
            if (e.from === "demo-pool-proxy" && e.to === "demo-governance-timelock") {
              return { ...e, label: "EOA Private Key Admin", type: "governance" };
            }
            return e;
          });
          appendLog("[!] Admin slot 0xb531... mutated to single EOA (0xd8dA...6045)!");
          appendLog("[!] CRE Consensus Alert: Timelock bypassed! Maximum F2 penalty applied (20 pts).");
          break;
        }

        case 3: {
          // Scenario 3: Multisig Compromise
          updatedNodes = updatedNodes.map((n) => {
            if (n.id === "demo-guardian-safe") {
              const mutated: GraphNode = {
                ...n,
                label: "Compromised Guardian Safe (1-of-2)",
                safeOwnerCount: 2,
                safeThreshold: 1,
              };
              const { score, breakdown } = scoreDemoNode(mutated);
              return { ...mutated, riskScore: score, breakdown };
            }
            return n;
          });
          appendLog("[!] Gnosis Safe threshold reduced: 4/5 -> 1/2 signers!");
          appendLog("[!] CRE Alert: Signers < 3 and threshold ratio 0.5. F5 Concentration Risk spiked to 14 pts.");
          break;
        }

        case 4: {
          // Scenario 4: Oracle Feed Replacement
          updatedNodes = updatedNodes.map((n) => {
            if (n.id === "demo-feed-eth") {
              const mutated: GraphNode = {
                ...n,
                label: "Unverified Third-Party ETH Feed",
                address: "0x3333333333333333333333333333333333333333",
                sourcifyStatus: "not_found",
                contractName: "UnknownOracleAggregator",
              };
              const { score, breakdown } = scoreDemoNode(mutated);
              return { ...mutated, riskScore: score, breakdown };
            }
            return n;
          });
          appendLog("[!] Oracle router redirect: Canonical Chainlink feed replaced with 0x3333...3333!");
          appendLog("[!] CRE Alert: Unverified feed detected! F1 Verification penalty applied (20 pts).");
          break;
        }

        case 5: {
          // Scenario 5: Oracle Staleness
          updatedNodes = updatedNodes.map((n) => {
            if (n.id === "demo-feed-eth") {
              const mutated: GraphNode = {
                ...n,
                label: "Chainlink ETH/USD (STALE - 2.8x Heartbeat)",
                oracleStaleness: 2.8,
              };
              const { score, breakdown } = scoreDemoNode(mutated);
              return { ...mutated, riskScore: score, breakdown };
            }
            return n;
          });
          appendLog("[!] AggregatorV3Interface.latestRoundData() heartbeat timeout!");
          appendLog("[!] Staleness ratio: 2.8x heartbeat elapsed (> 2.0x threshold).");
          appendLog("[!] CRE Alert: Maximum F4 Staleness penalty applied (15 pts).");
          break;
        }

        case 6: {
          // Scenario 6: Timelock Delay Reduction
          updatedNodes = updatedNodes.map((n) => {
            if (n.id === "demo-governance-timelock") {
              const mutated: GraphNode = {
                ...n,
                label: "Timelock (1h Delay - CRITICAL BYPASS)",
              };
              const { score, breakdown } = scoreDemoNode(mutated, 1); // 1 hour delay
              return { ...mutated, riskScore: score, breakdown };
            }
            return n;
          });
          appendLog("[!] Timelock contract delay reduced: 48 hours -> 1 hour!");
          appendLog("[!] CRE Alert: Delay < 24h allows flash-loan governance hijacking. F2 penalized (+8 pts).");
          break;
        }
      }

      setNodes(updatedNodes);
      setEdges(updatedEdges);
      setIsRebuilding(false);

      const target = updatedNodes.find((n) => n.id === scenario.targetNodeId);
      if (target) setSelectedNode(target);

      appendLog(`[+] Dynamic 2-hop composite score updated and attested to RiskRegistry.sol.`);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0e0e12] text-[#ececf2] flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-[#282832] bg-[#17171d]/90 backdrop-blur-md px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/graph"
            className="flex items-center gap-1.5 text-xs font-mono text-[#aaaab8] hover:text-[#ececf2] transition-colors p-1.5 rounded-[2px] hover:bg-[#282832]"
            title="Return to Live Aave V3 Graph"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live Graph</span>
          </Link>

          <span className="text-[#282832]">/</span>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#b068ff] animate-pulse" />
            <h1 className="font-serif font-bold text-sm text-[#ececf2] tracking-tight">
              Governance & Security Chaos Sandbox
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#b068ff]/20 text-[#b068ff] border border-[#b068ff]/30 font-semibold uppercase">
              Demo Lab
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3 text-xs font-mono">
          {activeScenarioId ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-[2px] bg-amber-950/40 border border-amber-600/50 text-amber-300">
              <Flame className="w-3 h-3 text-amber-400 animate-bounce" />
              <span>Scenario #{activeScenarioId} Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-[2px] bg-[#0e0e12] border border-[#282832] text-[#aaaab8]">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Baseline Healthy</span>
            </div>
          )}

          <button
            onClick={handleResetBaseline}
            className="flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-[#282832] hover:bg-[#7d8495]/40 text-[#ececf2] border border-[#7d8495]/40 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#d6d8e4]" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </header>

      {/* Main Sandbox Layout: 2-Column Split */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Interactive Scenario Matrix (Control Console) */}
        <div className="w-full lg:w-[420px] xl:w-[460px] border-b lg:border-b-0 lg:border-r border-[#282832] bg-[#17171d]/90 flex flex-col h-auto lg:h-[calc(100vh-3.5rem)] overflow-y-auto">
          {/* Subheader */}
          <div className="p-4 border-b border-[#282832] bg-[#17171d]">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#b068ff]" />
                <h2 className="font-serif font-bold text-sm text-[#ececf2]">Attack & Drift Scenarios</h2>
              </div>
              <span className="text-[10px] font-mono text-[#aaaab8]">6 Scenarios</span>
            </div>
            <p className="text-[11px] font-mono text-[#aaaab8] leading-relaxed">
              Trigger simulated structural and governance breaches to observe instantaneous Chainlink CRE consensus detection and 7-factor graph re-scoring.
            </p>
          </div>

          {/* Scenario Cards List */}
          <div className="p-4 space-y-3 flex-1">
            {DEMO_SCENARIOS.map((s) => {
              const isActive = activeScenarioId === s.id;
              return (
                <div
                  key={s.id}
                  className={`p-3.5 rounded-[4px] border transition-all duration-200 text-xs font-mono flex flex-col gap-2.5 ${
                    isActive
                      ? "bg-[#282832]/90 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "bg-[#0e0e12]/80 border-[#282832] hover:border-[#7d8495]/50 hover:bg-[#282832]/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-[2px] bg-[#282832] border border-[#7d8495]/40 text-[#d6d8e4] flex items-center justify-center font-bold text-[10px]">
                        #{s.id}
                      </span>
                      <span className="font-semibold text-[#ececf2] text-xs font-sans">{s.title}</span>
                    </div>

                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-[2px] uppercase font-bold border ${
                        s.category === "Governance"
                          ? "bg-rose-950/60 text-rose-300 border-rose-800/50"
                          : s.category === "Oracle"
                          ? "bg-blue-950/60 text-blue-300 border-blue-800/50"
                          : s.category === "Access Control"
                          ? "bg-amber-950/60 text-amber-300 border-amber-800/50"
                          : "bg-purple-950/60 text-purple-300 border-purple-800/50"
                      }`}
                    >
                      {s.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#aaaab8] leading-normal font-sans">{s.description}</p>

                  {/* Parameter Diff */}
                  <div className="p-2 rounded-[2px] bg-[#17171d] border border-[#282832] text-[10px] space-y-1">
                    <div className="text-[#d6d8e4] font-semibold flex items-center gap-1">
                      <span className="text-[#b068ff]">●</span> Target: {s.targetNodeLabel}
                    </div>
                    <div className="text-[#aaaab8] leading-tight">{s.simulatedChange}</div>
                    <div className="text-amber-400 font-semibold">{s.expectedEffect}</div>
                  </div>

                  {/* Trigger Action Button */}
                  <button
                    onClick={() => handleTriggerScenario(s)}
                    className={`w-full py-1.5 px-3 rounded-[2px] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
                      isActive
                        ? "bg-amber-500/20 text-amber-300 border-amber-500 hover:bg-amber-500/30"
                        : "bg-[#282832] text-[#ececf2] border-[#7d8495]/40 hover:bg-[#7d8495]/40"
                    }`}
                  >
                    {isActive ? (
                      <>
                        <RotateCcw className="w-3 h-3" />
                        <span>Revert Scenario</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-[#d6d8e4]" />
                        <span>Simulate Attack & Test Drift</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Execution Log Terminal */}
          <div className="p-4 border-t border-[#282832] bg-[#0e0e12]">
            <div className="flex items-center gap-1.5 text-[10px] text-[#7d8495] uppercase tracking-wider mb-2 font-mono">
              <Terminal className="w-3.5 h-3.5 text-[#d6d8e4]" />
              <span>Chainlink CRE Consensus Stream</span>
            </div>
            <div className="p-2.5 rounded-[4px] bg-[#17171d]/90 border border-[#282832] font-mono text-[10.5px] text-[#aaaab8] space-y-1 h-36 overflow-y-auto">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={
                    log.startsWith("[!]")
                      ? "text-amber-300 font-semibold"
                      : log.startsWith("[+]")
                      ? "text-[#ececf2]"
                      : "text-[#aaaab8]"
                  }
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Provenance Graph & Dynamic Score */}
        <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
          {/* Top Score Banner */}
          <div className="p-4 border-b border-[#282832] bg-[#17171d]/60">
            <AnimatedScoreCard
              score={liveRiskAnalysis.compositeScore}
              riskTier={liveRiskAnalysis.riskTier}
              fingerprint={liveFingerprint}
              lastEvaluatedBlock={26354138}
              breakdown={liveRiskAnalysis.breakdown}
              isFingerprintChanged={isFingerprintDrifted}
            />
          </div>

          {/* Graph Canvas & Property Sheet Workspace */}
          <div className="flex-1 relative overflow-hidden flex">
            <div className="flex-1 h-full relative">
              <ProvenanceGraphCanvas
                nodes={nodes}
                edges={edges}
                selectedNodeId={selectedNode?.id || nodes[0]?.id}
                onSelectNode={(node) => setSelectedNode(node)}
                isRebuilding={isRebuilding}
                mutatedNodeId={mutatedNodeId}
                onResetBaseline={handleResetBaseline}
              />
            </div>

            {/* Right Property Sheet for inspecting mutated parameters */}
            {selectedNode && (
              <EntityPropertySheet
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

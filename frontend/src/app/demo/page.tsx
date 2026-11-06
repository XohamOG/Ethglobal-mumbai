"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  DEMO_BASELINE_NODES,
  DEMO_BASELINE_EDGES,
  DEMO_SCENARIOS,
  scoreDemoNode,
  calculateDemoCompositeRisk,
  computeDemoFingerprint,
} from "@/lib/demo-data";
import { GraphNode, GraphEdge, getRiskScoreConfig } from "@/lib/graph-data";
import { ProvenanceGraphCanvas } from "@/components/graph/ProvenanceGraphCanvas";
import { EntityPropertySheet } from "@/components/graph/EntityPropertySheet";
import {
  RotateCcw,
  Terminal,
  Zap,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";

export default function DemoPage() {
  const [nodes, setNodes] = useState<GraphNode[]>(() => {
    return DEMO_BASELINE_NODES.map((n) => {
      const { score, breakdown } = scoreDemoNode(n);
      return { ...n, riskScore: score, breakdown };
    });
  });

  const [edges, setEdges] = useState<GraphEdge[]>(DEMO_BASELINE_EDGES);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<number | null>(null);
  const [isRebuilding, setIsRebuilding] = useState<boolean>(false);
  const [mutatedNodeId, setMutatedNodeId] = useState<string | undefined>(undefined);
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([
    "[*] Sandbox initialized with clean baseline (10 nodes, 3 hops).",
    `[+] Baseline Keccak256 Fingerprint: ${computeDemoFingerprint(DEMO_BASELINE_NODES).slice(0, 18)}...`,
  ]);

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
  const riskConfig = getRiskScoreConfig(liveRiskAnalysis.compositeScore);

  const appendLog = (msg: string) => {
    setLogs((prev) => [...prev.slice(-20), msg]);
  };

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
    setSelectedNode(null);
    appendLog("[*] Reset to pristine baseline. All parameters safe.");
  };

  const handleTriggerScenario = (scenarioId: number) => {
    if (activeScenarioId === scenarioId) {
      handleResetBaseline();
      return;
    }

    const scenario = DEMO_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;

    setIsRebuilding(true);
    setActiveScenarioId(scenario.id);
    setMutatedNodeId(scenario.targetNodeId);

    appendLog(`[!] Triggered Scenario #${scenario.id}: ${scenario.title}`);

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
                label: "DemoLend Impl (V2 Unverified)",
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
          appendLog("[*] EIP-1967 Implementation slot changed -> 0x2222...2222");
          appendLog("[!] Fingerprint Drift: Bytecode hash altered. 2-Hop graph rebuilt.");
          break;
        }

        case 2: {
          // Scenario 2: Admin Takeover
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
          updatedEdges = updatedEdges.map((e) => {
            if (e.from === "demo-pool-proxy" && e.to === "demo-governance-timelock") {
              return { ...e, label: "EOA Private Key Admin", type: "governance" };
            }
            return e;
          });
          appendLog("[!] Admin slot changed to single EOA (0xd8dA...6045).");
          appendLog("[!] F2 Admin Control escalated to 20 pts (Maximum EOA centralization).");
          break;
        }

        case 3: {
          // Scenario 3: Multisig Compromise
          updatedNodes = updatedNodes.map((n) => {
            if (n.id === "demo-guardian-safe") {
              const mutated: GraphNode = {
                ...n,
                label: "Compromised Safe (1-of-2)",
                safeOwnerCount: 2,
                safeThreshold: 1,
              };
              const { score, breakdown } = scoreDemoNode(mutated);
              return { ...mutated, riskScore: score, breakdown };
            }
            return n;
          });
          appendLog("[!] Safe signers reduced to 2; Threshold lowered to 1-of-2.");
          appendLog("[!] F5 Concentration Risk penalizes < 3 signers (+14 pts).");
          break;
        }

        case 4: {
          // Scenario 4: Oracle Feed Replacement
          updatedNodes = updatedNodes.map((n) => {
            if (n.id === "demo-feed-eth") {
              const mutated: GraphNode = {
                ...n,
                label: "Unverified ETH Feed (0x3333...)",
                address: "0x3333333333333333333333333333333333333333",
                sourcifyStatus: "not_found",
                contractName: "UnknownOracleAggregator",
              };
              const { score, breakdown } = scoreDemoNode(mutated);
              return { ...mutated, riskScore: score, breakdown };
            }
            return n;
          });
          appendLog("[!] ETH/USD routed to unverified feed contract (0x3333...).");
          appendLog("[!] F1 Verification penalty applied (20 pts).");
          break;
        }

        case 5: {
          // Scenario 5: Oracle Staleness
          updatedNodes = updatedNodes.map((n) => {
            if (n.id === "demo-feed-eth") {
              const mutated: GraphNode = {
                ...n,
                label: "ETH/USD Feed (STALE 2.8x)",
                oracleStaleness: 2.8,
              };
              const { score, breakdown } = scoreDemoNode(mutated);
              return { ...mutated, riskScore: score, breakdown };
            }
            return n;
          });
          appendLog("[!] Oracle heartbeat timeout: Staleness ratio 2.8x.");
          appendLog("[!] F4 Staleness hits maximum penalty (15 pts).");
          break;
        }

        case 6: {
          // Scenario 6: Timelock Delay Reduction
          updatedNodes = updatedNodes.map((n) => {
            if (n.id === "demo-governance-timelock") {
              const mutated: GraphNode = {
                ...n,
                label: "Timelock (1h Delay Bypass)",
              };
              const { score, breakdown } = scoreDemoNode(mutated, 1);
              return { ...mutated, riskScore: score, breakdown };
            }
            return n;
          });
          appendLog("[!] Timelock delay reduced: 48h -> 1h.");
          appendLog("[!] F2 Admin Control penalized for flash-loan bypass window.");
          break;
        }
      }

      setNodes(updatedNodes);
      setEdges(updatedEdges);
      setIsRebuilding(false);

      const target = updatedNodes.find((n) => n.id === scenario.targetNodeId);
      if (target) setSelectedNode(target);
    }, 450);
  };

  const scenarioShortButtons = [
    { id: 1, label: "1. Impl V2 Upgrade", category: "Upgrade" },
    { id: 2, label: "2. EOA Takeover", category: "Governance" },
    { id: 3, label: "3. Safe 1/2 Compromise", category: "Multisig" },
    { id: 4, label: "4. Rogue Oracle Feed", category: "Oracle" },
    { id: 5, label: "5. Stale Oracle (2.8x)", category: "Staleness" },
    { id: 6, label: "6. Timelock 1h Delay", category: "Delay" },
  ];

  return (
    <div className="h-screen w-screen bg-[#101010] text-[#f3f3f3] flex flex-col font-sans overflow-hidden">
      {/* Top Header — Hyperstudio Specification */}
      <header className="h-16 shrink-0 border-b border-[#212121] bg-[#101010] px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/graph"
            className="flex items-center gap-1.5 text-[12px] text-[#9c9c9c] hover:text-[#f3f3f3] transition-colors px-3 py-1.5 rounded-[8px] border border-[#212121] hover:border-[#474747] bg-[#080808] uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Aave V3 Live</span>
          </Link>

          <span className="text-[#212121]">/</span>

          <div className="flex items-center gap-2">
            <span className="text-[15px] font-normal text-[#f3f3f3] tracking-tight">
              Chaos Sandbox
            </span>
            <span className="text-[12px] text-[#9c9c9c] uppercase tracking-wider font-mono">
              · 6 Simulation Scenarios
            </span>
          </div>
        </div>

        {/* Live Score Seal & Actions */}
        <div className="flex items-center gap-3">
          {/* Status Badge Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#1a1a1a] border border-[#212121] text-[12px] uppercase tracking-wider">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isFingerprintDrifted ? "bg-[#f59e0b] animate-ping" : "bg-[#98ff38]"
              }`}
            />
            <span className="text-[#9c9c9c]">Risk:</span>
            <span className="text-[#f3f3f3] font-mono">{liveRiskAnalysis.compositeScore}</span>
            <span className="text-[#9c9c9c]">({liveRiskAnalysis.riskTier})</span>
          </div>

          {/* Ghost Outline Reset Button */}
          <button
            onClick={handleResetBaseline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-transparent hover:bg-[#1a1a1a] text-[#f3f3f3] border border-[#212121] hover:border-[#474747] text-[12px] uppercase tracking-wider transition-colors cursor-pointer"
            title="Reset All Parameters to Baseline"
          >
            <RotateCcw className="w-3 h-3 text-[#6f6759]" />
            <span>Reset Baseline</span>
          </button>

          {/* White Pill Button */}
          <Link
            href="/graph?protocol=aave-v3-mainnet"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#ffffff] hover:bg-[#f3f3f3] text-[#101010] text-[12px] font-normal uppercase tracking-wider transition-colors"
          >
            <span>Live Graph</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Clean Scenario Control Bar */}
      <div className="h-12 shrink-0 border-b border-[#212121] bg-[#080808] px-6 flex items-center justify-between gap-3 overflow-x-auto z-20">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-[#9c9c9c] uppercase tracking-wider mr-1 hidden sm:inline">
            Simulate Drift:
          </span>
          {scenarioShortButtons.map((btn) => {
            const isActive = activeScenarioId === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => handleTriggerScenario(btn.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-[12px] uppercase tracking-wider transition-colors cursor-pointer border shrink-0 ${
                  isActive
                    ? "bg-[#1a1a1a] border-[#ffffff] text-[#f3f3f3]"
                    : "bg-[#101010] border-[#212121] text-[#9c9c9c] hover:text-[#f3f3f3] hover:border-[#474747]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? "bg-[#f59e0b] animate-ping" : "bg-[#474747]"
                  }`}
                />
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toggle Terminal Button */}
        <button
          onClick={() => setShowTerminal(!showTerminal)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-[12px] uppercase tracking-wider transition-colors shrink-0 border cursor-pointer ${
            showTerminal
              ? "bg-[#1a1a1a] border-[#474747] text-[#f3f3f3]"
              : "bg-[#101010] border-[#212121] text-[#9c9c9c] hover:text-[#f3f3f3]"
          }`}
          title="Toggle Consensus Stream Console"
        >
          <Terminal className="w-3.5 h-3.5 text-[#6f6759]" />
          <span>Stream Log</span>
          {showTerminal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Main Graph Canvas & Workspace */}
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

        {/* Right-Side Property Sheet (Only visible when node selected) */}
        {selectedNode && (
          <EntityPropertySheet
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        )}

        {/* Floating Minimal Terminal Drawer (Collapsible) */}
        {showTerminal && (
          <div className="absolute bottom-4 left-4 z-40 w-96 max-w-[calc(100vw-2rem)] rounded-[8px] border border-[#212121] bg-[#080808]/98 backdrop-blur-md overflow-hidden font-mono text-[11px] animate-fadeIn">
            <div className="px-3.5 py-2.5 border-b border-[#212121] bg-[#101010] flex items-center justify-between text-[#9c9c9c]">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#f3f3f3]">
                <Terminal className="w-3.5 h-3.5 text-[#6f6759]" />
                <span>Chainlink CRE Consensus Stream</span>
              </div>
              <button
                onClick={() => setShowTerminal(false)}
                className="text-[#9c9c9c] hover:text-[#f3f3f3] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-3.5 max-h-48 overflow-y-auto space-y-1.5 text-[#9c9c9c]">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className={
                    log.startsWith("[!]")
                      ? "text-[#f59e0b] font-medium"
                      : log.startsWith("[+]")
                      ? "text-[#f3f3f3]"
                      : "text-[#9c9c9c]"
                  }
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

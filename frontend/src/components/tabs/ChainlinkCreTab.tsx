"use client";

import React, { useState } from "react";
import { PROTOCOLS } from "@/lib/graph-data";
import { Radio, Zap, Clock, Terminal, CheckCircle2, Play, RefreshCw, ShieldAlert, ShieldCheck, ArrowRight, Database } from "lucide-react";
import { ShinyButton } from "@/components/ui/ShinyButton";

interface SimulationStep {
  step: number;
  title: string;
  detail: string;
  status: "pending" | "running" | "done";
  txData?: any;
}

export function ChainlinkCreTab() {
  const [activeWorkflow, setActiveWorkflow] = useState<"log_trigger" | "cron_sweep">("log_trigger");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSteps, setSimSteps] = useState<SimulationStep[]>([]);
  const [lastTxReceipt, setLastTxReceipt] = useState<any | null>(null);

  const aave = PROTOCOLS[0];

  const runSimulation = (triggerType: "log" | "cron") => {
    setIsSimulating(true);
    setLastTxReceipt(null);

    const initialSteps: SimulationStep[] =
      triggerType === "log"
        ? [
            {
              step: 1,
              title: "EVM Event Emitted On-Chain",
              detail: "Upgraded(address indexed implementation = 0x5FAab9E1...newImpl) on Pool Proxy 0x87870B...",
              status: "running",
            },
            {
              step: 2,
              title: "CRE QuickJS-WASM Node Consensus",
              detail: "Log trigger validates event topic0 (0xbc7cd75a...). Off-chain BFT 2/3 consensus reached.",
              status: "pending",
            },
            {
              step: 3,
              title: "Graph Service Rebuild Dispatched",
              detail: "POST /rebuild called with { protocolId: 'aave-v3-mainnet', triggeredBy: 'log-event' }",
              status: "pending",
            },
            {
              step: 4,
              title: "Arkiv Snapshot & Swarm Evidence Minted",
              detail: "New RiskSnapshot created in Arkiv with 50,000 blocks BTL. Swarm full-graph.json archived.",
              status: "pending",
            },
            {
              step: 5,
              title: "On-Chain RiskRegistry.sol Attestation",
              detail: "CRE Forwarder invokes reportRisk('aave-v3-mainnet', 1371, 'LOW', 'snapshot-26354140', 26354140)",
              status: "pending",
            },
          ]
        : [
            {
              step: 1,
              title: "Cron Sweep Trigger Fired",
              detail: "Scheduled 7,200 block cycle triggered. Reading on-chain bytecode hashes & admin slots.",
              status: "running",
            },
            {
              step: 2,
              title: "Fingerprint Drift Detected",
              detail: "Stored: 0x39a7cd... | Computed: 0x8f21bc... (Admin Safe rotated signers or feed changed).",
              status: "pending",
            },
            {
              step: 3,
              title: "Graph Service Rebuild Dispatched",
              detail: "POST /rebuild called with { protocolId: 'aave-v3-mainnet', triggeredBy: 'cron' }",
              status: "pending",
            },
            {
              step: 4,
              title: "Arkiv Snapshot Updated with BTL",
              detail: "Old snapshot invalidated via BTL expiration. Fresh topology persisted.",
              status: "pending",
            },
            {
              step: 5,
              title: "On-Chain Risk Attested",
              detail: "RiskRegistry.reportRisk() executed with updated 7-factor composite score.",
              status: "pending",
            },
          ];

    setSimSteps(initialSteps);

    // Animate through steps
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setSimSteps((prev) =>
        prev.map((s, idx) => {
          if (idx < current) return { ...s, status: "done" };
          if (idx === current) return { ...s, status: "running" };
          return s;
        })
      );

      if (current >= initialSteps.length) {
        clearInterval(interval);
        setIsSimulating(false);
        setLastTxReceipt({
          transactionHash: "0x89e1b7f2930a6c7f8921e04859a12c4180aa3de7b4eb56e7cd4b454ba8ff71e4",
          blockNumber: 26354142,
          contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
          creForwarder: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          protocolId: "aave-v3-mainnet",
          compositeScore: 13.71,
          riskTier: "LOW",
          event: "RiskReported(aave-v3-mainnet, 1371, LOW, snapshot-26354142, 26354142)",
          gasUsed: "68,421",
        });
      }
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0a0d16] border border-[#182032]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400 font-mono">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Chainlink Runtime Environment (CRE) Workflows</h3>
            <p className="text-xs text-[#717e9c] font-mono">
              Autonomous Off-Chain Compute, Drift Detection & On-Chain Risk Attestation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-blue-400 px-2.5 py-1 rounded bg-[#0f1422] border border-[#1c2742]">
            CRE Forwarder Verified
          </span>
        </div>
      </div>

      {/* Two Workflow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        {/* Workflow 1: Log Trigger */}
        <div
          onClick={() => setActiveWorkflow("log_trigger")}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeWorkflow === "log_trigger"
              ? "bg-[#0e1322] border-blue-500/80 shadow-md shadow-blue-500/5"
              : "bg-[#090c14] border-[#161d2d] hover:border-[#26334d]"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Workflow 1: Log Trigger (Real-Time)</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-950 text-blue-400 border border-blue-900/60 font-semibold">
              EVM Logs
            </span>
          </div>

          <p className="text-[#7d8ca9] leading-relaxed mb-3">
            Listens continuously for on-chain events emitted by Aave core proxies:
            <code className="text-white block mt-1">Upgraded(address implementation)</code>
            <code className="text-white block">AdminChanged(address previousAdmin, address newAdmin)</code>
          </p>

          <div className="flex justify-between items-center text-[10px] text-[#556382] border-t border-[#151c2c] pt-2">
            <span>Latency: Instant (&lt; 1 block)</span>
            <span>Target: Pool Proxy (0x87870Bca...)</span>
          </div>
        </div>

        {/* Workflow 2: Cron Sweep */}
        <div
          onClick={() => setActiveWorkflow("cron_sweep")}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeWorkflow === "cron_sweep"
              ? "bg-[#0e1322] border-blue-500/80 shadow-md shadow-blue-500/5"
              : "bg-[#090c14] border-[#161d2d] hover:border-[#26334d]"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Workflow 2: Cron Sweep (Periodic)</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950 text-amber-400 border border-amber-900/60 font-semibold">
              Every 7,200 Blocks
            </span>
          </div>

          <p className="text-[#7d8ca9] leading-relaxed mb-3">
            Computes Keccak256 protocol fingerprint over implementation bytecodes, multisig signers, and Chainlink feeds.
            Diffs against latest Arkiv <code className="text-white">RiskSnapshot.fingerprint</code>.
          </p>

          <div className="flex justify-between items-center text-[10px] text-[#556382] border-t border-[#151c2c] pt-2">
            <span>Cadence: 24h / 7,200 blocks</span>
            <span>Detects: Silent on-chain drift</span>
          </div>
        </div>
      </div>

      {/* Interactive Live Simulator Panel */}
      <div className="rounded-xl border border-[#161d2d] bg-[#080b13] p-5 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#141926] mb-4">
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Chainlink CRE Live Trigger Simulator</span>
            </h4>
            <p className="text-[11px] text-[#6b7b9b] mt-0.5">
              Simulate autonomous workflow execution and witness live on-chain attestation in RiskRegistry.sol.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ShinyButton
              onClick={() => runSimulation("log")}
              disabled={isSimulating}
              variant="primary"
              className="text-xs py-1.5 px-3"
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Simulate Upgrade Event</span>
            </ShinyButton>

            <ShinyButton
              onClick={() => runSimulation("cron")}
              disabled={isSimulating}
              variant="secondary"
              className="text-xs py-1.5 px-3"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
              <span>Simulate Cron Drift</span>
            </ShinyButton>
          </div>
        </div>

        {/* Live Simulation Execution Trace */}
        {simSteps.length > 0 ? (
          <div className="space-y-2.5 mb-5">
            {simSteps.map((s) => (
              <div
                key={s.step}
                className={`p-3 rounded-lg border transition-all flex items-start gap-3 ${
                  s.status === "done"
                    ? "bg-[#0b101c] border-[#182338] text-white"
                    : s.status === "running"
                    ? "bg-[#111728] border-blue-500/80 text-white animate-pulse"
                    : "bg-[#070910] border-[#111520] text-[#4d5770]"
                }`}
              >
                <div className="mt-0.5">
                  {s.status === "done" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : s.status === "running" ? (
                    <Radio className="w-4 h-4 text-blue-400 shrink-0 animate-ping" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#2b3449] flex items-center justify-center text-[9px]">
                      {s.step}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">{s.title}</span>
                    <span className="text-[10px] text-[#556382] uppercase">{s.status}</span>
                  </div>
                  <p className="text-[11px] text-[#7888a7] mt-0.5">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-[#556382] border border-dashed border-[#161c2b] rounded-lg mb-5">
            Click &quot;Simulate Upgrade Event&quot; or &quot;Simulate Cron Drift&quot; to inspect real-time CRE execution steps.
          </div>
        )}

        {/* Mined Transaction Receipt */}
        {lastTxReceipt && (
          <div className="p-4 rounded-xl bg-[#09121a] border border-emerald-900/60 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-900/40 text-emerald-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>On-Chain Attestation Confirmed (RiskRegistry.sol)</span>
              </span>
              <span className="text-[10px] text-[#7d93a8]">Block #{lastTxReceipt.blockNumber}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#8ea4be]">
              <div>
                <span className="text-[#556b80] block text-[10px]">Transaction Hash:</span>
                <span className="text-white truncate block">{lastTxReceipt.transactionHash}</span>
              </div>
              <div>
                <span className="text-[#556b80] block text-[10px]">CRE Forwarder Sender:</span>
                <span className="text-white truncate block">{lastTxReceipt.creForwarder}</span>
              </div>
              <div>
                <span className="text-[#556b80] block text-[10px]">RiskRegistry Contract:</span>
                <span className="text-white truncate block">{lastTxReceipt.contractAddress}</span>
              </div>
              <div>
                <span className="text-[#556b80] block text-[10px]">Emitted Event:</span>
                <span className="text-emerald-400 font-semibold truncate block">{lastTxReceipt.event}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RiskRegistry.sol Smart Contract Architecture */}
      <div className="rounded-xl border border-[#161d2d] bg-[#090c15] p-4 text-xs font-mono space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold">RiskRegistry.sol Deployment & Access Control</span>
          <span className="text-emerald-400 font-bold">Verified Interface</span>
        </div>

        <div className="p-3 rounded-lg bg-[#070910] border border-[#131824] space-y-1.5 text-[11px] text-[#8595b5]">
          <div className="flex justify-between">
            <span className="text-[#576585]">Deployed Address:</span>
            <span className="text-white">0x5FbDB2315678afecb367f032d93F642f64180aa3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#576585]">Authorized CRE Forwarder:</span>
            <span className="text-blue-400">0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#576585]">Write Guard:</span>
            <span className="text-emerald-400 font-semibold">modifier onlyForwarder()</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#576585]">Public View Method:</span>
            <span className="text-white">getRisk(protocolId) returns (RiskReport)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

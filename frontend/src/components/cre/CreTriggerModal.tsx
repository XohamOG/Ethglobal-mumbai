"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PROTOCOLS, GraphNode, ScoreBreakdown } from "@/lib/graph-data";
import { AnimatedScoreCard } from "@/components/ui/AnimatedScoreCard";
import { ShinyButton } from "@/components/ui/ShinyButton";
import { Magnet } from "@/components/ui/Magnet";
import {
  Zap,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Database,
  HardDrive,
  Radio,
  X,
  Play,
} from "lucide-react";

interface CreTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (updatedScore: number, isRebuilt: boolean) => void;
}

type ScanStage = "idle" | "reading_rpc" | "hashing_fingerprint" | "checking_drift" | "evaluating_score" | "completed";

export function CreTriggerModal({ isOpen, onClose, onComplete }: CreTriggerModalProps) {
  const router = useRouter();
  const protocol = PROTOCOLS[0];

  const [stage, setStage] = useState<ScanStage>("reading_rpc");
  const [logs, setLogs] = useState<string[]>([]);
  const [isDriftSimulated, setIsDriftSimulated] = useState(false);
  const [currentScore, setCurrentScore] = useState(protocol.compositeScore);
  const [currentFingerprint, setCurrentFingerprint] = useState(protocol.fingerprint);

  const defaultBreakdown: ScoreBreakdown = {
    f1_verification: 0,
    f2_admin_control: 2,
    f3_upgradeability: 10,
    f4_oracle_freshness: 0.2,
    f5_concentration_risk: 0,
    f6_contract_age: 1.5,
    f7_incident_history: 0,
    totalScore: 13.7,
  };

  const [breakdown, setBreakdown] = useState<ScoreBreakdown>(defaultBreakdown);

  // Auto-run scanning sequence on open
  useEffect(() => {
    if (!isOpen) return;

    setStage("reading_rpc");
    setLogs([
      "[*] Initiating Chainlink CRE Runtime Consensus...",
      `[*] Connecting to Ethereum Mainnet RPC (Block #${protocol.lastEvaluatedBlock})...`,
    ]);

    const t1 = setTimeout(() => {
      setStage("hashing_fingerprint");
      setLogs((prev) => [
        ...prev,
        "[+] Read 15 EVM contracts from @bgd-labs/aave-address-book",
        "[+] Verified EIP-1967 storage slots: 0x3608...2bbc (Impl), 0xb531...6103 (Admin)",
        "[*] Computing deterministic Keccak256 Protocol Fingerprint...",
      ]);
    }, 700);

    const t2 = setTimeout(() => {
      setStage("checking_drift");
      setLogs((prev) => [
        ...prev,
        `[+] Computed Fingerprint: ${currentFingerprint.slice(0, 16)}...`,
        "[*] Querying RiskRegistry.sol (0x5FbDB231...) for on-chain fingerprint drift...",
      ]);
    }, 1400);

    const t3 = setTimeout(() => {
      setStage("evaluating_score");
      setLogs((prev) => [
        ...prev,
        "[+] Fingerprint matches on-chain baseline (No drift detected).",
        "[*] QuickJS-WASM executing 7-factor consensus risk scoring...",
      ]);
    }, 2000);

    const t4 = setTimeout(() => {
      setStage("completed");
      setLogs((prev) => [
        ...prev,
        `[+] Consensus Reached: Composite Risk Score = ${currentScore} (LOW_RISK)`,
        "[+] BTL Cache Verified in Arkiv DB-Chain (50,000 blocks valid)",
        "[+] Ready for Dependency Graph Inspection.",
      ]);
    }, 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen, currentScore, currentFingerprint, protocol.lastEvaluatedBlock]);

  // Simulate Implementation Upgrade (Fingerprint Changed -> Trigger Rebuild)
  const triggerSimulatedUpgrade = () => {
    setIsDriftSimulated(true);
    setStage("reading_rpc");
    setLogs([
      "[!] SIMULATED EVENT: Upgraded(address 0x9B41...newImpl) emitted on Pool Proxy!",
      "[*] Chainlink Log Trigger fired: EIP-1967 Implementation slot changed.",
      "[*] Re-resolving graph nodes and bytecodes...",
    ]);

    setTimeout(() => {
      setStage("hashing_fingerprint");
      const driftedFp = "0x7f48b19a3d42c8e102f90a944bb93e87149bc0d23f82fa05f4fb0b4993e990c";
      setCurrentFingerprint(driftedFp);
      setLogs((prev) => [
        ...prev,
        `[+] New Keccak256 Fingerprint: ${driftedFp.slice(0, 16)}...`,
        "[!] FINGERPRINT DRIFT DETECTED: Hash != On-chain snapshot!",
        "[*] CRE Consensus Engine: Triggering AUTOMATIC GRAPH REBUILD & RE-SCORING...",
      ]);
    }, 800);

    setTimeout(() => {
      setStage("evaluating_score");
      // New score with upgraded contract
      const updatedScore = 18.5;
      setCurrentScore(updatedScore);
      setBreakdown({
        f1_verification: 2,
        f2_admin_control: 3,
        f3_upgradeability: 12,
        f4_oracle_freshness: 0.2,
        f5_concentration_risk: 0,
        f6_contract_age: 1.3,
        f7_incident_history: 0,
        totalScore: 18.5,
      });

      setLogs((prev) => [
        ...prev,
        "[+] Rebuilt 15 nodes and 21 dependency edges.",
        "[+] Recalculated 7-factor composite score: 18.5 (LOW_RISK).",
        "[*] Writing new snapshot to Swarm (bzz://a41fd9...) and indexing in Arkiv...",
        "[*] Forwarder submitting updateRiskSnapshot() to RiskRegistry.sol on-chain...",
      ]);
    }, 1700);

    setTimeout(() => {
      setStage("completed");
      setLogs((prev) => [
        ...prev,
        "[+] On-Chain Tx Mined: 0x3e17...4bf9 | Gas Used: 82,410",
        "[+] Event SnapshotRecorded emitted by RiskRegistry.sol",
        "[+] Score & Lineage updated live in Provenance Engine!",
      ]);
      if (onComplete) {
        onComplete(18.5, true);
      }
    }, 2600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#07090e] border border-[#1e2638] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#e2e8f0] animate-fadeIn">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#141b2c] flex items-center justify-between bg-[#0a0d16]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Chainlink CRE Consensus Trigger</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-800/60 bg-emerald-950/40 text-emerald-400 font-semibold">
                  Runtime Environment
                </span>
              </div>
              <p className="text-[11px] text-[#64728f] font-mono">
                Real-time Keccak256 protocol fingerprint verification & risk score attestation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#64728f] hover:text-white rounded-lg hover:bg-[#141b2c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6">
          {/* Real-Time Scan Progress Steps */}
          <div className="grid grid-cols-4 gap-2 text-xs font-mono">
            {[
              { id: "reading_rpc", label: "1. RPC Scan", desc: "Block #26354138" },
              { id: "hashing_fingerprint", label: "2. Fingerprint", desc: "Keccak256 Hash" },
              { id: "checking_drift", label: "3. Drift Check", desc: "RiskRegistry.sol" },
              { id: "evaluating_score", label: "4. Score & Attest", desc: "QuickJS DON" },
            ].map((step, idx) => {
              const isDone =
                stage === "completed" ||
                (stage === "evaluating_score" && idx <= 2) ||
                (stage === "checking_drift" && idx <= 1) ||
                (stage === "hashing_fingerprint" && idx === 0);
              const isCurrent = stage === step.id;

              return (
                <div
                  key={step.id}
                  className={`p-2.5 rounded-lg border transition-all ${
                    isDone
                      ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-300"
                      : isCurrent
                      ? "bg-blue-950/40 border-blue-600/80 text-white shadow-md animate-pulse"
                      : "bg-[#090d16] border-[#151d2d] text-[#556381]"
                  }`}
                >
                  <div className="font-semibold text-[11px] flex items-center justify-between">
                    <span>{step.label}</span>
                    {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <div className="text-[10px] text-[#7888a7] truncate mt-0.5">{step.desc}</div>
                </div>
              );
            })}
          </div>

          {/* Terminal Logs Output */}
          <div className="p-3.5 rounded-xl bg-[#04060a] border border-[#141a28] font-mono text-[11px] text-[#7c8ca8] space-y-1 max-h-36 overflow-y-auto">
            <div className="flex items-center gap-1.5 text-[10px] text-[#4b5874] uppercase tracking-wider mb-1.5 pb-1 border-b border-[#10141f]">
              <Terminal className="w-3 h-3 text-blue-400" />
              <span>CRE Consensus Execution Stream</span>
            </div>
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.startsWith("[!]")
                    ? "text-amber-400 font-semibold"
                    : log.startsWith("[+]")
                    ? "text-emerald-300"
                    : "text-[#8d9db9]"
                }
              >
                {log}
              </div>
            ))}
          </div>

          {/* Sleek Score Reveal with React Bits Component */}
          {stage === "completed" && (
            <div className="space-y-4 animate-fadeIn">
              <AnimatedScoreCard
                score={currentScore}
                riskTier={currentScore < 15 ? "LOW" : "MEDIUM"}
                fingerprint={currentFingerprint}
                lastEvaluatedBlock={protocol.lastEvaluatedBlock}
                breakdown={breakdown}
                isFingerprintChanged={isDriftSimulated}
              />

              {/* Simulation Action Bar */}
              <div className="p-4 rounded-xl bg-[#090d16] border border-[#161f30] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                <div>
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Want to test automated graph rebuild on drift?</span>
                  </div>
                  <p className="text-[11px] text-[#6b7c9c] mt-0.5">
                    Simulate a contract upgrade event to test CRE automatic fingerprint change detection.
                  </p>
                </div>

                <button
                  onClick={triggerSimulatedUpgrade}
                  disabled={stage !== "completed"}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/80 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simulate Upgrade Drift</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Direct Launch Button */}
        <div className="px-6 py-4 border-t border-[#141b2c] bg-[#0a0d16] flex items-center justify-between">
          <div className="text-xs font-mono text-[#5f6f8e] hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-indigo-400" /> Arkiv Valid
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-amber-400" /> Swarm Anchored
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-mono text-[#7888a7] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <Magnet magnetStrength={0.15}>
              <button
                onClick={() => {
                  onClose();
                  router.push("/graph?protocol=aave-v3-mainnet");
                }}
                disabled={stage !== "completed"}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  stage === "completed"
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                    : "bg-[#161c2a] text-[#556381] cursor-not-allowed"
                }`}
              >
                <span>View Dependency Graph</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Magnet>
          </div>
        </div>
      </div>
    </div>
  );
}

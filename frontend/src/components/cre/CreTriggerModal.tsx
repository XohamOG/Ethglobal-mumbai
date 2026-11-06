"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PROTOCOLS, ScoreBreakdown } from "@/lib/graph-data";
import { AnimatedScoreCard } from "@/components/ui/AnimatedScoreCard";
import {
  Zap,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Terminal,
  X,
  Cpu,
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
    }, 600);

    const t2 = setTimeout(() => {
      setStage("checking_drift");
      setLogs((prev) => [
        ...prev,
        `[+] Computed Fingerprint: ${currentFingerprint.slice(0, 16)}...`,
        "[*] Querying RiskRegistry.sol for on-chain fingerprint drift...",
      ]);
    }, 1200);

    const t3 = setTimeout(() => {
      setStage("evaluating_score");
      setLogs((prev) => [
        ...prev,
        "[+] Fingerprint matches on-chain baseline (No drift detected).",
        "[*] QuickJS-WASM executing 7-factor consensus risk scoring...",
      ]);
    }, 1800);

    const t4 = setTimeout(() => {
      setStage("completed");
      setLogs((prev) => [
        ...prev,
        `[+] Consensus Reached: Composite Risk Score = ${currentScore} (LOW_RISK)`,
        "[+] Attestation Verified in RiskRegistry.sol",
      ]);
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen, currentScore, currentFingerprint, protocol.lastEvaluatedBlock]);

  // Simulate Implementation Upgrade (Drift)
  const triggerSimulatedUpgrade = () => {
    setIsDriftSimulated(true);
    setStage("reading_rpc");
    setLogs([
      "[!] EVENT: Upgraded(address 0x9B41...newImpl) emitted on Pool Proxy",
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
        "[!] FINGERPRINT DRIFT DETECTED: Hash != On-chain snapshot",
        "[*] CRE Consensus Engine: Triggering graph rebuild & re-scoring...",
      ]);
    }, 700);

    setTimeout(() => {
      setStage("evaluating_score");
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
        "[+] Recalculated composite score: 18.5.",
        "[*] Submitting updateRiskSnapshot() to RiskRegistry.sol on-chain...",
      ]);
    }, 1500);

    setTimeout(() => {
      setStage("completed");
      setLogs((prev) => [
        ...prev,
        "[+] On-Chain Tx Mined: 0x3e17...4bf9 | Gas Used: 82,410",
        "[+] SnapshotRecorded event emitted by RiskRegistry.sol",
      ]);
      if (onComplete) {
        onComplete(18.5, true);
      }
    }, 2300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#101010]/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#080808] border border-[#212121] rounded-[8px] overflow-hidden flex flex-col text-[#f3f3f3]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#212121] flex items-center justify-between bg-[#101010]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-[4px] bg-[#1a1a1a] border border-[#212121] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-[#6f6759]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-normal text-[16px] text-[#f3f3f3] uppercase tracking-wider">
                  Chainlink CRE Attestation
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] border border-[#212121] bg-[#1a1a1a] text-[#9c9c9c] uppercase">
                  Runtime
                </span>
              </div>
              <p className="text-[12px] text-[#9c9c9c] mt-0.5">
                Real-time Keccak256 fingerprint verification & on-chain score consensus
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#9c9c9c] hover:text-[#f3f3f3] rounded-[4px] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Progress Steps */}
          <div className="grid grid-cols-4 gap-2 text-[12px] font-mono">
            {[
              { id: "reading_rpc", label: "1. Scan", desc: "Block #26354138" },
              { id: "hashing_fingerprint", label: "2. Fingerprint", desc: "Keccak256" },
              { id: "checking_drift", label: "3. Drift Check", desc: "RiskRegistry" },
              { id: "evaluating_score", label: "4. Consensus", desc: "QuickJS DON" },
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
                  className={`p-2.5 rounded-[4px] border transition-colors ${
                    isDone
                      ? "bg-[#101010] border-[#474747] text-[#f3f3f3]"
                      : isCurrent
                      ? "bg-[#1a1a1a] border-[#ffffff] text-[#f3f3f3]"
                      : "bg-[#080808] border-[#212121] text-[#9c9c9c]/50"
                  }`}
                >
                  <div className="text-[11px] uppercase tracking-wider flex items-center justify-between">
                    <span>{step.label}</span>
                    {isDone && <CheckCircle2 className="w-3 h-3 text-[#98ff38]" />}
                  </div>
                  <div className="text-[10px] text-[#9c9c9c] truncate mt-0.5">{step.desc}</div>
                </div>
              );
            })}
          </div>

          {/* Terminal Logs Output */}
          <div className="p-3.5 rounded-[4px] bg-[#101010] border border-[#212121] font-mono text-[11px] text-[#9c9c9c] space-y-1 max-h-32 overflow-y-auto">
            <div className="flex items-center gap-1.5 text-[10px] text-[#9c9c9c] uppercase tracking-wider mb-1 pb-1 border-b border-[#212121]">
              <Terminal className="w-3 h-3 text-[#6f6759]" />
              <span>Consensus Stream</span>
            </div>
            {logs.map((log, i) => (
              <div
                key={i}
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

          {/* Score Reveal Card */}
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

              {/* Simulation Drift Button */}
              <div className="p-3.5 rounded-[4px] bg-[#101010] border border-[#212121] flex items-center justify-between gap-3 text-[12px]">
                <div>
                  <div className="text-[#f3f3f3] font-medium uppercase tracking-wider text-[11px]">
                    Test Upgrade Drift Detection
                  </div>
                  <p className="text-[11px] text-[#9c9c9c] mt-0.5">
                    Simulate proxy upgrade event to trigger automatic consensus rebuild.
                  </p>
                </div>

                <button
                  onClick={triggerSimulatedUpgrade}
                  disabled={stage !== "completed"}
                  className="px-3 py-1.5 rounded-[8px] border border-[#474747] hover:border-[#ffffff] bg-transparent text-[#f3f3f3] text-[12px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className="w-3 h-3 text-[#6f6759]" />
                  <span>Simulate Drift</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#212121] bg-[#101010] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] text-[12px] uppercase tracking-wider text-[#9c9c9c] hover:text-[#f3f3f3] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onClose();
              router.push("/graph?protocol=aave-v3-mainnet");
            }}
            disabled={stage !== "completed"}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-[12px] uppercase font-normal tracking-wider transition-colors cursor-pointer ${
              stage === "completed"
                ? "bg-[#ffffff] text-[#101010] hover:bg-[#f3f3f3]"
                : "bg-[#212121] text-[#9c9c9c] cursor-not-allowed"
            }`}
          >
            <span>View Dependency Graph</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { DecryptedText } from "./DecryptedText";
import { ShieldCheck, ShieldAlert, Copy, Check, Radio, HardDrive, Database, Zap, RefreshCw } from "lucide-react";
import { ScoreBreakdown } from "@/lib/graph-data";

interface AnimatedScoreCardProps {
  score: number;
  riskTier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  fingerprint: string;
  lastEvaluatedBlock: number;
  breakdown?: ScoreBreakdown;
  isFingerprintChanged?: boolean;
  onRebuildTrigger?: () => void;
  className?: string;
}

export function AnimatedScoreCard({
  score,
  riskTier,
  fingerprint,
  lastEvaluatedBlock,
  breakdown,
  isFingerprintChanged = false,
  onRebuildTrigger,
  className = "",
}: AnimatedScoreCardProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [copiedFp, setCopiedFp] = useState(false);

  useEffect(() => {
    let start = 0;
    const end = score;
    const duration = 1200; // ms
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(Number(start.toFixed(1)));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  const copyFp = () => {
    navigator.clipboard.writeText(fingerprint);
    setCopiedFp(true);
    setTimeout(() => setCopiedFp(false), 1800);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "LOW":
        return {
          text: "text-emerald-400",
          border: "border-emerald-800/80",
          bg: "bg-emerald-950/40",
          glow: "rgba(16, 185, 129, 0.15)",
        };
      case "MEDIUM":
        return {
          text: "text-amber-400",
          border: "border-amber-800/80",
          bg: "bg-amber-950/40",
          glow: "rgba(245, 158, 11, 0.15)",
        };
      case "HIGH":
      case "CRITICAL":
        return {
          text: "text-rose-400",
          border: "border-rose-800/80",
          bg: "bg-rose-950/40",
          glow: "rgba(244, 63, 94, 0.15)",
        };
      default:
        return {
          text: "text-blue-400",
          border: "border-blue-800/80",
          bg: "bg-blue-950/40",
          glow: "rgba(56, 189, 248, 0.15)",
        };
    }
  };

  const colors = getTierColor(riskTier);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${colors.border} bg-[#080b13]/95 p-6 md:p-8 backdrop-blur-xl shadow-2xl transition-all duration-300 ${className}`}
      style={{
        boxShadow: `0 0 40px -10px ${colors.glow}`,
      }}
    >
      {/* Background ambient radial glow */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl"
        style={{ backgroundColor: colors.glow }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#141b2c]">
        {/* Left: Composite Score Display */}
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center">
            {/* Circular Pulse Ring */}
            <div
              className="absolute -inset-2 rounded-full border border-dashed opacity-50 animate-spin"
              style={{
                borderColor: colors.text.replace("text-", ""),
                animationDuration: "25s",
              }}
            />
            <div className="w-24 h-24 rounded-full bg-[#0d121e] border border-[#1f293d] flex flex-col items-center justify-center shadow-inner">
              <span className={`text-3xl font-black font-mono tracking-tight ${colors.text}`}>
                {displayScore.toFixed(1)}
              </span>
              <span className="text-[9px] font-mono uppercase text-[#61708d] tracking-widest mt-0.5">
                / 100 Risk
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono uppercase tracking-wider text-[#73829f]">
                CRE Evaluated Score
              </span>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${colors.bg} ${colors.border} ${colors.text}`}>
                <DecryptedText text={riskTier} speed={30} maxIterations={8} animateOn="view" /> RISK
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Deterministic Consensus Attestation
            </h3>
            <p className="text-xs font-mono text-[#5f6f8e] mt-0.5">
              Block #{lastEvaluatedBlock} · Calculated by Chainlink QuickJS-WASM
            </p>
          </div>
        </div>

        {/* Right: Protocol Fingerprint Card */}
        <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-2">
          <div className="text-[10px] font-mono text-[#61708d] uppercase tracking-wider">
            Keccak256 Protocol Fingerprint
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0b0e17] border border-[#1a2336] font-mono text-xs text-[#a0afcc]">
            <span className="truncate max-w-[200px]" title={fingerprint}>
              {fingerprint.slice(0, 10)}...{fingerprint.slice(-8)}
            </span>
            <button
              onClick={copyFp}
              className="p-1 rounded text-[#5e6d8a] hover:text-white hover:bg-[#161d2d] transition-colors cursor-pointer"
              title="Copy Fingerprint"
            >
              {copiedFp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isFingerprintChanged && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Fingerprint Drift Detected — Rebuilt</span>
            </div>
          )}
        </div>
      </div>

      {/* 7-Factor Risk Breakdown Bars */}
      {breakdown && (
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-xs font-mono">
          {[
            { key: "f1", label: "F1 Verif", val: breakdown.f1_verification, max: 20 },
            { key: "f2", label: "F2 Admin", val: breakdown.f2_admin_control, max: 20 },
            { key: "f3", label: "F3 Upgrade", val: breakdown.f3_upgradeability, max: 20 },
            { key: "f4", label: "F4 Oracle", val: breakdown.f4_oracle_freshness, max: 15 },
            { key: "f5", label: "F5 Concentr", val: breakdown.f5_concentration_risk, max: 10 },
            { key: "f6", label: "F6 Age", val: breakdown.f6_contract_age, max: 10 },
            { key: "f7", label: "F7 Incident", val: breakdown.f7_incident_history, max: 5 },
          ].map((item) => (
            <div key={item.key} className="p-2.5 rounded-lg bg-[#0c101a] border border-[#182133] space-y-1">
              <div className="text-[10px] text-[#63728f] uppercase truncate">{item.label}</div>
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">{item.val}</span>
                <span className="text-[9px] text-[#424e68]">/{item.max}</span>
              </div>
              <div className="w-full bg-[#131926] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (item.val / item.max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

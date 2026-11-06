"use client";

import React, { useEffect, useState } from "react";
import { DecryptedText } from "./DecryptedText";
import { Copy, Check, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { ScoreBreakdown, getRiskScoreConfig } from "@/lib/graph-data";

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
  className = "",
}: AnimatedScoreCardProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [copiedFp, setCopiedFp] = useState(false);
  const [showFactors, setShowFactors] = useState(false);

  const riskConfig = getRiskScoreConfig(score);

  useEffect(() => {
    let start = 0;
    const end = score;
    const duration = 1000;
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

  return (
    <div
      className={`relative overflow-hidden rounded-[6px] border border-[#282832] bg-[#17171d]/85 backdrop-blur-md p-6 text-[#ececf2] shadow-xl hover:border-[#7d8495]/60 hover:shadow-2xl transition-all duration-300 group ${className}`}
    >
      {/* Subtle glass reflection highlight */}
      <div className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.03)] to-transparent" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: Circular Seal & Composite Score with Dynamic Risk Color */}
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center">
            {/* Circular Seal with Glass Hover and Green/Yellow/Red Ring */}
            <div
              className={`w-20 h-20 rounded-full border ${riskConfig.borderColor} flex flex-col items-center justify-center bg-gradient-to-b from-[#17171d]/90 to-[#0e0e12]/90 backdrop-blur-md ${riskConfig.glow} hover:scale-105 transition-all duration-300 cursor-pointer shadow-inner`}
            >
              <span className={`text-2xl font-bold font-mono tracking-tight ${riskConfig.textColor}`}>
                {displayScore.toFixed(1)}
              </span>
              <span className="text-[8.5px] font-mono uppercase tracking-widest text-[#aaaab8]">
                / 100 Risk
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#aaaab8]">
                CRE Consensus Attestation
              </span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-[2px] border ${riskConfig.borderColor} ${riskConfig.badgeBg} ${riskConfig.badgeText} font-semibold shadow-sm`}
              >
                <DecryptedText text={riskTier} speed={30} maxIterations={8} animateOn="view" /> RISK
              </span>
            </div>
            <h3 className="text-lg font-serif font-bold text-[#ececf2] tracking-tight">
              Deterministic Lineage Score
            </h3>
            <p className="text-[11px] font-mono text-[#aaaab8] mt-0.5">
              Ethereum Block #{lastEvaluatedBlock} · Attested on-chain
            </p>
          </div>
        </div>

        {/* Right: Protocol Fingerprint */}
        <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-1.5">
          <div className="text-[10px] font-mono text-[#aaaab8] uppercase tracking-wider">
            Keccak256 Protocol Fingerprint
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[#0e0e12]/80 backdrop-blur-sm border border-[#282832] font-mono text-xs text-[#d6d8e4]">
            <span className="truncate max-w-[190px]" title={fingerprint}>
              {fingerprint.slice(0, 10)}...{fingerprint.slice(-8)}
            </span>
            <button
              onClick={copyFp}
              className="p-1 rounded-[2px] text-[#aaaab8] hover:text-[#ececf2] hover:bg-[#282832] transition-colors cursor-pointer"
              title="Copy Fingerprint"
            >
              {copiedFp ? <Check className="w-3.5 h-3.5 text-[#b068ff]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isFingerprintChanged && (
            <div className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
              <span>●</span>
              <span>Fingerprint Drift Detected — Rebuilt</span>
            </div>
          )}
        </div>
      </div>

      {/* Expand/Collapse Toggle for Factor Details */}
      {breakdown && (
        <div className="mt-5 pt-4 border-t border-[#282832] flex items-center justify-between">
          <button
            onClick={() => setShowFactors(!showFactors)}
            className="flex items-center gap-1.5 text-xs font-mono text-[#aaaab8] hover:text-[#ececf2] transition-colors cursor-pointer"
          >
            <span>{showFactors ? "Hide Factor Breakdown" : "View Factor Details (7 Metrics)"}</span>
            {showFactors ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Collapsible Factor Breakdown with Glass Hover & Green/Yellow/Red Metrics */}
      {showFactors && breakdown && (
        <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 text-xs font-mono animate-fadeIn">
          {[
            { key: "f1", label: "F1 Verif", val: breakdown.f1_verification, max: 20 },
            { key: "f2", label: "F2 Admin", val: breakdown.f2_admin_control, max: 20 },
            { key: "f3", label: "F3 Upgrade", val: breakdown.f3_upgradeability, max: 20 },
            { key: "f4", label: "F4 Oracle", val: breakdown.f4_oracle_freshness, max: 15 },
            { key: "f5", label: "F5 Concentr", val: breakdown.f5_concentration_risk, max: 10 },
            { key: "f6", label: "F6 Age", val: breakdown.f6_contract_age, max: 10 },
            { key: "f7", label: "F7 Incident", val: breakdown.f7_incident_history, max: 5 },
          ].map((item) => {
            const factorRatio = item.val / item.max;
            const factorTextColor =
              factorRatio <= 0.3
                ? "text-emerald-400"
                : factorRatio <= 0.6
                ? "text-amber-400"
                : "text-rose-400";
            const factorBarColor =
              factorRatio <= 0.3
                ? "bg-emerald-400"
                : factorRatio <= 0.6
                ? "bg-amber-400"
                : "bg-rose-400";

            return (
              <div
                key={item.key}
                className="p-2.5 rounded-[3px] bg-[#0e0e12]/80 backdrop-blur-sm border border-[#282832] hover:border-[#7d8495]/60 hover:bg-[#17171d]/90 transition-all duration-200 space-y-1.5"
              >
                <div className="text-[9.5px] text-[#aaaab8] uppercase truncate">{item.label}</div>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${factorTextColor}`}>{item.val}</span>
                  <span className="text-[9px] text-[#7d8495]">/{item.max}</span>
                </div>
                <div className="w-full bg-[#17171d] h-1.5 rounded-[1px] overflow-hidden">
                  <div
                    className={`h-full ${factorBarColor} rounded-[1px] transition-all duration-300`}
                    style={{ width: `${Math.min(100, factorRatio * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

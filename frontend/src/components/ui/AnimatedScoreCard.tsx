"use client";

import React, { useEffect, useState } from "react";
import { DecryptedText } from "./DecryptedText";
import { Copy, Check, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
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
  className = "",
}: AnimatedScoreCardProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [copiedFp, setCopiedFp] = useState(false);
  const [showFactors, setShowFactors] = useState(false);

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
      className={`relative overflow-hidden rounded-[6px] border border-[#282832] bg-[#17171d] p-6 text-[#ececf2] shadow-xl ${className}`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: Circular Seal & Composite Score */}
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center">
            {/* Spined / Thorned Circular Seal Border */}
            <div className="w-20 h-20 rounded-full border border-[#7d8495]/40 flex flex-col items-center justify-center bg-[#0e0e12] shadow-inner">
              <span className="text-2xl font-bold font-mono tracking-tight text-[#ececf2]">
                {displayScore.toFixed(1)}
              </span>
              <span className="text-[8.5px] font-mono uppercase tracking-widest text-[#aaaab8]">
                / 100 Risk
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#aaaab8]">
                CRE Consensus Attestation
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-[2px] border border-[#282832] bg-[#282832]/60 text-[#d6d8e4] font-semibold">
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[#0e0e12] border border-[#282832] font-mono text-xs text-[#d6d8e4]">
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
            <div className="text-[11px] font-mono text-[#b068ff] flex items-center gap-1">
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
            className="flex items-center gap-1.5 text-xs font-mono text-[#aaaab8] hover:text-[#d6d8e4] transition-colors cursor-pointer"
          >
            <span>{showFactors ? "Hide Factor Breakdown" : "View Factor Details (7 Metrics)"}</span>
            {showFactors ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Collapsible Factor Breakdown (Hidden by Default) */}
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
          ].map((item) => (
            <div key={item.key} className="p-2 rounded-[2px] bg-[#0e0e12] border border-[#282832] space-y-1">
              <div className="text-[9.5px] text-[#aaaab8] uppercase truncate">{item.label}</div>
              <div className="flex items-center justify-between">
                <span className="text-[#ececf2] font-semibold">{item.val}</span>
                <span className="text-[9px] text-[#7d8495]">/{item.max}</span>
              </div>
              <div className="w-full bg-[#17171d] h-1 rounded-[1px] overflow-hidden">
                <div
                  className="h-full bg-[#d6d8e4] rounded-[1px] transition-all duration-300"
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

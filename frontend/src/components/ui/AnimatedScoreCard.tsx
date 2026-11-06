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
      className={`relative overflow-hidden rounded-[8px] border border-[#212121] bg-[#080808] p-5 text-[#f3f3f3] transition-colors ${className}`}
    >
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Left: Composite Score with Hyperstudio Typography */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full border border-[#212121] bg-[#101010] flex items-center justify-center shrink-0">
            <span className="text-[20px] font-mono text-[#f3f3f3]">
              {displayScore}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#98ff38]" />
              <span className="text-[14px] uppercase tracking-wider text-[#f3f3f3]">
                {riskTier} RISK
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#1a1a1a] text-[#9c9c9c] border border-[#212121] font-mono">
                CRE Consensus
              </span>
            </div>
            <p className="text-[12px] text-[#9c9c9c] mt-0.5">
              Verified against Ethereum Mainnet Block #{lastEvaluatedBlock}
            </p>
          </div>
        </div>

        {/* Right: Keccak256 Fingerprint */}
        <div className="flex flex-col items-start md:items-end gap-1.5 w-full md:w-auto">
          <div className="text-[11px] uppercase tracking-wider text-[#9c9c9c]">
            Keccak-256 Fingerprint
          </div>
          <div className="flex items-center gap-2 bg-[#101010] border border-[#212121] px-3 py-1.5 rounded-[4px] font-mono text-[11px] text-[#9c9c9c]">
            <span className="text-[#f3f3f3]">
              {fingerprint.slice(0, 14)}...{fingerprint.slice(-8)}
            </span>
            <button
              onClick={copyFp}
              className="p-1 hover:text-[#f3f3f3] cursor-pointer"
              title="Copy Fingerprint"
            >
              {copiedFp ? (
                <Check className="w-3.5 h-3.5 text-[#98ff38]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 7-Factor Breakdown Toggle */}
      {breakdown && (
        <div className="mt-4 pt-4 border-t border-[#212121]">
          <button
            onClick={() => setShowFactors(!showFactors)}
            className="w-full flex items-center justify-between text-[12px] uppercase tracking-wider text-[#9c9c9c] hover:text-[#f3f3f3] transition-colors cursor-pointer"
          >
            <span>7-Factor Consensus Breakdown</span>
            {showFactors ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showFactors && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono animate-fadeIn">
              <div className="p-2.5 rounded-[4px] bg-[#101010] border border-[#212121]">
                <div className="text-[#9c9c9c]">F1 Verification</div>
                <div className="text-[#f3f3f3] mt-0.5">{breakdown.f1_verification} pts</div>
              </div>
              <div className="p-2.5 rounded-[4px] bg-[#101010] border border-[#212121]">
                <div className="text-[#9c9c9c]">F2 Admin Control</div>
                <div className="text-[#f3f3f3] mt-0.5">{breakdown.f2_admin_control} pts</div>
              </div>
              <div className="p-2.5 rounded-[4px] bg-[#101010] border border-[#212121]">
                <div className="text-[#9c9c9c]">F3 Upgradeability</div>
                <div className="text-[#f3f3f3] mt-0.5">{breakdown.f3_upgradeability} pts</div>
              </div>
              <div className="p-2.5 rounded-[4px] bg-[#101010] border border-[#212121]">
                <div className="text-[#9c9c9c]">F4 Oracle Staleness</div>
                <div className="text-[#f3f3f3] mt-0.5">{breakdown.f4_oracle_freshness} pts</div>
              </div>
              <div className="p-2.5 rounded-[4px] bg-[#101010] border border-[#212121]">
                <div className="text-[#9c9c9c]">F5 Concentration</div>
                <div className="text-[#f3f3f3] mt-0.5">{breakdown.f5_concentration_risk} pts</div>
              </div>
              <div className="p-2.5 rounded-[4px] bg-[#101010] border border-[#212121]">
                <div className="text-[#9c9c9c]">F6 Contract Age</div>
                <div className="text-[#f3f3f3] mt-0.5">{breakdown.f6_contract_age} pts</div>
              </div>
              <div className="p-2.5 rounded-[4px] bg-[#101010] border border-[#212121]">
                <div className="text-[#9c9c9c]">F7 Incident History</div>
                <div className="text-[#f3f3f3] mt-0.5">{breakdown.f7_incident_history} pts</div>
              </div>
              <div className="p-2.5 rounded-[4px] bg-[#101010] border border-[#212121]">
                <div className="text-[#6f6759]">Total Score</div>
                <div className="text-[#98ff38] mt-0.5">{breakdown.totalScore}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

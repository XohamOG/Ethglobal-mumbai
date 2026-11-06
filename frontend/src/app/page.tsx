"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreTriggerModal } from "@/components/cre/CreTriggerModal";
import {
  Search,
  ArrowRight,
  Zap,
  Sliders,
  Compass,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isCreModalOpen, setIsCreModalOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim().toLowerCase();

    if (q.includes("demo") || q.includes("sandbox") || q.includes("chaos")) {
      router.push("/demo");
      return;
    }

    router.push("/graph?protocol=aave-v3-mainnet");
  };

  const handleLaunchAaveGraph = () => {
    router.push("/graph?protocol=aave-v3-mainnet");
  };

  const handleLaunchCreAudit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCreModalOpen(true);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#101010] text-[#f3f3f3] flex flex-col items-center justify-center px-6 sm:px-12 select-none overflow-hidden">
      {/* Center Minimal Workspace — Pure Hyperstudio Specification */}
      <main className="w-full max-w-2xl flex flex-col items-center text-center">
        {/* Title — Aeonik / Inter weight 400 across all sizes */}
        <h1 className="text-[52px] sm:text-[63px] font-normal text-[#f3f3f3] leading-[1.05] tracking-[-0.69px] mb-3">
          macaroom
        </h1>

        {/* Short Description in 3-4 words */}
        <p className="text-[18px] sm:text-[21px] font-normal text-[#9c9c9c] leading-tight tracking-[-0.01em] mb-10">
          DeFi asset provenance intelligence.
        </p>

        {/* Search Field & Interactive Dropdown */}
        <div ref={searchContainerRef} className="w-full relative">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <div
              className={`relative rounded-[8px] border transition-colors bg-[#080808] ${
                isFocused
                  ? "border-[#474747]"
                  : "border-[#212121] hover:border-[#474747]"
              }`}
            >
              <div className="flex items-center px-4 py-3.5">
                <Search className="w-4 h-4 text-[#6f6759] mr-3 shrink-0" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onClick={() => setIsFocused(true)}
                  placeholder="Search protocol name or contract address..."
                  className="w-full bg-transparent border-0 text-[15px] text-[#f3f3f3] placeholder-[#9c9c9c] focus:outline-none font-normal tracking-tight"
                  autoFocus
                />

                {/* White Pill Button — Primary Action */}
                <button
                  type="submit"
                  className="ml-2 px-4 py-1.5 rounded-full bg-[#ffffff] hover:bg-[#f3f3f3] text-[#101010] text-[12px] uppercase font-normal tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <span>Search</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </form>

          {/* Interactive Aave Dropdown Card — Comes Down on Click */}
          {isFocused && (
            <div className="absolute top-full left-0 right-0 mt-3 z-50 bg-[#080808] border border-[#212121] rounded-[8px] p-5 text-left animate-fadeIn">
              {/* Protocol Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#212121]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 text-[#6f6759]" />
                    <h3 className="text-[18px] font-normal text-[#f3f3f3]">
                      Aave V3
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#1a1a1a] text-[#9c9c9c] border border-[#212121] uppercase tracking-wider">
                      Lending Protocol
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#1a1a1a] text-[#9c9c9c] border border-[#212121] uppercase tracking-wider">
                      Ethereum Mainnet
                    </span>
                  </div>
                  <div className="text-[12px] text-[#9c9c9c] font-mono mt-1">
                    Pool Proxy: <span className="text-[#f3f3f3]">0x87870Bca...4fA4E2</span> · Block #26354315
                  </div>
                </div>

                {/* Risk Score Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#101010] border border-[#212121] shrink-0">
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-wider text-[#9c9c9c]">CRE Consensus</div>
                    <div className="text-[12px] text-[#98ff38] flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#98ff38]" />
                      <span>13.7 (LOW RISK)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2-Hop Lineage Flow */}
              <div className="py-4">
                <div className="text-[11px] uppercase tracking-wider text-[#9c9c9c] mb-2.5 flex items-center justify-between">
                  <span>Live 2-Hop Lineage Architecture:</span>
                  <span className="text-[10px] text-[#6f6759]">Auto-reconstructs on EIP-1967 events</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-[4px] bg-[#101010] border border-[#212121]">
                    <div className="text-[10px] uppercase text-[#9c9c9c] tracking-wider mb-0.5">
                      HOP 0 · PROXY
                    </div>
                    <div className="text-[13px] text-[#f3f3f3]">Aave V3 Pool</div>
                    <div className="text-[11px] text-[#9c9c9c] font-mono">0x87870Bca...4E2</div>
                  </div>

                  <div className="p-3 rounded-[4px] bg-[#101010] border border-[#212121]">
                    <div className="text-[10px] uppercase text-[#9c9c9c] tracking-wider mb-0.5">
                      HOP 1 · IMPL
                    </div>
                    <div className="text-[13px] text-[#f3f3f3]">Pool Logic</div>
                    <div className="text-[11px] text-[#9c9c9c] font-mono">0x5FAab9E1...E14</div>
                  </div>

                  <div className="p-3 rounded-[4px] bg-[#101010] border border-[#212121]">
                    <div className="text-[10px] uppercase text-[#9c9c9c] tracking-wider mb-0.5">
                      HOP 2 · ORACLE
                    </div>
                    <div className="text-[13px] text-[#f3f3f3]">Chainlink ETH / USD</div>
                    <div className="text-[11px] text-[#9c9c9c] font-mono">0x5f4eC3Df...b4E</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#212121]">
                <div className="flex items-center gap-2 text-[11px] text-[#9c9c9c]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#98ff38]" />
                  <span>15 EVM Nodes · 21 Edges · Arkiv + Swarm</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push("/demo")}
                    className="px-3 py-1.5 rounded-[8px] border border-[#474747] hover:border-[#ffffff] bg-transparent text-[#f3f3f3] text-[12px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#6f6759]" />
                    <span>Chaos Sandbox</span>
                  </button>

                  <button
                    onClick={handleLaunchCreAudit}
                    className="px-3 py-1.5 rounded-[8px] border border-[#474747] hover:border-[#ffffff] bg-transparent text-[#f3f3f3] text-[12px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#6f6759]" />
                    <span>Audit CRE</span>
                  </button>

                  <button
                    onClick={handleLaunchAaveGraph}
                    className="px-4 py-1.5 rounded-full bg-[#ffffff] hover:bg-[#f3f3f3] text-[#101010] text-[12px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Explore Graph</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CRE Trigger Modal */}
      <CreTriggerModal
        isOpen={isCreModalOpen}
        onClose={() => setIsCreModalOpen(false)}
      />
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreTriggerModal } from "@/components/cre/CreTriggerModal";
import { HyperWavesBackground } from "@/components/ui/HyperWavesBackground";
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

  const handleSelectAave = () => {
    router.push("/graph?protocol=aave-v3-mainnet");
  };

  return (
    <div className="relative min-h-screen w-full bg-[#101010] text-[#f3f3f3] flex flex-col items-center justify-center px-4 sm:px-6 select-none overflow-hidden">
      {/* Full-Bleed 60FPS Interactive Wave & Particle Background */}
      <HyperWavesBackground />

      {/* Main Centered Content */}
      <main className="w-full max-w-3xl flex flex-col items-center text-center relative z-10 py-12">
        {/* Title — Confident 400-weight Editorial Typography */}
        <h1 className="text-[64px] sm:text-[84px] md:text-[96px] font-normal text-[#f3f3f3] leading-none tracking-[-0.04em] mb-4 select-none drop-shadow-sm">
          Macaroon
        </h1>

        {/* Subtitle / Value Proposition */}
        <p className="text-[18px] sm:text-[22px] font-normal text-[#9c9c9c] tracking-[-0.015em] mb-10 select-none max-w-xl">
          Know what your protocol depends on
        </p>

        {/* Centered Search Field & Interactive Dropdown */}
        <div ref={searchContainerRef} className="w-full max-w-2xl relative">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <div
              className={`relative rounded-[8px] border transition-all duration-200 bg-[#080808]/90 backdrop-blur-md shadow-2xl ${
                isFocused
                  ? "border-[#f3f3f3]"
                  : "border-[#212121] hover:border-[#474747]"
              }`}
            >
              <div className="flex items-center px-4 py-3.5 sm:py-4">
                <Search className="w-4 h-4 text-[#6f6759] mr-3 shrink-0" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onClick={() => setIsFocused(true)}
                  placeholder="Search protocol name or contract address..."
                  className="w-full bg-transparent border-0 text-[15px] sm:text-[16px] text-[#f3f3f3] placeholder-[#666666] focus:outline-none font-normal tracking-tight"
                  autoFocus
                />

                {/* White Pill Action Button */}
                <button
                  type="submit"
                  className="ml-2 px-4 sm:px-5 py-2 rounded-full bg-[#ffffff] hover:bg-[#e8e8e8] text-[#101010] text-[12px] uppercase font-normal tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <span>Search</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>

          {/* Quick Discovery Pills Underneath Search Bar */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-[12px] text-[#9c9c9c]">
            <span className="text-[#666666] uppercase tracking-wider text-[11px]">Quick:</span>
            <button
              onClick={() => {
                setSearchQuery("Aave V3");
                setIsFocused(true);
              }}
              className="px-2.5 py-1 rounded-[4px] bg-[#080808]/80 border border-[#212121] hover:border-[#474747] text-[#c1c1c1] hover:text-[#f3f3f3] transition-colors cursor-pointer"
            >
              Aave V3
            </button>
            <button
              onClick={() => {
                setSearchQuery("0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2");
                setIsFocused(true);
              }}
              className="px-2.5 py-1 rounded-[4px] bg-[#080808]/80 border border-[#212121] hover:border-[#474747] text-[#c1c1c1] hover:text-[#f3f3f3] font-mono text-[11px] transition-colors cursor-pointer"
            >
              0x8787...4fA4E2
            </button>
            <button
              onClick={() => router.push("/demo")}
              className="px-2.5 py-1 rounded-[4px] bg-[#080808]/80 border border-[#212121] hover:border-[#474747] text-[#c1c1c1] hover:text-[#f3f3f3] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sliders className="w-3 h-3 text-[#6f6759]" />
              <span>Chaos Sandbox</span>
            </button>
          </div>

          {/* Interactive Aave Dropdown Card — Smoothly Appears on Focus / Click */}
          {isFocused && (
            <div className="absolute top-full left-0 right-0 mt-3 z-50 bg-[#080808] border border-[#212121] rounded-[8px] p-5 text-left animate-fadeIn shadow-2xl">
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-[8px] border border-[#474747] hover:border-[#ffffff] bg-transparent text-[#f3f3f3] text-[12px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#6f6759]" />
                    <span>Audit CRE</span>
                  </button>

                  <button
                    onClick={handleSelectAave}
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

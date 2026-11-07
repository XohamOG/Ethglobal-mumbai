"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HyperWavesBackground } from "@/components/ui/HyperWavesBackground";
import { Search, ArrowRight, Compass } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
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
    router.push("/graph?protocol=aave-v3-mainnet");
  };

  const handleSelectAave = () => {
    router.push("/graph?protocol=aave-v3-mainnet");
  };

  return (
    <div className="relative min-h-screen w-full bg-[#101010] text-[#f3f3f3] flex flex-col items-center justify-center px-4 sm:px-6 select-none overflow-hidden">
      {/* Full-Bleed 60FPS Interactive Wave Background */}
      <HyperWavesBackground />

      {/* Main Centered Content */}
      <main className="w-full max-w-2xl flex flex-col items-center text-center relative z-10 py-12">
        {/* Title */}
        <h1 className="text-[64px] sm:text-[84px] md:text-[96px] font-normal text-[#f3f3f3] leading-none tracking-[-0.04em] mb-4 select-none drop-shadow-sm">
          Macaron
        </h1>

        {/* Subtitle */}
        <p className="text-[18px] sm:text-[22px] font-normal text-[#9c9c9c] tracking-[-0.015em] mb-10 select-none max-w-xl">
          Know what your protocol depends on
        </p>

        {/* Centered Search Field & Clean Explore Graph Dropdown */}
        <div ref={searchContainerRef} className="w-full relative">
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

          {/* Clean Dropdown — Just Aave V3 & Explore Graph, Nothing Else */}
          {isFocused && (
            <div className="absolute top-full left-0 right-0 mt-3 z-50 bg-[#080808] border border-[#212121] rounded-[8px] p-4 flex items-center justify-between animate-fadeIn shadow-2xl">
              <div className="flex items-center gap-3">
                <Compass className="w-4 h-4 text-[#6f6759]" />
                <span className="text-[16px] font-normal text-[#f3f3f3]">
                  Aave V3
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#1a1a1a] text-[#9c9c9c] border border-[#212121] uppercase tracking-wider">
                  Ethereum Mainnet
                </span>
              </div>

              <button
                onClick={handleSelectAave}
                className="px-5 py-2 rounded-full bg-[#ffffff] hover:bg-[#f3f3f3] text-[#101010] text-[12px] uppercase font-normal tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <span>Explore Graph</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

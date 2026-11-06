"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CreTriggerModal } from "@/components/cre/CreTriggerModal";
import FluxLines from "@/components/ui/FluxLines";
import { Search, ArrowRight } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreModalOpen, setIsCreModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim().toLowerCase();

    if (q.includes("demo") || q.includes("sandbox")) {
      router.push("/demo");
      return;
    }

    // Default or Aave search triggers CRE consensus verification
    setIsCreModalOpen(true);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0e0e12] text-[#ececf2] flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      {/* ReactBits Flux Lines Interactive WebGL Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <FluxLines
          colors={["#b068ff", "#9040e0", "#d6d8e4", "#4a237a"]}
          speed={0.7}
          scale={1.1}
          turbulence={0.65}
          fluidity={0.75}
          rimWidth={0.8}
          sharpness={0.75}
          shimmer={0.5}
          glow={1.2}
          lineWidth={1.5}
          mouseInteraction={true}
          mouseStrength={1.2}
          mouseRadius={0.3}
          clickSwirl={true}
          transparent={true}
          backgroundColor="#0e0e12"
          className="w-full h-full opacity-90"
        />
      </div>

      {/* Atmospheric Contrast Overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(14,14,18,0.2)_0%,rgba(14,14,18,0.75)_70%,rgba(14,14,18,0.95)_100%)]" />

      {/* Center Stage: Title, Description & Big Search Bar Only */}
      <main className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center text-center">
        {/* Brand Title: macaroom */}
        <h1 className="text-5xl sm:text-7xl font-serif font-bold tracking-tight mb-3">
          <span className="bg-gradient-to-r from-[#ececf2] via-[#d6d8e4] to-[#b068ff] bg-clip-text text-transparent drop-shadow-[0_2px_30px_rgba(176,104,255,0.35)]">
            macaroom
          </span>
        </h1>

        {/* Short 3-4 Word Description */}
        <p className="text-xs sm:text-sm font-mono text-[#aaaab8] tracking-widest uppercase mb-10">
          Decentralized Protocol Lineage
        </p>

        {/* Big Search Input Field */}
        <form onSubmit={handleSearchSubmit} className="w-full relative group">
          <div
            className={`relative rounded-[6px] transition-all duration-300 p-[1px] ${
              isFocused
                ? "bg-gradient-to-r from-[#b068ff] via-[#d6d8e4] to-[#b068ff] shadow-[0_0_35px_rgba(176,104,255,0.4)]"
                : "bg-[#282832] hover:bg-[#7d8495]/50 hover:shadow-[0_0_20px_rgba(176,104,255,0.2)]"
            }`}
          >
            <div className="relative bg-[#17171d]/90 backdrop-blur-xl rounded-[5px] flex items-center px-4 py-3.5 sm:py-4">
              <Search className="w-5 h-5 text-[#b068ff] shrink-0 mr-3 transition-colors" />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search protocol name or contract address..."
                className="w-full bg-transparent border-0 text-sm sm:text-base text-[#ececf2] placeholder-[#7d8495] focus:outline-none font-mono"
                autoFocus
              />

              <button
                type="submit"
                className="ml-2 p-2 rounded-[3px] bg-[#282832] hover:bg-[#b068ff] text-[#d6d8e4] hover:text-black transition-all cursor-pointer shrink-0 shadow-sm"
                title="Search or Audit"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Subtle Quick Target Pill (Zero Clutter) */}
        <div className="mt-4 flex items-center gap-2 text-xs font-mono text-[#7d8495]">
          <span>Try:</span>
          <button
            onClick={() => {
              setSearchQuery("Aave V3");
              setIsCreModalOpen(true);
            }}
            className="text-[#aaaab8] hover:text-[#b068ff] transition-colors cursor-pointer underline underline-offset-4"
          >
            Aave V3 (0x87870Bca...)
          </button>
          <span>·</span>
          <button
            onClick={() => router.push("/demo")}
            className="text-[#aaaab8] hover:text-[#b068ff] transition-colors cursor-pointer underline underline-offset-4"
          >
            Chaos Sandbox
          </button>
        </div>
      </main>

      {/* Interactive Chainlink CRE Consensus Trigger Modal */}
      <CreTriggerModal
        isOpen={isCreModalOpen}
        onClose={() => setIsCreModalOpen(false)}
      />
    </div>
  );
}

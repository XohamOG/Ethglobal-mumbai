"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreTriggerModal } from "@/components/cre/CreTriggerModal";
import FluxLines from "@/components/ui/FluxLines";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sliders,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreModalOpen, setIsCreModalOpen] = useState(false);
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
    const q = searchQuery.trim().toLowerCase();

    if (q.includes("demo") || q.includes("sandbox") || q.includes("chaos")) {
      router.push("/demo");
      return;
    }

    // Default to Aave V3 Provenance Graph
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
    <div className="relative min-h-screen w-full bg-[#09090e] text-[#ececf2] flex flex-col items-center justify-between overflow-hidden select-none font-sans">
      {/* ReactBits Flux Lines Interactive WebGL Canvas */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <FluxLines
          colors={["#b068ff", "#a855f7", "#d6d8e4", "#7c3aed", "#38bdf8"]}
          speed={0.65}
          scale={1.3}
          turbulence={0.7}
          fluidity={0.15}
          rimWidth={0.3}
          sharpness={1.6}
          shimmer={0.8}
          glow={2.2}
          lineWidth={1.5}
          mouseInteraction={true}
          mouseStrength={1.5}
          mouseRadius={0.4}
          clickSwirl={true}
          transparent={false}
          backgroundColor="#09090e"
          className="w-full h-full"
        />
      </div>

      {/* Atmospheric Soft Vignette (Translucent edges, clear center) */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(9,9,14,0.65)_100%)]" />

      {/* Consistent Minimal Header Bar */}
      <header className="relative z-20 w-full h-14 border-b border-[#282832]/60 px-6 flex items-center justify-between backdrop-blur-md bg-[#09090e]/40 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#b068ff] shadow-[0_0_8px_#b068ff] animate-pulse" />
          <span className="font-mono text-xs font-bold tracking-wider text-[#d6d8e4]">
            macaroom
          </span>
          <span className="text-[#282832]">/</span>
          <span className="font-mono text-[11px] text-[#7d8495] hidden sm:inline">
            DeFi Provenance Intelligence
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/demo"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#17171d]/80 hover:bg-[#b068ff]/15 text-[#ececf2] border border-[#282832] hover:border-[#b068ff]/40 text-xs font-mono transition-all"
            title="Open Chaos Simulation Sandbox"
          >
            <Sliders className="w-3 h-3 text-[#b068ff]" />
            <span className="hidden sm:inline">Chaos Sandbox</span>
          </Link>

          <Link
            href="/graph?protocol=aave-v3-mainnet"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#b068ff]/15 hover:bg-[#b068ff]/25 text-[#ececf2] border border-[#b068ff]/50 text-xs font-mono transition-all shadow-[0_0_12px_rgba(176,104,255,0.2)]"
            title="Inspect Aave V3 Multi-Hop Graph"
          >
            <Layers className="w-3 h-3 text-[#b068ff]" />
            <span>Aave V3 Graph</span>
          </Link>
        </div>
      </header>

      {/* Center Hero: Title, Subtitle & Interactive Search with Dropdown */}
      <main className="relative z-20 w-full max-w-2xl px-6 flex flex-col items-center text-center my-auto py-12">
        {/* Brand Title: macaroom (High-Tech Geometric Sans) */}
        <h1 className="text-6xl sm:text-8xl font-black tracking-[-0.04em] mb-2 leading-none">
          <span className="bg-gradient-to-b from-[#ffffff] via-[#e2e4f0] to-[#b068ff] bg-clip-text text-transparent drop-shadow-[0_4px_35px_rgba(176,104,255,0.45)]">
            macaroom
          </span>
        </h1>

        {/* Short 3-4 Word Futuristic Subtitle */}
        <div className="flex items-center gap-3 mb-10">
          <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#b068ff]/80" />
          <p className="text-xs sm:text-sm font-mono text-[#d6d8e4] tracking-[0.28em] uppercase font-bold">
            Decentralized Protocol Lineage
          </p>
          <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#b068ff]/80" />
        </div>

        {/* Big Search Input Field with Interactive Dropdown Container */}
        <div ref={searchContainerRef} className="w-full relative">
          <form onSubmit={handleSearchSubmit} className="w-full relative group">
            <div
              className={`relative rounded-[6px] transition-all duration-300 p-[1px] ${
                isFocused
                  ? "bg-gradient-to-r from-[#b068ff] via-[#d6d8e4] to-[#b068ff] shadow-[0_0_35px_rgba(176,104,255,0.4)]"
                  : "bg-[#282832] hover:bg-[#7d8495]/60 hover:shadow-[0_0_20px_rgba(176,104,255,0.2)]"
              }`}
            >
              <div className="relative bg-[#13131a]/95 backdrop-blur-2xl rounded-[5px] flex items-center px-4 py-4 sm:py-4.5">
                <Search
                  className={`w-5 h-5 shrink-0 mr-3.5 transition-colors ${
                    isFocused ? "text-[#b068ff]" : "text-[#7d8495]"
                  }`}
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onClick={() => setIsFocused(true)}
                  placeholder="Search protocol or contract address (e.g. Aave V3)..."
                  className="w-full bg-transparent border-0 text-sm sm:text-base text-[#ececf2] placeholder-[#7d8495] focus:outline-none font-mono tracking-tight"
                  autoFocus
                />

                <button
                  type="submit"
                  className="ml-2.5 p-2 rounded-[3px] bg-[#282832] hover:bg-[#b068ff] text-[#d6d8e4] hover:text-black transition-all cursor-pointer shrink-0 shadow-sm"
                  title="Search Lineage"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Interactive Aave Dropdown (Opens on click / focus) */}
          {isFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#13131a]/98 backdrop-blur-2xl border border-[#282832] rounded-[6px] shadow-[0_15px_40px_rgba(0,0,0,0.85)] p-2 animate-fadeIn text-left">
              {/* Header */}
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[#7d8495] flex items-center justify-between border-b border-[#282832]/60 mb-1">
                <span>Detected Protocol Matches</span>
                <span className="text-[#b068ff]">1 Available</span>
              </div>

              {/* Main Match: Aave V3 */}
              <div
                onClick={handleLaunchAaveGraph}
                className="p-3 rounded-[4px] bg-[#17171d]/80 hover:bg-[#282832]/80 border border-[#282832] hover:border-[#b068ff]/60 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[3px] bg-[#b068ff]/20 border border-[#b068ff]/40 flex items-center justify-center text-[#ececf2] font-mono font-bold text-xs group-hover:scale-105 transition-transform">
                      A
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#ececf2] group-hover:text-white transition-colors">
                          Aave V3
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#282832] text-[#d6d8e4] border border-[#7d8495]/40">
                          Ethereum Mainnet
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#aaaab8] mt-0.5">
                        Lending Protocol · 15 Contracts · 2 Provenance Hops
                      </div>
                    </div>
                  </div>

                  {/* Risk Score Seal */}
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 font-bold shadow-sm">
                      Score: 13.7 (LOW)
                    </span>
                    <span className="text-[9px] font-mono text-[#7d8495] mt-1">
                      CRE Consensus
                    </span>
                  </div>
                </div>

                {/* Core Contract Address Snippet */}
                <div className="flex items-center justify-between pt-2 border-t border-[#282832]/60 text-[11px] font-mono">
                  <span className="text-[#7d8495] truncate max-w-[280px]">
                    Pool: <code className="text-[#d6d8e4]">0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2</code>
                  </span>

                  {/* Dual Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLaunchCreAudit}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[#17171d] hover:bg-[#b068ff]/20 text-[#ececf2] border border-[#7d8495]/40 hover:border-[#b068ff] text-[10px] font-mono font-semibold transition-colors cursor-pointer"
                      title="Trigger Real-Time Chainlink CRE Fingerprint Audit"
                    >
                      <Zap className="w-3 h-3 text-[#b068ff]" />
                      <span>Audit CRE</span>
                    </button>

                    <button
                      onClick={handleLaunchAaveGraph}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[#b068ff] hover:bg-[#b068ff]/90 text-black text-[10px] font-mono font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      <span>Explore Graph</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Secondary Quick Action: Chaos Simulation Sandbox */}
              <div
                onClick={() => router.push("/demo")}
                className="mt-1.5 p-2.5 rounded-[4px] bg-[#0e0e12]/60 hover:bg-[#17171d] border border-[#282832] hover:border-[#7d8495]/60 transition-all cursor-pointer flex items-center justify-between text-xs font-mono group"
              >
                <div className="flex items-center gap-2 text-[#aaaab8] group-hover:text-[#ececf2]">
                  <Sliders className="w-3.5 h-3.5 text-[#b068ff]" />
                  <span>Interactive Governance & Oracle Chaos Sandbox</span>
                </div>
                <span className="text-[10px] text-[#7d8495] group-hover:text-[#d6d8e4] flex items-center gap-1">
                  <span>6 Attack Scenarios</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Subtle Quick Target Links */}
        <div className="mt-4 flex items-center gap-2.5 text-xs font-mono text-[#7d8495]">
          <span className="text-[#7d8495]">Direct:</span>
          <button
            onClick={() => {
              setSearchQuery("Aave V3");
              setIsFocused(true);
            }}
            className="text-[#aaaab8] hover:text-[#b068ff] transition-colors cursor-pointer underline underline-offset-4 font-semibold"
          >
            Aave V3
          </button>
          <span>·</span>
          <button
            onClick={() => router.push("/demo")}
            className="text-[#aaaab8] hover:text-[#b068ff] transition-colors cursor-pointer underline underline-offset-4"
          >
            Chaos Sandbox
          </button>
          <span>·</span>
          <button
            onClick={() => setIsCreModalOpen(true)}
            className="text-[#aaaab8] hover:text-[#b068ff] transition-colors cursor-pointer underline underline-offset-4 flex items-center gap-1"
          >
            <Zap className="w-3 h-3 text-[#b068ff]" />
            <span>Trigger CRE</span>
          </button>
        </div>
      </main>

      {/* Consistent Minimal Footer */}
      <footer className="relative z-20 w-full h-11 border-t border-[#282832]/60 px-6 flex items-center justify-between text-[11px] font-mono text-[#7d8495] backdrop-blur-md bg-[#09090e]/40 shrink-0">
        <div className="flex items-center gap-3">
          <span>Arkiv Rabdi DB-Chain</span>
          <span>·</span>
          <span>Swarm Forensic Evidence</span>
          <span>·</span>
          <span>Chainlink CRE</span>
        </div>
        <div className="flex items-center gap-1 text-[#aaaab8]">
          <Sparkles className="w-3 h-3 text-[#b068ff]" />
          <span>ETHGlobal Mumbai 2026</span>
        </div>
      </footer>

      {/* Interactive Chainlink CRE Consensus Trigger Modal */}
      <CreTriggerModal
        isOpen={isCreModalOpen}
        onClose={() => setIsCreModalOpen(false)}
      />
    </div>
  );
}

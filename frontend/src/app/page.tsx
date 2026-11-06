"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PROTOCOLS } from "@/lib/graph-data";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { ShinyButton } from "@/components/ui/ShinyButton";
import { Search, Shield, ArrowUpRight, Database, GitFork, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = PROTOCOLS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen flex flex-col justify-between max-w-5xl mx-auto px-6 py-12">
      {/* Top Navbar */}
      <header className="flex items-center justify-between pb-8 border-b border-[#1b1f2b]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#141822] border border-[#272e40] flex items-center justify-center font-mono font-bold text-sm text-white">
            P
          </div>
          <span className="font-semibold text-white tracking-tight">DeFi Provenance Graph</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#8890a6]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Arkiv Rabdi Testnet
          </span>
          <span className="text-[#2c3345]">/</span>
          <span>ETHGlobal Mumbai</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#23293a] bg-[#10131b] text-xs text-[#9aa4be] mb-6">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>Verifiable Multi-Hop Protocol Provenance</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-4">
          DeFi Dependency & Risk Intelligence
        </h1>
        <p className="text-sm text-[#8a94ac] leading-relaxed mb-8">
          Audit smart contract dependencies up to 2 hops. Proxy implementations, governance timelocks,
          Safe signers, and Chainlink oracles verified on Arkiv and Swarm.
        </p>

        {/* Search Input */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#5f6880]" />
          <input
            type="text"
            placeholder="Search protocol (e.g. Aave V3, Uniswap, Chainlink)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#10121a] border border-[#222736] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-[#50586e] focus:outline-none focus:border-[#3b4460] transition-colors"
          />
        </div>
      </section>

      {/* Protocol Selection Cards */}
      <section className="pb-16">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-widest text-[#66708a] font-mono">Registered Protocols</span>
          <span className="text-xs text-[#50586e] font-mono">{filtered.length} Indexed in Arkiv</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map((protocol) => (
            <SpotlightCard key={protocol.protocolId} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-white text-base">{protocol.name}</h3>
                    <span className="text-xs text-[#6e7790] font-mono">{protocol.category} · v{protocol.version}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded border border-emerald-900/60 bg-emerald-950/40 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    Score {protocol.compositeScore}
                  </span>
                </div>

                <p className="text-xs text-[#828c9f] mb-6 leading-relaxed line-clamp-2">
                  {protocol.description}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-[#606a80] font-mono pb-4 border-b border-[#1b1f2b] mb-4">
                  <span>{protocol.nodeCount} Contract Nodes</span>
                  <span>Hop 0, 1 & 2</span>
                </div>

                <Link href={`/graph?protocol=${protocol.protocolId}`} className="block">
                  <ShinyButton className="w-full justify-between" variant="primary">
                    <span>Inspect Dependency Graph</span>
                    <ArrowUpRight className="w-4 h-4 text-[#8a94ac]" />
                  </ShinyButton>
                </Link>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* Footer Info */}
      <footer className="pt-8 border-t border-[#181c26] flex flex-col sm:flex-row items-center justify-between text-xs text-[#5f6880] gap-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5" /> Arkiv DB-Chain
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="w-3.5 h-3.5" /> Swarm Blob Evidence
          </span>
        </div>
        <span>ETHGlobal Mumbai 2026 · XohamOG, vedaXD, Ishapalkar</span>
      </footer>
    </main>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PROTOCOLS } from "@/lib/graph-data";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { ShinyButton } from "@/components/ui/ShinyButton";
import { Magnet } from "@/components/ui/Magnet";
import { DecryptedText } from "@/components/ui/DecryptedText";
import {
  Search,
  ArrowUpRight,
  Database,
  Radio,
  CheckCircle2,
  GitFork,
  Terminal,
  Shield,
} from "lucide-react";

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = PROTOCOLS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen flex flex-col justify-between max-w-5xl mx-auto px-6 py-10 selection:bg-blue-500/20 selection:text-blue-300">
      {/* Top Navbar */}
      <header className="flex items-center justify-between pb-6 border-b border-[#141824]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0d1018] border border-[#20273a] flex items-center justify-center font-mono font-bold text-xs text-blue-400">
            DPG
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white tracking-tight text-sm">
              DeFi Provenance Graph
            </span>
            <span className="text-[10px] font-mono text-[#54607b]">
              Decentralized Risk & Provenance Registry
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-[#74829f]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0d1018] border border-[#1b2234]">
            <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
            <span>Rabdi #7794095</span>
          </div>
          <span className="text-[#20273a]">/</span>
          <span>ETHGlobal Mumbai</span>
        </div>
      </header>

      {/* Clean Hero */}
      <section className="py-14 text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1c2336] bg-[#0c0f18] text-xs font-mono text-[#8b99b5] mb-5">
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <span>Neo4j Topology · Arkiv DB-Chain · Swarm Evidence</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-3">
          <DecryptedText text="Multi-Hop Asset Provenance" speed={35} maxIterations={10} animateOn="view" />
        </h1>
        <p className="text-xs text-[#7c8aa6] leading-relaxed mb-6 font-mono">
          Audit smart contract dependencies up to 2 hops. Proxy implementations, governance timelocks,
          Safe signers, and Chainlink oracles verified on Arkiv and Swarm.
        </p>

        {/* Minimal Search Input */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#4f5c78]" />
          <input
            type="text"
            placeholder="Filter protocol (Aave V3, Chainlink, Uniswap)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0f18] border border-[#1d2436] rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-[#4b5773] focus:outline-none focus:border-[#384462] font-mono transition-colors"
          />
        </div>
      </section>

      {/* Protocols Grid */}
      <section className="pb-12">
        <div className="flex items-center justify-between mb-3 text-xs font-mono text-[#54607b]">
          <span className="uppercase tracking-widest text-[10px]">Registered Protocols</span>
          <span>{filtered.length} Indexed in Arkiv</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map((protocol) => (
            <SpotlightCard key={protocol.protocolId} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-white text-sm">{protocol.name}</h3>
                    <span className="text-[11px] text-[#63708d] font-mono">
                      {protocol.category} · v{protocol.version}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-900/60 bg-emerald-950/40 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Score {protocol.compositeScore}
                  </span>
                </div>

                <div className="space-y-1.5 py-3 border-y border-[#171c2b] text-[11px] font-mono text-[#74829f] mb-4">
                  <div className="flex justify-between">
                    <span className="text-[#505c77]">Graph Topology:</span>
                    <span className="text-white">{protocol.nodeCount} Contracts (2 Hops)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#505c77]">Last Evaluation:</span>
                    <span className="text-white">Block #{protocol.lastEvaluatedBlock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#505c77]">Storage Layer:</span>
                    <span className="text-blue-400">Arkiv BTL + Swarm</span>
                  </div>
                </div>
              </div>

              <Link href={`/graph?protocol=${protocol.protocolId}`} className="block">
                <Magnet magnetStrength={0.2} className="w-full">
                  <ShinyButton className="w-full justify-between text-xs py-2" variant="primary">
                    <span>Inspect Neo4j Graph</span>
                    <ArrowUpRight className="w-4 h-4 text-[#7b89a6]" />
                  </ShinyButton>
                </Magnet>
              </Link>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="pt-6 border-t border-[#141824] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#54607b] font-mono gap-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-400" /> Arkiv Rabdi DB-Chain
          </span>
          <span className="flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-amber-400" /> Swarm Forensic Blobs
          </span>
        </div>
        <span>DeFi Provenance Graph · ETHGlobal Mumbai</span>
      </footer>
    </main>
  );
}

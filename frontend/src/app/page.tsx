"use client";

import React, { useState } from "react";
import { PROTOCOLS } from "@/lib/graph-data";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { ShinyButton } from "@/components/ui/ShinyButton";
import { Magnet } from "@/components/ui/Magnet";
import { DecryptedText } from "@/components/ui/DecryptedText";
import { CreTriggerModal } from "@/components/cre/CreTriggerModal";
import {
  Search,
  ArrowRight,
  Database,
  Radio,
  CheckCircle2,
  HardDrive,
  Zap,
  ShieldCheck,
  Share2,
  HelpCircle,
  Terminal,
  FileCode,
} from "lucide-react";

export default function HomePage() {
  const protocol = PROTOCOLS[0];
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreModalOpen, setIsCreModalOpen] = useState(false);

  // Address matches for Aave contracts
  const aaveAddresses = [
    "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2", // Pool Proxy
    "0x2f39d218133afab8f2b819b1066c7f434ad94e9e", // PoolAddressesProvider
    "0x64b761d848206f447fe2dd461b0c635ec39ebb27", // Configurator
    "0x54586be62e3c3580375ae3723c145253060ca0c2", // Oracle
  ];

  const q = searchQuery.trim().toLowerCase();
  const isMatch =
    q === "" ||
    "aave".includes(q) ||
    "aave v3".includes(q) ||
    "lending".includes(q) ||
    aaveAddresses.some((addr) => addr.includes(q) || q.includes(addr));

  const matchedContractLabel =
    q.startsWith("0x8787")
      ? "Matched: Pool Proxy (0x87870Bca...)"
      : q.startsWith("0x2f39")
      ? "Matched: PoolAddressesProvider (0x2f39D218...)"
      : q.startsWith("0x64b7")
      ? "Matched: PoolConfigurator (0x64b761D8...)"
      : q.startsWith("0x5458")
      ? "Matched: AaveOracle (0x54586bE6...)"
      : null;

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
            <span>Arkiv Rabdi #7794095</span>
          </div>
          <span className="text-[#20273a]">/</span>
          <span>ETHGlobal Mumbai</span>
        </div>
      </header>

      {/* Hero & How It Works Briefly */}
      <section className="py-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1c2336] bg-[#0c0f18] text-xs font-mono text-[#8b99b5] mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Ethereum Mainnet · Chainlink CRE · Arkiv DB-Chain · Swarm</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-3">
          <DecryptedText text="DeFi Provenance Graph" speed={30} maxIterations={8} animateOn="view" />
        </h1>
        <p className="text-xs sm:text-sm text-[#7c8aa6] leading-relaxed mb-8 font-mono">
          Autonomous multi-hop asset provenance engine. Inspect smart contract dependency trees up to 2 hops,
          verify on-chain attestations with Chainlink CRE, and audit persistent topologies on Arkiv and Swarm.
        </p>

        {/* How It Works Briefly - 3 Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left font-mono text-xs mb-8">
          <div className="p-3.5 rounded-xl bg-[#090d16] border border-[#161f30] space-y-1.5">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-[11px]">
              <Share2 className="w-3.5 h-3.5" />
              <span>1. Lineage Ingestion</span>
            </div>
            <p className="text-[11px] text-[#6b7b99] leading-relaxed">
              Crawls 2 hops: EIP-1967 proxy implementations, timelocks, Gnosis Safe signers, and Chainlink oracles.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#090d16] border border-[#161f30] space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
              <Zap className="w-3.5 h-3.5" />
              <span>2. CRE Attestation</span>
            </div>
            <p className="text-[11px] text-[#6b7b99] leading-relaxed">
              Chainlink DON executes 7-factor deterministic risk scoring and attests hashes to RiskRegistry.sol.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#090d16] border border-[#161f30] space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-[11px]">
              <Database className="w-3.5 h-3.5" />
              <span>3. Decentralized DB</span>
            </div>
            <p className="text-[11px] text-[#6b7b99] leading-relaxed">
              Indexes structured graph nodes in Arkiv (50k blocks BTL) and raw audit snapshots in Swarm blobs.
            </p>
          </div>
        </div>

        {/* Protocol Search / Contract Address Input */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#4f5c78]" />
          <input
            type="text"
            placeholder="Search protocol (Aave V3) or contract address (0x87870Bca...)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0c1018] border border-[#1d263b] rounded-xl pl-10 pr-24 py-2.5 text-xs text-white placeholder-[#4b5875] focus:outline-none focus:border-blue-500 font-mono transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 px-2 py-0.5 rounded text-[10px] font-mono text-[#62718e] hover:text-white bg-[#141b2c]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search Helper Feedback */}
        <div className="mt-2 text-[11px] font-mono text-[#5b6a86]">
          {matchedContractLabel ? (
            <span className="text-emerald-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {matchedContractLabel}
            </span>
          ) : isMatch ? (
            <span>Currently indexing: <span className="text-white font-medium">Aave V3 Mainnet</span> (Click card below to audit)</span>
          ) : (
            <div className="flex items-center justify-center gap-2 text-amber-400">
              <span>Only Aave V3 is currently indexed on Rabdi.</span>
              <button
                onClick={() => setSearchQuery("Aave V3")}
                className="underline hover:text-white cursor-pointer"
              >
                Set to Aave V3
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Active Protocol Card (Clicking launches CRE Trigger) */}
      <section className="mb-10">
        {isMatch && (
          <SpotlightCard className="p-6 md:p-8 border-[#1a2133] bg-[#080b13]/90 hover:border-blue-500/50 transition-all cursor-pointer">
            <div
              onClick={() => setIsCreModalOpen(true)}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#141b2c]"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h2 className="text-xl font-bold text-white tracking-tight">{protocol.name}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-800/60 bg-blue-950/40 text-blue-400">
                    {protocol.category}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800 bg-slate-900 text-[#71809e]">
                    {protocol.chainName}
                  </span>
                </div>
                <div className="text-xs font-mono text-[#5f6f8e] flex items-center gap-2 flex-wrap">
                  <span>Pool Proxy:</span>
                  <code className="text-white font-semibold">0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2</code>
                  <span>·</span>
                  <span>Block #{protocol.lastEvaluatedBlock}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-emerald-900/60 bg-emerald-950/40 text-xs font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#7f8da8] uppercase">Composite Risk</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {protocol.compositeScore} / 100 ({protocol.riskTier})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div
              onClick={() => setIsCreModalOpen(true)}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6 border-b border-[#141b2c] font-mono text-xs"
            >
              <div className="p-3 rounded-lg bg-[#0b0e18] border border-[#161d2d]">
                <div className="text-[10px] text-[#556382] mb-1 uppercase">Graph Size</div>
                <div className="text-white font-semibold text-sm">{protocol.nodeCount} Contracts</div>
                <div className="text-[10px] text-[#7684a2] mt-0.5">{protocol.edgeCount} Directed Edges</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0b0e18] border border-[#161d2d]">
                <div className="text-[10px] text-[#556382] mb-1 uppercase">Arkiv Storage</div>
                <div className="text-indigo-400 font-semibold text-sm">3 Schemas</div>
                <div className="text-[10px] text-[#7684a2] mt-0.5">50,000 Blocks BTL</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0b0e18] border border-[#161d2d]">
                <div className="text-[10px] text-[#556382] mb-1 uppercase">Swarm Evidence</div>
                <div className="text-amber-400 font-semibold text-sm">4 Raw Blobs</div>
                <div className="text-[10px] text-[#7684a2] mt-0.5">BZZ Immutable Anchors</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0b0e18] border border-[#161d2d]">
                <div className="text-[10px] text-[#556382] mb-1 uppercase">CRE Trigger</div>
                <div className="text-emerald-400 font-semibold text-sm">Fingerprint Check</div>
                <div className="text-[10px] text-[#7684a2] mt-0.5">Auto-Rebuild on Drift</div>
              </div>
            </div>

            {/* Launch Action */}
            <div className="pt-6 flex items-center justify-between">
              <div className="text-xs font-mono text-[#5f6f8e] flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Clicking will trigger Chainlink CRE fingerprint verification</span>
              </div>

              <Magnet magnetStrength={0.15}>
                <button
                  onClick={() => setIsCreModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold transition-all cursor-pointer shadow-lg shadow-blue-600/30"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Audit Aave V3 & Trigger CRE Check</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Magnet>
            </div>
          </SpotlightCard>
        )}
      </section>

      {/* Clean Footer */}
      <footer className="pt-6 border-t border-[#141824] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#54607b] font-mono gap-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-400" /> Arkiv Rabdi DB-Chain
          </span>
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Swarm Forensic Evidence
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" /> Chainlink CRE
          </span>
        </div>
        <span>ETHGlobal Mumbai · 100% Decentralized Persistence</span>
      </footer>

      {/* Interactive CRE Trigger Modal */}
      <CreTriggerModal
        isOpen={isCreModalOpen}
        onClose={() => setIsCreModalOpen(false)}
      />
    </main>
  );
}

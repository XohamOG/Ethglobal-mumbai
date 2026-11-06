"use client";

import React, { useState } from "react";
import { PROTOCOLS } from "@/lib/graph-data";
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
    <main className="min-h-screen flex flex-col justify-between max-w-5xl mx-auto px-6 py-10 bg-[#0e0e12] text-[#ececf2]">
      {/* Top Navbar */}
      <header className="flex items-center justify-between pb-6 border-b border-[#282832]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[2px] bg-[#17171d] border border-[#282832] flex items-center justify-center font-mono font-bold text-xs text-[#d6d8e4]">
            DPG
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-[#ececf2] text-sm tracking-tight">
              DeFi Provenance Graph
            </span>
            <span className="text-[10px] font-mono text-[#aaaab8]">
              Asset Lineage & Verification Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-[#aaaab8]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#17171d] border border-[#282832]">
            <Radio className="w-2.5 h-2.5 text-[#b068ff]" />
            <span>Rabdi #7794095</span>
          </div>
          <span className="text-[#282832]">/</span>
          <span>ETHGlobal Mumbai</span>
        </div>
      </header>

      {/* Hero & How It Works Briefly */}
      <section className="py-12 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[2px] border border-[#282832] bg-[#17171d] text-xs font-mono text-[#aaaab8] mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d6d8e4]"></span>
          <span>Ethereum Mainnet · Chainlink CRE · Arkiv · Swarm</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#ececf2] tracking-tight mb-4">
          DeFi Provenance Graph
        </h1>
        <p className="text-sm text-[#aaaab8] leading-relaxed mb-8">
          Autonomous multi-hop asset provenance engine. Inspect smart contract dependency trees up to 2 hops,
          verify on-chain attestations with Chainlink CRE, and audit persistent topologies on Arkiv and Swarm.
        </p>

        {/* How It Works Briefly - 3 Pillars (Cyber Sigilism Card Layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left font-mono text-xs mb-8">
          <div className="p-4 rounded-[4px] bg-[#17171d] border border-[#282832] space-y-1.5">
            <div className="flex items-center gap-2 text-[#d6d8e4] font-semibold text-[11px]">
              <Share2 className="w-3.5 h-3.5" />
              <span>1. Lineage Ingestion</span>
            </div>
            <p className="text-[11px] text-[#aaaab8] leading-relaxed">
              Crawls 2 hops: EIP-1967 proxy implementations, timelocks, Gnosis Safe signers, and Chainlink oracles.
            </p>
          </div>

          <div className="p-4 rounded-[4px] bg-[#17171d] border border-[#282832] space-y-1.5">
            <div className="flex items-center gap-2 text-[#d6d8e4] font-semibold text-[11px]">
              <Zap className="w-3.5 h-3.5" />
              <span>2. CRE Attestation</span>
            </div>
            <p className="text-[11px] text-[#aaaab8] leading-relaxed">
              Chainlink DON executes 7-factor deterministic risk scoring and attests hashes to RiskRegistry.sol.
            </p>
          </div>

          <div className="p-4 rounded-[4px] bg-[#17171d] border border-[#282832] space-y-1.5">
            <div className="flex items-center gap-2 text-[#d6d8e4] font-semibold text-[11px]">
              <Database className="w-3.5 h-3.5" />
              <span>3. Decentralized DB</span>
            </div>
            <p className="text-[11px] text-[#aaaab8] leading-relaxed">
              Indexes structured graph nodes in Arkiv (50k blocks BTL) and raw audit snapshots in Swarm blobs.
            </p>
          </div>
        </div>

        {/* Protocol Search / Contract Address Input */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#7d8495]" />
          <input
            type="text"
            placeholder="Search protocol (Aave V3) or contract address (0x87870Bca...)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#17171d] border border-[#282832] rounded-[4px] pl-10 pr-24 py-2.5 text-xs text-[#ececf2] placeholder-[#7d8495] focus:outline-none focus:border-[#d6d8e4] font-mono transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 px-2 py-0.5 rounded-[2px] text-[10px] font-mono text-[#aaaab8] hover:text-[#ececf2] bg-[#282832]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search Feedback */}
        <div className="mt-2 text-[11px] font-mono text-[#aaaab8]">
          {matchedContractLabel ? (
            <span className="text-[#ececf2] flex items-center justify-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#b068ff]" />
              {matchedContractLabel}
            </span>
          ) : isMatch ? (
            <span>Target: <span className="text-[#ececf2] font-medium">Aave V3 Mainnet</span> (Click card below to audit)</span>
          ) : (
            <div className="flex items-center justify-center gap-2 text-[#b068ff]">
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

      {/* Main Active Protocol Card */}
      <section className="mb-10">
        {isMatch && (
          <div
            onClick={() => setIsCreModalOpen(true)}
            className="rounded-[6px] border border-[#282832] bg-[#17171d] hover:border-[#7d8495] transition-all p-6 md:p-8 cursor-pointer"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#282832]">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h2 className="text-xl font-serif font-bold text-[#ececf2] tracking-tight">{protocol.name}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] border border-[#282832] bg-[#282832]/60 text-[#d6d8e4]">
                    {protocol.category}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] border border-[#282832] bg-[#0e0e12] text-[#aaaab8]">
                    {protocol.chainName}
                  </span>
                </div>
                <div className="text-xs font-mono text-[#aaaab8] flex items-center gap-2 flex-wrap">
                  <span>Pool Proxy:</span>
                  <code className="text-[#ececf2] font-semibold">0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2</code>
                  <span>·</span>
                  <span>Block #{protocol.lastEvaluatedBlock}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-[4px] border border-[#282832] bg-[#0e0e12] text-xs font-mono">
                  <ShieldCheck className="w-4 h-4 text-[#d6d8e4]" />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-[#aaaab8] uppercase">Composite Risk</span>
                    <span className="text-[#ececf2] font-bold text-sm">
                      {protocol.compositeScore} / 100 ({protocol.riskTier})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6 border-b border-[#282832] font-mono text-xs">
              <div className="p-3 rounded-[2px] bg-[#0e0e12] border border-[#282832]">
                <div className="text-[10px] text-[#aaaab8] mb-1 uppercase">Graph Size</div>
                <div className="text-[#ececf2] font-semibold text-sm">{protocol.nodeCount} Contracts</div>
                <div className="text-[10px] text-[#7d8495] mt-0.5">{protocol.edgeCount} Directed Edges</div>
              </div>

              <div className="p-3 rounded-[2px] bg-[#0e0e12] border border-[#282832]">
                <div className="text-[10px] text-[#aaaab8] mb-1 uppercase">Arkiv Storage</div>
                <div className="text-[#d6d8e4] font-semibold text-sm">3 Schemas</div>
                <div className="text-[10px] text-[#7d8495] mt-0.5">50,000 Blocks BTL</div>
              </div>

              <div className="p-3 rounded-[2px] bg-[#0e0e12] border border-[#282832]">
                <div className="text-[10px] text-[#aaaab8] mb-1 uppercase">Swarm Evidence</div>
                <div className="text-[#d6d8e4] font-semibold text-sm">4 Raw Blobs</div>
                <div className="text-[10px] text-[#7d8495] mt-0.5">BZZ Immutable Anchors</div>
              </div>

              <div className="p-3 rounded-[2px] bg-[#0e0e12] border border-[#282832]">
                <div className="text-[10px] text-[#aaaab8] mb-1 uppercase">CRE Trigger</div>
                <div className="text-[#d6d8e4] font-semibold text-sm">Fingerprint Check</div>
                <div className="text-[10px] text-[#7d8495] mt-0.5">Auto-Rebuild on Drift</div>
              </div>
            </div>

            {/* Launch Action */}
            <div className="pt-6 flex items-center justify-between">
              <div className="text-xs font-mono text-[#aaaab8] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#d6d8e4]"></span>
                <span>Clicking initiates Chainlink CRE fingerprint verification</span>
              </div>

              <button
                onClick={() => setIsCreModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[2px] bg-[#d6d8e4] hover:bg-[#ececf2] text-[#000000] text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-[#000000]" />
                <span>Audit Aave V3 & Trigger CRE Check</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Clean Footer */}
      <footer className="pt-6 border-t border-[#282832] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#aaaab8] font-mono gap-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#d6d8e4]" /> Arkiv Rabdi DB-Chain
          </span>
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-[#d6d8e4]" /> Swarm Forensic Evidence
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#d6d8e4]" /> Chainlink CRE
          </span>
        </div>
        <span>ETHGlobal Mumbai</span>
      </footer>

      {/* Interactive CRE Trigger Modal */}
      <CreTriggerModal
        isOpen={isCreModalOpen}
        onClose={() => setIsCreModalOpen(false)}
      />
    </main>
  );
}

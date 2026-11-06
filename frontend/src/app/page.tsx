"use client";

import React, { useState } from "react";
import { PROTOCOLS } from "@/lib/graph-data";
import { CreTriggerModal } from "@/components/cre/CreTriggerModal";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { DecryptedText } from "@/components/ui/DecryptedText";
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
  GitBranch,
  Layers,
  Sparkles,
  Lock,
  Compass,
} from "lucide-react";

export default function HomePage() {
  const protocol = PROTOCOLS[0];
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreModalOpen, setIsCreModalOpen] = useState(false);

  // Address matches for Aave contracts
  const aaveAddresses = [
    { label: "Pool Proxy", address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", hop: 0 },
    { label: "PoolAddressesProvider", address: "0x2f39D218133AFAb8F2b819B1066C7f434aD94e9e", hop: 0 },
    { label: "PoolConfigurator", address: "0x64b761D848206f447Fe2dd461b0c635Ec39EbB27", hop: 1 },
    { label: "AaveOracle", address: "0x54586bE6333240e3ef4a78248c410Bf33060Ca0C2", hop: 1 },
  ];

  const q = searchQuery.trim().toLowerCase();
  const isMatch =
    q === "" ||
    "aave".includes(q) ||
    "aave v3".includes(q) ||
    "lending".includes(q) ||
    aaveAddresses.some((a) => a.address.toLowerCase().includes(q) || q.includes(a.address.toLowerCase()));

  const matchedContract = aaveAddresses.find(
    (a) => a.address.toLowerCase().includes(q) || q.includes(a.address.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-[#0e0e12] text-[#ececf2] overflow-x-hidden selection:bg-[#b068ff]/30 selection:text-[#ececf2]">
      {/* Cyber Sigilism Ambient Background Atmosphere */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Top Radial Violet Aura */}
        <div className="absolute -top-[180px] left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-[radial-gradient(ellipse_at_center,rgba(176,104,255,0.18),rgba(14,14,18,0)_70%)] blur-2xl" />
        
        {/* Subtle Chrome Floor Glow */}
        <div className="absolute top-[320px] -right-[120px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(214,216,228,0.06),transparent_65%)] blur-3xl" />
        <div className="absolute top-[540px] -left-[140px] w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(176,104,255,0.08),transparent_65%)] blur-3xl" />

        {/* Delicate Cybernetic Dot Grid */}
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: "radial-gradient(rgba(176, 104, 255, 0.25) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, #000 60%, transparent 100%)",
          }}
        />

        {/* Decorative Cyber Sigil Radial Line Art (Centered Background Seal) */}
        <svg
          className="absolute left-1/2 top-14 -translate-x-1/2 w-[680px] h-[680px] opacity-[0.07] stroke-[#b068ff] pointer-events-none animate-spin-slow"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Concentric Rings */}
          <circle cx="300" cy="300" r="280" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="300" cy="300" r="240" strokeWidth="1.2" />
          <circle cx="300" cy="300" r="190" strokeWidth="0.8" strokeDasharray="3 9" />
          <circle cx="300" cy="300" r="140" strokeWidth="1" />
          <circle cx="300" cy="300" r="80" strokeWidth="1.5" />
          {/* Spined Crosshairs & Rays */}
          <line x1="20" y1="300" x2="580" y2="300" strokeWidth="1" />
          <line x1="300" y1="20" x2="300" y2="580" strokeWidth="1" />
          <line x1="102" y1="102" x2="498" y2="498" strokeWidth="0.8" strokeDasharray="4 8" />
          <line x1="498" y1="102" x2="102" y2="498" strokeWidth="0.8" strokeDasharray="4 8" />
          {/* Diamond Sigil Points */}
          <polygon points="300,60 320,100 300,140 280,100" strokeWidth="1" />
          <polygon points="300,460 320,500 300,540 280,500" strokeWidth="1" />
          <polygon points="60,300 100,320 140,300 100,280" strokeWidth="1" />
          <polygon points="460,300 500,320 540,300 500,280" strokeWidth="1" />
        </svg>
      </div>

      {/* Main Page Layout Wrapper */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between max-w-5xl mx-auto px-6 py-8 sm:py-10">
        {/* Top Navbar */}
        <header className="flex items-center justify-between pb-6 border-b border-[#282832]/80">
          <div className="flex items-center gap-3">
            {/* Cyber Sigil Emblem */}
            <div className="relative group cursor-pointer">
              <div className="w-9 h-9 rounded-[2px] bg-gradient-to-br from-[#17171d] to-[#282832] border border-[#b068ff]/50 flex items-center justify-center font-mono font-bold text-xs text-[#ececf2] shadow-[0_0_15px_rgba(176,104,255,0.25)] transition-transform duration-300 group-hover:scale-105">
                DPG
              </div>
              <div className="absolute -inset-0.5 rounded-[2px] bg-[#b068ff]/30 blur-[4px] -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex flex-col">
              <span className="font-serif font-bold text-[#ececf2] text-sm tracking-tight flex items-center gap-2">
                DeFi Provenance Graph
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#b068ff]/15 text-[#b068ff] border border-[#b068ff]/30 font-normal">
                  v1.0
                </span>
              </span>
              <span className="text-[10.5px] font-mono text-[#aaaab8]">
                Asset Lineage & Verification Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            {/* Rabdi Testnet Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-[2px] bg-[#17171d]/90 border border-[#b068ff]/30 text-[#d6d8e4] shadow-[0_0_12px_rgba(176,104,255,0.12)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b068ff] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#b068ff]"></span>
              </span>
              <span className="text-[#ececf2] font-semibold">Rabdi #7794095</span>
            </div>

            <span className="text-[#282832] hidden sm:inline">/</span>
            <span className="text-[#aaaab8] hidden sm:inline">ETHGlobal Mumbai</span>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-12 sm:py-16 text-center max-w-3xl mx-auto">
          {/* Top Pill Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[2px] border border-[#b068ff]/40 bg-[#17171d]/90 text-xs font-mono text-[#ececf2] mb-6 shadow-[0_0_20px_rgba(176,104,255,0.18)]">
            <Sparkles className="w-3.5 h-3.5 text-[#b068ff]" />
            <span>Ethereum Mainnet · Chainlink CRE · Arkiv DB · Swarm Evidence</span>
          </div>

          {/* Headline in Georgia Serif with Radiant Chrome/Violet Gradient */}
          <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-tight mb-5 leading-[1.08]">
            <span className="bg-gradient-to-r from-[#ececf2] via-[#d6d8e4] to-[#b068ff] bg-clip-text text-transparent drop-shadow-[0_2px_24px_rgba(176,104,255,0.2)]">
              DeFi Provenance Graph
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#aaaab8] leading-relaxed mb-10 max-w-2xl mx-auto font-sans">
            Autonomous multi-hop asset provenance engine. Inspect smart contract dependency trees up to 2 hops,
            verify on-chain consensus with <span className="text-[#ececf2] font-medium">Chainlink CRE</span>, and audit persistent topologies on <span className="text-[#b068ff] font-medium">Arkiv</span> and <span className="text-[#d6d8e4] font-medium">Swarm</span>.
          </p>

          {/* 3 Pillars of Decentralized Provenance (Spotlight Cards with Violet Glow) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left font-mono text-xs mb-10">
            {/* Pillar 1 */}
            <SpotlightCard
              spotlightColor="rgba(176, 104, 255, 0.2)"
              className="p-4 rounded-[4px] bg-[#17171d]/90 border border-[#282832] hover:border-[#b068ff]/60 transition-all duration-300 space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-[2px] bg-[#b068ff]/15 border border-[#b068ff]/30 text-[#b068ff] flex items-center justify-center shadow-[0_0_10px_rgba(176,104,255,0.2)]">
                  <Share2 className="w-4 h-4" />
                </div>
                <span className="text-[9.5px] px-1.5 py-0.5 rounded-[2px] bg-[#282832] text-[#d6d8e4] border border-[#7d8495]/30">
                  2 Hops Deep
                </span>
              </div>
              <div className="text-[#ececf2] font-semibold text-xs pt-1 group-hover:text-[#d6d8e4] transition-colors">
                1. Multi-Hop Ingestion
              </div>
              <p className="text-[11px] text-[#aaaab8] leading-relaxed">
                Crawls diamond proxies, implementation slots, Gnosis Safe multisig signers, and Chainlink price feeds.
              </p>
            </SpotlightCard>

            {/* Pillar 2 */}
            <SpotlightCard
              spotlightColor="rgba(214, 216, 228, 0.2)"
              className="p-4 rounded-[4px] bg-[#17171d]/90 border border-[#282832] hover:border-[#d6d8e4]/60 transition-all duration-300 space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-[2px] bg-[#d6d8e4]/15 border border-[#d6d8e4]/30 text-[#d6d8e4] flex items-center justify-center shadow-[0_0_10px_rgba(214,216,228,0.2)]">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-[9.5px] px-1.5 py-0.5 rounded-[2px] bg-[#282832] text-[#d6d8e4] border border-[#7d8495]/30">
                  QuickJS DON
                </span>
              </div>
              <div className="text-[#ececf2] font-semibold text-xs pt-1 group-hover:text-[#d6d8e4] transition-colors">
                2. CRE Consensus Attestation
              </div>
              <p className="text-[11px] text-[#aaaab8] leading-relaxed">
                DON computes 7-factor deterministic score and attests Keccak256 fingerprints to RiskRegistry.sol.
              </p>
            </SpotlightCard>

            {/* Pillar 3 */}
            <SpotlightCard
              spotlightColor="rgba(176, 104, 255, 0.2)"
              className="p-4 rounded-[4px] bg-[#17171d]/90 border border-[#282832] hover:border-[#b068ff]/60 transition-all duration-300 space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-[2px] bg-[#b068ff]/15 border border-[#b068ff]/30 text-[#b068ff] flex items-center justify-center shadow-[0_0_10px_rgba(176,104,255,0.2)]">
                  <Database className="w-4 h-4" />
                </div>
                <span className="text-[9.5px] px-1.5 py-0.5 rounded-[2px] bg-[#282832] text-[#b068ff] border border-[#b068ff]/30">
                  Arkiv + Swarm
                </span>
              </div>
              <div className="text-[#ececf2] font-semibold text-xs pt-1 group-hover:text-[#d6d8e4] transition-colors">
                3. Dual Decentralized DB
              </div>
              <p className="text-[11px] text-[#aaaab8] leading-relaxed">
                Persists relational graph nodes in Arkiv (50k blocks BTL) and raw evidence snapshots in immutable Swarm blobs.
              </p>
            </SpotlightCard>
          </div>

          {/* Protocol Search / Contract Address Input */}
          <div className="relative max-w-xl mx-auto">
            <div className="relative p-[1px] rounded-[4px] bg-gradient-to-r from-[#282832] via-[#b068ff]/40 to-[#282832] shadow-[0_0_20px_rgba(176,104,255,0.12)]">
              <div className="relative bg-[#17171d] rounded-[3px] flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-[#b068ff]" />
                <input
                  type="text"
                  placeholder="Search protocol (Aave V3) or contract address (0x87870Bca...)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-0 pl-10 pr-20 py-3 text-xs text-[#ececf2] placeholder-[#7d8495] focus:outline-none font-mono transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 px-2 py-0.5 rounded-[2px] text-[10px] font-mono text-[#aaaab8] hover:text-[#ececf2] bg-[#282832] hover:bg-[#7d8495]/40 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Quick Interactive Address Discovery Chips */}
            <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap text-[10.5px] font-mono text-[#aaaab8]">
              <span className="text-[#7d8495] mr-1">Quick Discovery:</span>
              {aaveAddresses.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setSearchQuery(item.address)}
                  className="px-2 py-0.5 rounded-[2px] bg-[#17171d] hover:bg-[#282832] border border-[#282832] hover:border-[#b068ff]/50 text-[#d6d8e4] hover:text-[#ececf2] transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Match Status Feedback */}
            <div className="mt-2 text-[11px] font-mono text-[#aaaab8]">
              {matchedContract ? (
                <span className="text-[#ececf2] flex items-center justify-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#b068ff]" />
                  <span>Matched: {matchedContract.label} ({matchedContract.address.slice(0, 10)}...{matchedContract.address.slice(-6)})</span>
                </span>
              ) : isMatch ? (
                <span className="text-[#aaaab8]">
                  Indexed Target: <span className="text-[#ececf2] font-semibold">Aave V3 Mainnet</span> (Click audit card below to inspect)
                </span>
              ) : (
                <div className="flex items-center justify-center gap-2 text-[#b068ff]">
                  <span>Only Aave V3 is currently indexed on Rabdi testnet.</span>
                  <button
                    onClick={() => setSearchQuery("Aave V3")}
                    className="underline hover:text-white cursor-pointer"
                  >
                    Reset to Aave V3
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Main Protocol Showcase Card (Aave V3 Hero Showcase) */}
        <section className="mb-12">
          {isMatch && (
            <div
              onClick={() => setIsCreModalOpen(true)}
              className="relative rounded-[6px] border border-[#282832] hover:border-[#b068ff] bg-gradient-to-b from-[#17171d] to-[#121217] shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_35px_rgba(176,104,255,0.2)] transition-all duration-300 p-6 sm:p-8 cursor-pointer group"
            >
              {/* Top Card Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-[#282832]">
                <div>
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    <h2 className="text-2xl font-serif font-bold text-[#ececf2] tracking-tight group-hover:text-[#d6d8e4] transition-colors">
                      {protocol.name}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] border border-[#b068ff]/40 bg-[#b068ff]/10 text-[#b068ff] font-semibold">
                      {protocol.category}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] border border-[#282832] bg-[#0e0e12] text-[#aaaab8]">
                      {protocol.chainName}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-[#aaaab8] flex items-center gap-2 flex-wrap">
                    <span>Pool Proxy:</span>
                    <code className="text-[#ececf2] font-semibold bg-[#0e0e12] px-2 py-0.5 rounded-[2px] border border-[#282832]">
                      0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2
                    </code>
                    <span className="text-[#7d8495]">·</span>
                    <span>Block #{protocol.lastEvaluatedBlock}</span>
                  </div>
                </div>

                {/* Circular Seal Score Pill */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-[4px] border border-[#282832] group-hover:border-[#b068ff]/50 bg-[#0e0e12] text-xs font-mono shadow-inner transition-colors">
                    {/* Mini Circular Seal */}
                    <div className="w-10 h-10 rounded-full border border-[#b068ff]/60 flex flex-col items-center justify-center bg-[#17171d] shadow-[0_0_10px_rgba(176,104,255,0.25)]">
                      <span className="text-xs font-bold text-[#ececf2] font-mono leading-none">
                        {protocol.compositeScore}
                      </span>
                      <span className="text-[6.5px] font-mono text-[#aaaab8] uppercase mt-0.5">
                        RISK
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[9.5px] text-[#aaaab8] uppercase font-mono tracking-wider">
                        CRE Attestation
                      </span>
                      <span className="text-[#ececf2] font-bold text-sm flex items-center gap-1.5">
                        <span>{protocol.riskTier} RISK</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#b068ff] inline-block"></span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time 2-Hop Lineage Flow Teaser (Interactive Visual Map) */}
              <div className="py-5 border-b border-[#282832]">
                <div className="flex items-center justify-between mb-3 text-[10.5px] font-mono text-[#aaaab8]">
                  <span className="flex items-center gap-1.5 text-[#d6d8e4]">
                    <GitBranch className="w-3.5 h-3.5 text-[#b068ff]" />
                    <span>Live 2-Hop Lineage Architecture:</span>
                  </span>
                  <span className="text-[#7d8495]">Auto-reconstructs on EIP-1967 events</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                  {/* Hop 0 */}
                  <div className="p-3 rounded-[2px] bg-[#0e0e12] border border-[#282832] flex items-center justify-between">
                    <div>
                      <div className="text-[9.5px] text-[#b068ff] uppercase font-semibold">Hop 0 · Core Proxy</div>
                      <div className="text-[#ececf2] font-semibold text-xs mt-0.5">Aave V3 Pool</div>
                      <div className="text-[10px] text-[#7d8495] truncate">0x87870Bca...4E2</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#7d8495] hidden sm:block shrink-0" />
                  </div>

                  {/* Hop 1 */}
                  <div className="p-3 rounded-[2px] bg-[#0e0e12] border border-[#282832] flex items-center justify-between">
                    <div>
                      <div className="text-[9.5px] text-[#d6d8e4] uppercase font-semibold">Hop 1 · Implementation</div>
                      <div className="text-[#ececf2] font-semibold text-xs mt-0.5">Pool Logic (EIP-1967)</div>
                      <div className="text-[10px] text-[#7d8495] truncate">0x5FAab9E1...E14</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#7d8495] hidden sm:block shrink-0" />
                  </div>

                  {/* Hop 2 */}
                  <div className="p-3 rounded-[2px] bg-[#0e0e12] border border-[#282832] flex items-center justify-between">
                    <div>
                      <div className="text-[9.5px] text-[#b068ff] uppercase font-semibold">Hop 2 · Price Feed</div>
                      <div className="text-[#ececf2] font-semibold text-xs mt-0.5">Chainlink ETH / USD</div>
                      <div className="text-[10px] text-[#7d8495] truncate">0x5f4eC3Df...b4E</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#b068ff] shrink-0" title="Active Feed"></span>
                  </div>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6 border-b border-[#282832] font-mono text-xs">
                <div className="p-3.5 rounded-[2px] bg-[#0e0e12] border border-[#282832] group-hover:border-[#7d8495]/40 transition-colors">
                  <div className="text-[10px] text-[#aaaab8] mb-1 uppercase tracking-wider">Graph Topology</div>
                  <div className="text-[#ececf2] font-semibold text-sm">{protocol.nodeCount} EVM Nodes</div>
                  <div className="text-[10px] text-[#b068ff] mt-0.5">{protocol.edgeCount} Directed Edges</div>
                </div>

                <div className="p-3.5 rounded-[2px] bg-[#0e0e12] border border-[#282832] group-hover:border-[#7d8495]/40 transition-colors">
                  <div className="text-[10px] text-[#aaaab8] mb-1 uppercase tracking-wider">Arkiv Persisted</div>
                  <div className="text-[#d6d8e4] font-semibold text-sm">3 Schemas</div>
                  <div className="text-[10px] text-[#aaaab8] mt-0.5">50,000 Blocks BTL</div>
                </div>

                <div className="p-3.5 rounded-[2px] bg-[#0e0e12] border border-[#282832] group-hover:border-[#7d8495]/40 transition-colors">
                  <div className="text-[10px] text-[#aaaab8] mb-1 uppercase tracking-wider">Swarm Evidence</div>
                  <div className="text-[#d6d8e4] font-semibold text-sm">4 Raw Blobs</div>
                  <div className="text-[10px] text-[#aaaab8] mt-0.5">BZZ Immutable Anchors</div>
                </div>

                <div className="p-3.5 rounded-[2px] bg-[#0e0e12] border border-[#282832] group-hover:border-[#7d8495]/40 transition-colors">
                  <div className="text-[10px] text-[#aaaab8] mb-1 uppercase tracking-wider">CRE Attestation</div>
                  <div className="text-[#b068ff] font-semibold text-sm">Fingerprint Consensus</div>
                  <div className="text-[10px] text-[#d6d8e4] mt-0.5">Auto-Rebuild on Drift</div>
                </div>
              </div>

              {/* Launch Action */}
              <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs font-mono text-[#aaaab8] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#b068ff] shadow-[0_0_8px_#b068ff]"></span>
                  <span>Click initiates real-time Chainlink CRE fingerprint verification</span>
                </div>

                <button
                  onClick={() => setIsCreModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-[2px] bg-gradient-to-r from-[#d6d8e4] to-[#ececf2] hover:from-[#ececf2] hover:to-[#ffffff] text-[#000000] text-xs font-mono font-bold transition-all cursor-pointer shadow-[0_0_20px_rgba(214,216,228,0.35)] transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Zap className="w-4 h-4 text-[#000000]" />
                  <span>Audit Aave V3 & Trigger CRE Consensus</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Clean Cyber Sigilism Footer */}
        <footer className="pt-6 border-t border-[#282832]/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#aaaab8] font-mono gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-[#ececf2]">
              <Database className="w-3.5 h-3.5 text-[#b068ff]" /> Arkiv Rabdi DB-Chain
            </span>
            <span className="flex items-center gap-1.5 text-[#ececf2]">
              <HardDrive className="w-3.5 h-3.5 text-[#d6d8e4]" /> Swarm Forensic Evidence
            </span>
            <span className="flex items-center gap-1.5 text-[#ececf2]">
              <Zap className="w-3.5 h-3.5 text-[#b068ff]" /> Chainlink CRE
            </span>
          </div>
          <span className="text-[#7d8495]">ETHGlobal Mumbai 2026</span>
        </footer>

        {/* Interactive CRE Trigger Modal */}
        <CreTriggerModal
          isOpen={isCreModalOpen}
          onClose={() => setIsCreModalOpen(false)}
        />
      </div>
    </div>
  );
}

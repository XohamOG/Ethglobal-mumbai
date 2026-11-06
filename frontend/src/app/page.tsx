"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreTriggerModal } from "@/components/cre/CreTriggerModal";
import FluxLines from "@/components/ui/FluxLines";
import {
  Search,
  ArrowRight,
  Zap,
  Sliders,
  Compass,
  ArrowUpRight,
  CheckCircle2,
  Share2,
  Cpu,
  Database,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

const QUICK_DISCOVERY_TAGS = [
  { label: "Pool Proxy", address: "0x87870Bca3F3d6335C3F4ce8392D69350B4fA4E2" },
  { label: "PoolAddressesProvider", address: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e" },
  { label: "PoolConfigurator", address: "0x64b761D848206f447Fe2dd461b0c635Ec39ebb27" },
  { label: "AaveOracle", address: "0x54586bE62E3c3580375aE3723C145253020CaBC8" },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isCreModalOpen, setIsCreModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showTechnicalSpecs, setShowTechnicalSpecs] = useState(false);
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

  const handleTagClick = (tag: typeof QUICK_DISCOVERY_TAGS[0]) => {
    setSelectedTag(tag.label);
    setSearchQuery(tag.label);
    setIsFocused(true);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#101010] text-[#f3f3f3] flex flex-col justify-between overflow-x-hidden select-none">
      {/* Hyperstudio Architectural FluxLines Blueprint Canvas */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-auto">
        <FluxLines
          colors={["#ffffff", "#e0e0e0", "#c1c1c1", "#a3977e", "#6f6759"]}
          speed={0.4}
          scale={1.3}
          turbulence={0.65}
          fluidity={0.12}
          rimWidth={0.25}
          sharpness={1.9}
          shimmer={0.5}
          glow={2.0}
          lineWidth={1.2}
          mouseInteraction={true}
          mouseStrength={1.5}
          mouseRadius={0.35}
          clickSwirl={true}
          transparent={false}
          backgroundColor="#101010"
          className="w-full h-full"
        />
      </div>

      {/* Top Navigation Bar — Hyperstudio Specification */}
      <header className="relative z-20 w-full h-16 border-b border-[#212121] px-6 sm:px-12 flex items-center justify-between bg-[#101010]/85 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[18px] text-[#f3f3f3] font-normal tracking-tight">
              macaroom
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-[13px] tracking-wider text-[#9c9c9c] uppercase">
            <Link
              href="/graph?protocol=aave-v3-mainnet"
              className="hover:text-[#f3f3f3] transition-colors"
            >
              Provenance Graph
            </Link>
            <Link
              href="/demo"
              className="hover:text-[#f3f3f3] transition-colors"
            >
              Chaos Sandbox
            </Link>
            <button
              onClick={() => setIsCreModalOpen(true)}
              className="hover:text-[#f3f3f3] transition-colors uppercase cursor-pointer"
            >
              CRE Consensus
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#1a1a1a] border border-[#212121] text-[12px] uppercase text-[#9c9c9c] tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#98ff38]" />
            <span>Rabdi #7794095</span>
          </div>

          {/* White Pill Button — Primary CTA */}
          <Link
            href="/graph?protocol=aave-v3-mainnet"
            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#ffffff] hover:bg-[#f3f3f3] text-[#101010] text-[13px] font-normal uppercase tracking-wider transition-colors"
          >
            <span>Explore</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Center Hero Section — Hyperstudio Headline Display Block */}
      <main className="relative z-20 w-full max-w-[1200px] mx-auto px-6 sm:px-12 flex flex-col items-center text-center pt-16 pb-12">
        {/* Screenshot 5: Ethereum Mainnet · Chainlink CRE · Arkiv DB · Swarm Evidence Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[4px] bg-[#080808]/90 border border-[#212121] mb-6 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#98ff38]" />
          <span className="text-[12px] text-[#f3f3f3] uppercase tracking-wider">
            Ethereum Mainnet <span className="text-[#474747]">·</span> Chainlink CRE <span className="text-[#474747]">·</span> Arkiv DB <span className="text-[#474747]">·</span> Swarm Evidence
          </span>
        </div>

        {/* Display Headline: 63px weight 400 Chalk, -0.69px tracking */}
        <h1 className="text-[48px] sm:text-[63px] font-normal text-[#f3f3f3] leading-[1.05] tracking-[-0.69px] mb-4">
          macaroom
        </h1>

        {/* Sub-headline: 21px weight 400 Smoke */}
        <p className="text-[18px] sm:text-[21px] font-normal text-[#9c9c9c] leading-[1.1] tracking-[-0.01em] mb-8 max-w-xl">
          Decentralized protocol provenance and multi-hop asset intelligence.
        </p>

        {/* Hairline 1px Divider Line spanning content */}
        <div className="w-full max-w-3xl h-[1px] bg-[#212121] mb-8" />

        {/* Screenshot 6: Quick Discovery Pills */}
        <div className="w-full max-w-3xl flex flex-wrap items-center justify-center gap-2 mb-4 text-[12px]">
          <span className="text-[#9c9c9c] tracking-wider uppercase mr-1">Quick Discovery:</span>
          {QUICK_DISCOVERY_TAGS.map((tag) => (
            <button
              key={tag.label}
              onClick={() => handleTagClick(tag)}
              className={`px-3 py-1 rounded-[4px] border transition-colors cursor-pointer uppercase tracking-wider ${
                selectedTag === tag.label
                  ? "bg-[#1a1a1a] border-[#ffffff] text-[#f3f3f3]"
                  : "bg-[#080808] border-[#212121] text-[#9c9c9c] hover:border-[#474747] hover:text-[#f3f3f3]"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Matched Address Indicator */}
        {selectedTag && (
          <div className="mb-4 inline-flex items-center gap-2 text-[12px] text-[#98ff38] font-mono animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              Matched: {selectedTag} ({QUICK_DISCOVERY_TAGS.find((t) => t.label === selectedTag)?.address.slice(0, 10)}...{QUICK_DISCOVERY_TAGS.find((t) => t.label === selectedTag)?.address.slice(-6)})
            </span>
          </div>
        )}

        {/* Search Field & Interactive Lineage Dropdown */}
        <div ref={searchContainerRef} className="w-full max-w-3xl relative mb-12">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <div
              className={`relative rounded-[8px] border transition-colors bg-[#080808]/95 backdrop-blur-md ${
                isFocused ? "border-[#474747]" : "border-[#212121] hover:border-[#474747]"
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
                  placeholder="Search protocol registry or contract address (e.g. Aave V3, 0x87870Bca...)"
                  className="w-full bg-transparent border-0 text-[15px] text-[#f3f3f3] placeholder-[#9c9c9c] focus:outline-none font-normal tracking-tight"
                />

                {/* White Pill Action Button */}
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

          {/* Screenshot 7 & 8: Verified Protocol Lineage Card */}
          {isFocused && (
            <div className="absolute top-full left-0 right-0 mt-3 z-50 bg-[#080808]/98 border border-[#212121] rounded-[8px] p-5 text-left shadow-2xl animate-fadeIn backdrop-blur-md">
              {/* Header with Tags & Score */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#212121]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-[20px] font-normal text-[#f3f3f3]">
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
                    Pool Proxy: <span className="text-[#f3f3f3]">0x87870Bca3F3d6335C3F4ce8392D69350B4fA4E2</span> · Block #26354315
                  </div>
                </div>

                {/* Screenshot 8: Risk Score Badge & CRE Attestation */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#101010] border border-[#212121]">
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-wider text-[#9c9c9c]">CRE ATTESTATION</div>
                      <div className="text-[12px] text-[#98ff38] flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#98ff38]" />
                        <span>13.7 (LOW RISK)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live 2-Hop Lineage Architecture Flow */}
              <div className="py-4">
                <div className="text-[11px] uppercase tracking-wider text-[#9c9c9c] mb-3 flex items-center justify-between">
                  <span>Live 2-Hop Lineage Architecture:</span>
                  <span className="text-[10px] text-[#6f6759]">Auto-reconstructs on EIP-1967 events</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-[4px] bg-[#101010] border border-[#212121]">
                    <div className="text-[10px] uppercase text-[#9c9c9c] tracking-wider mb-1">
                      HOP 0 · CORE PROXY
                    </div>
                    <div className="text-[13px] text-[#f3f3f3] font-medium">Aave V3 Pool</div>
                    <div className="text-[11px] text-[#9c9c9c] font-mono truncate">0x87870Bca...4E2</div>
                  </div>

                  <div className="p-3 rounded-[4px] bg-[#101010] border border-[#212121]">
                    <div className="text-[10px] uppercase text-[#9c9c9c] tracking-wider mb-1">
                      HOP 1 · IMPLEMENTATION
                    </div>
                    <div className="text-[13px] text-[#f3f3f3] font-medium">Pool Logic (EIP-1967)</div>
                    <div className="text-[11px] text-[#9c9c9c] font-mono truncate">0x5FAab9E1...E14</div>
                  </div>

                  <div className="p-3 rounded-[4px] bg-[#101010] border border-[#212121]">
                    <div className="text-[10px] uppercase text-[#9c9c9c] tracking-wider mb-1">
                      HOP 2 · PRICE FEED
                    </div>
                    <div className="text-[13px] text-[#f3f3f3] font-medium">Chainlink ETH / USD</div>
                    <div className="text-[11px] text-[#9c9c9c] font-mono truncate">0x5f4eC3Df...b4E</div>
                  </div>
                </div>
              </div>

              {/* 4 Persistence Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-t border-[#212121] text-[12px]">
                <div>
                  <div className="text-[10px] uppercase text-[#9c9c9c] tracking-wider">GRAPH TOPOLOGY</div>
                  <div className="text-[#f3f3f3] font-mono mt-0.5">15 EVM Nodes</div>
                  <div className="text-[11px] text-[#9c9c9c]">21 Directed Edges</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[#9c9c9c] tracking-wider">ARKIV PERSISTED</div>
                  <div className="text-[#f3f3f3] font-mono mt-0.5">3 Schemas</div>
                  <div className="text-[11px] text-[#9c9c9c]">50,000 Blocks BTL</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[#9c9c9c] tracking-wider">SWARM EVIDENCE</div>
                  <div className="text-[#f3f3f3] font-mono mt-0.5">4 Raw Blobs</div>
                  <div className="text-[11px] text-[#9c9c9c]">BZZ Immutable Anchors</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[#9c9c9c] tracking-wider">CRE ATTESTATION</div>
                  <div className="text-[#f3f3f3] font-mono mt-0.5">Fingerprint Consensus</div>
                  <div className="text-[11px] text-[#9c9c9c]">Auto-Rebuild on Drift</div>
                </div>
              </div>

              {/* Card Footer CTAs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#212121]">
                <div className="flex items-center gap-2 text-[11px] text-[#9c9c9c]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#98ff38]" />
                  <span>Click initiates real-time Chainlink CRE fingerprint verification</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push("/demo")}
                    className="px-3 py-1.5 rounded-[8px] border border-[#474747] hover:border-[#ffffff] bg-transparent text-[#f3f3f3] text-[12px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#6f6759]" />
                    <span>Demo Chaos Sandbox</span>
                  </button>

                  <button
                    onClick={handleLaunchCreAudit}
                    className="px-3 py-1.5 rounded-[8px] border border-[#474747] hover:border-[#ffffff] bg-transparent text-[#f3f3f3] text-[12px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#6f6759]" />
                    <span>Audit Aave V3</span>
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

        {/* Screenshot 4: Three Architectural Feature Cards */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
          {/* Card 1 */}
          <div className="p-6 rounded-[8px] bg-[#080808]/90 border border-[#212121] hover:border-[#474747] transition-colors backdrop-blur-sm group">
            <div className="flex items-center justify-between mb-4">
              <Share2 className="w-5 h-5 text-[#6f6759] group-hover:text-[#f3f3f3] transition-colors" />
              <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#1a1a1a] text-[#9c9c9c] border border-[#212121] uppercase tracking-wider">
                2 Hops Deep
              </span>
            </div>
            <h3 className="text-[15px] font-normal text-[#f3f3f3] uppercase tracking-wider mb-2">
              1. Multi-Hop Ingestion
            </h3>
            <p className="text-[13px] text-[#9c9c9c] leading-relaxed">
              Crawls diamond proxies, implementation slots, Gnosis Safe multisig signers, and Chainlink price feeds.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-[8px] bg-[#080808]/90 border border-[#212121] hover:border-[#474747] transition-colors backdrop-blur-sm group">
            <div className="flex items-center justify-between mb-4">
              <Cpu className="w-5 h-5 text-[#6f6759] group-hover:text-[#f3f3f3] transition-colors" />
              <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#1a1a1a] text-[#9c9c9c] border border-[#212121] uppercase tracking-wider">
                QuickJS DON
              </span>
            </div>
            <h3 className="text-[15px] font-normal text-[#f3f3f3] uppercase tracking-wider mb-2">
              2. CRE Consensus Attestation
            </h3>
            <p className="text-[13px] text-[#9c9c9c] leading-relaxed">
              DON computes 7-factor deterministic score and attests Keccak256 fingerprints to RiskRegistry.sol.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-[8px] bg-[#080808]/90 border border-[#212121] hover:border-[#474747] transition-colors backdrop-blur-sm group">
            <div className="flex items-center justify-between mb-4">
              <Database className="w-5 h-5 text-[#6f6759] group-hover:text-[#f3f3f3] transition-colors" />
              <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#1a1a1a] text-[#9c9c9c] border border-[#212121] uppercase tracking-wider">
                Arkiv + Swarm
              </span>
            </div>
            <h3 className="text-[15px] font-normal text-[#f3f3f3] uppercase tracking-wider mb-2">
              3. Dual Decentralized DB
            </h3>
            <p className="text-[13px] text-[#9c9c9c] leading-relaxed">
              Persists relational graph nodes in Arkiv (50k blocks BTL) and raw evidence snapshots in immutable Swarm blobs.
            </p>
          </div>
        </div>

        {/* Collapsible Technical Specification Drawer (Screenshots 1, 2, 3) */}
        <div className="w-full max-w-4xl text-left">
          <button
            onClick={() => setShowTechnicalSpecs(!showTechnicalSpecs)}
            className="w-full py-3 px-4 rounded-[6px] bg-[#080808]/80 border border-[#212121] hover:border-[#474747] flex items-center justify-between text-[13px] text-[#9c9c9c] hover:text-[#f3f3f3] transition-colors cursor-pointer"
          >
            <span className="uppercase tracking-wider">
              Technical Specification — Fingerprint Pipeline & 7 Scoring Factors
            </span>
            {showTechnicalSpecs ? (
              <ChevronUp className="w-4 h-4 text-[#6f6759]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6f6759]" />
            )}
          </button>

          {showTechnicalSpecs && (
            <div className="mt-2 p-6 rounded-[8px] bg-[#080808]/95 border border-[#212121] text-[13px] space-y-6 animate-fadeIn">
              {/* Screenshots 1 & 2: What are we actually monitoring? */}
              <div>
                <h4 className="text-[14px] font-normal text-[#f3f3f3] uppercase tracking-wider mb-2">
                  1. Multi-Tier Protocol Topology
                </h4>
                <p className="text-[#9c9c9c] leading-relaxed mb-4">
                  Aave is composed of interdependent smart contracts. The engine monitors changes across the entire lineage tree:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[12px] font-mono">
                  <div className="p-3 bg-[#101010] border border-[#212121] rounded-[4px]">
                    <div className="text-[#f3f3f3]">Aave Pool Proxy</div>
                    <div className="text-[#9c9c9c] text-[11px]">User interaction entrypoint</div>
                  </div>
                  <div className="p-3 bg-[#101010] border border-[#212121] rounded-[4px]">
                    <div className="text-[#f3f3f3]">Pool Implementation</div>
                    <div className="text-[#9c9c9c] text-[11px]">Core lending logic bytecode</div>
                  </div>
                  <div className="p-3 bg-[#101010] border border-[#212121] rounded-[4px]">
                    <div className="text-[#f3f3f3]">Admin / Timelock</div>
                    <div className="text-[#9c9c9c] text-[11px]">Controls upgrades & delay</div>
                  </div>
                  <div className="p-3 bg-[#101010] border border-[#212121] rounded-[4px]">
                    <div className="text-[#f3f3f3]">Chainlink Price Feeds</div>
                    <div className="text-[#9c9c9c] text-[11px]">ETH/USD · USDC/USD · BTC/USD</div>
                  </div>
                </div>
              </div>

              {/* Screenshot 3: 3-Stage Fingerprint Calculation Pipeline */}
              <div>
                <h4 className="text-[14px] font-normal text-[#f3f3f3] uppercase tracking-wider mb-2">
                  2. 3-Stage Keccak-256 Fingerprint Synthesis
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
                  <div className="p-3 bg-[#101010] border border-[#212121] rounded-[4px]">
                    <div className="text-[#6f6759] uppercase tracking-wider mb-1">Stage 1 · Retrieval</div>
                    <p className="text-[#9c9c9c]">
                      Query proxy address, implementation storage slot (0x3608...), admin slot (0xb531...), and runtime bytecodes via eth_getCode.
                    </p>
                  </div>
                  <div className="p-3 bg-[#101010] border border-[#212121] rounded-[4px]">
                    <div className="text-[#6f6759] uppercase tracking-wider mb-1">Stage 2 · Individual Hashing</div>
                    <p className="text-[#9c9c9c]">
                      Compute Keccak256 hash of proxy bytecode and implementation bytecode individually.
                    </p>
                  </div>
                  <div className="p-3 bg-[#101010] border border-[#212121] rounded-[4px]">
                    <div className="text-[#6f6759] uppercase tracking-wider mb-1">Stage 3 · Composite Synthesis</div>
                    <p className="text-[#9c9c9c]">
                      Hash combined tuple (Proxy + Impl Hash + Admin + Oracle Addresses) into a single deterministic 32-byte hash.
                    </p>
                  </div>
                </div>
              </div>

              {/* Screenshot 1 Table: Information Needed & RPC Cost */}
              <div>
                <h4 className="text-[14px] font-normal text-[#f3f3f3] uppercase tracking-wider mb-2">
                  3. Information Provenance & Retrieval Cost
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12px] border border-[#212121]">
                    <thead>
                      <tr className="border-b border-[#212121] bg-[#101010] text-[#9c9c9c] uppercase tracking-wider">
                        <th className="p-2.5">Information Needed</th>
                        <th className="p-2.5">Where We Get It</th>
                        <th className="p-2.5">Cost / Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#212121] text-[#9c9c9c]">
                      <tr>
                        <td className="p-2.5 text-[#f3f3f3]">Aave contract addresses</td>
                        <td className="p-2.5">Official Aave address registry (@bgd-labs)</td>
                        <td className="p-2.5 text-[#98ff38]">Generally free</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-[#f3f3f3]">Implementation address</td>
                        <td className="p-2.5">Ethereum proxy storage slot (0x3608...)</td>
                        <td className="p-2.5">RPC eth_getStorageAt</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-[#f3f3f3]">Admin address</td>
                        <td className="p-2.5">Ethereum proxy storage slot (0xb531...)</td>
                        <td className="p-2.5">RPC eth_getStorageAt</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-[#f3f3f3]">Runtime bytecode</td>
                        <td className="p-2.5">Ethereum node state</td>
                        <td className="p-2.5">RPC eth_getCode</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-[#f3f3f3]">Bytecode hash & Fingerprint</td>
                        <td className="p-2.5">QuickJS-WASM consensus module</td>
                        <td className="p-2.5 text-[#98ff38]">Free computation (Keccak256)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-[#f3f3f3]">Chainlink price feeds</td>
                        <td className="p-2.5">Aave Oracle contract view methods</td>
                        <td className="p-2.5">RPC eth_call</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer / Bottom Bar — Hyperstudio Specification */}
      <footer className="relative z-20 w-full h-14 border-t border-[#212121] px-6 sm:px-12 flex items-center justify-between text-[13px] text-[#9c9c9c] bg-[#101010]/85 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[#f3f3f3]">macaroom</span>
          <span className="text-[#212121]">—</span>
          <span>Arkiv Structured DB</span>
          <span className="text-[#212121]">·</span>
          <span>Swarm Forensic Snapshots</span>
          <span className="text-[#212121]">·</span>
          <span>Chainlink CRE</span>
        </div>

        <div className="flex items-center gap-2 text-[#9c9c9c]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#98ff38]" />
          <span>ETHGlobal Mumbai 2026</span>
        </div>
      </footer>

      {/* CRE Trigger Modal */}
      <CreTriggerModal
        isOpen={isCreModalOpen}
        onClose={() => setIsCreModalOpen(false)}
      />
    </div>
  );
}

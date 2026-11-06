"use client";

import React from "react";
import Link from "next/link";
import { PROTOCOLS } from "@/lib/graph-data";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { ShinyButton } from "@/components/ui/ShinyButton";
import { Magnet } from "@/components/ui/Magnet";
import { DecryptedText } from "@/components/ui/DecryptedText";
import {
  ArrowUpRight,
  Database,
  Radio,
  CheckCircle2,
  HardDrive,
  Zap,
  ShieldCheck,
  Share2,
  Layers,
  Lock,
  GitBranch,
} from "lucide-react";

export default function HomePage() {
  const protocol = PROTOCOLS[0];

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

      {/* Hero Section */}
      <section className="py-12 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1c2336] bg-[#0c0f18] text-xs font-mono text-[#8b99b5] mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Ethereum Mainnet · Arkiv DB-Chain · Swarm · Chainlink CRE</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-3">
          <DecryptedText text="Multi-Hop Asset Provenance" speed={30} maxIterations={8} animateOn="view" />
        </h1>
        <p className="text-xs sm:text-sm text-[#7c8aa6] leading-relaxed mb-6 font-mono">
          Autonomous smart contract lineage discovery across 2 dependency hops. Verifiable on-chain
          attestations via Chainlink CRE, persistent relational graph topologies on Arkiv, and immutable audit logs in Swarm.
        </p>
      </section>

      {/* Main Active Protocol Dashboard Card */}
      <section className="mb-10">
        <SpotlightCard className="p-6 md:p-8 border-[#1a2133] bg-[#080b13]/90">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#141b2c]">
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
              <p className="text-xs font-mono text-[#5f6f8e]">
                Evaluated at Ethereum Block #{protocol.lastEvaluatedBlock} · Keccak256 Protocol Fingerprint
              </p>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6 border-b border-[#141b2c] font-mono text-xs">
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
              <div className="text-[10px] text-[#556382] mb-1 uppercase">CRE Attestation</div>
              <div className="text-emerald-400 font-semibold text-sm">RiskRegistry.sol</div>
              <div className="text-[10px] text-[#7684a2] mt-0.5">EVM Log & Cron Triggers</div>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="pt-6 flex flex-wrap items-center gap-3">
            <Link href={`/graph?protocol=${protocol.protocolId}`} className="flex-1 min-w-[200px]">
              <Magnet magnetStrength={0.15} className="w-full">
                <ShinyButton className="w-full justify-center py-2.5 text-xs" variant="primary">
                  <Share2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Launch Provenance Graph (15 Nodes)</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </ShinyButton>
              </Magnet>
            </Link>

            <Link href={`/graph?protocol=${protocol.protocolId}&tab=arkiv`} className="flex-1 min-w-[160px]">
              <ShinyButton className="w-full justify-center py-2.5 text-xs">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Arkiv Schemas</span>
              </ShinyButton>
            </Link>

            <Link href={`/graph?protocol=${protocol.protocolId}&tab=swarm`} className="flex-1 min-w-[160px]">
              <ShinyButton className="w-full justify-center py-2.5 text-xs">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span>Swarm Evidence</span>
              </ShinyButton>
            </Link>

            <Link href={`/graph?protocol=${protocol.protocolId}&tab=cre`} className="flex-1 min-w-[160px]">
              <ShinyButton className="w-full justify-center py-2.5 text-xs">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>CRE Simulator</span>
              </ShinyButton>
            </Link>
          </div>
        </SpotlightCard>
      </section>

      {/* 3-Hop Architecture Structure Explainer */}
      <section className="mb-10">
        <div className="text-xs font-mono text-[#566584] uppercase tracking-wider mb-3">
          Multi-Hop Provenance Architecture (15 Verified Contracts)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Hop 0 Card */}
          <div className="p-4 rounded-xl bg-[#080b13] border border-[#161d2d] space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-2 py-0.5 rounded border border-blue-800/60 bg-blue-950/40 text-blue-400 font-semibold">
                Hop 0 · Core Architecture
              </span>
              <span className="text-xs text-[#71809d]">6 Contracts</span>
            </div>
            <p className="text-[11px] text-[#6a7a99] leading-relaxed">
              Execution diamond and configuration proxies handling liquidity, accounting, and user funds.
            </p>
            <div className="text-[10px] space-y-1 text-[#8b99b5] pt-2 border-t border-[#131926]">
              <div>• Pool (Proxy: EIP-1967)</div>
              <div>• PoolAddressesProvider</div>
              <div>• PoolConfigurator (Proxy)</div>
              <div>• AaveOracle</div>
              <div>• ACLManager</div>
              <div>• AaveCollector (Treasury)</div>
            </div>
          </div>

          {/* Hop 1 Card */}
          <div className="p-4 rounded-xl bg-[#080b13] border border-[#161d2d] space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-2 py-0.5 rounded border border-purple-800/60 bg-purple-950/40 text-purple-400 font-semibold">
                Hop 1 · Governance & Admin
              </span>
              <span className="text-xs text-[#71809d]">3 Contracts</span>
            </div>
            <p className="text-[11px] text-[#6a7a99] leading-relaxed">
              Timelocks, multisig signers, and reserve controllers with administrative authority over Hop 0 proxies.
            </p>
            <div className="text-[10px] space-y-1 text-[#8b99b5] pt-2 border-t border-[#131926]">
              <div>• Aave Governance V2 Timelock</div>
              <div>• Emergency Admin (Gnosis Safe 3/5)</div>
              <div>• Ecosystem Reserve Controller</div>
            </div>
          </div>

          {/* Hop 2 Card */}
          <div className="p-4 rounded-xl bg-[#080b13] border border-[#161d2d] space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-2 py-0.5 rounded border border-amber-800/60 bg-amber-950/40 text-amber-400 font-semibold">
                Hop 2 · External Dependencies
              </span>
              <span className="text-xs text-[#71809d]">6 Contracts</span>
            </div>
            <p className="text-[11px] text-[#6a7a99] leading-relaxed">
              Transitive dependencies including external Chainlink aggregator price feeds and reserve tokens.
            </p>
            <div className="text-[10px] space-y-1 text-[#8b99b5] pt-2 border-t border-[#131926]">
              <div>• Chainlink ETH/USD Aggregator</div>
              <div>• Chainlink BTC/USD Aggregator</div>
              <div>• Chainlink USDC Aggregator</div>
              <div>• USDC, USDT, & DAI Token Contracts</div>
            </div>
          </div>
        </div>
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
    </main>
  );
}

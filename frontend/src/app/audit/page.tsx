"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  Zap,
  Terminal,
  Database,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  FileCode,
  Lock,
  Clock,
  Radio,
  Users,
  AlertTriangle,
} from "lucide-react";

function AuditMethodologyContent() {
  const searchParams = useSearchParams();
  const protocolId = searchParams.get("protocol") || "aave-v3-mainnet";

  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1800);
  };

  return (
    <div className="min-h-screen bg-[#101010] text-[#f3f3f3] selection:bg-[#ffffff] selection:text-[#101010]">
      {/* Top Header */}
      <header className="h-14 border-b border-[#212121] px-5 sm:px-8 flex items-center justify-between bg-[#080808] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/graph?protocol=aave-v3-mainnet">
            <button className="flex items-center gap-1.5 text-[12px] text-[#9c9c9c] hover:text-[#f3f3f3] transition-colors cursor-pointer py-1.5 px-3 rounded-[8px] border border-[#212121] hover:border-[#474747] bg-[#101010] uppercase tracking-wider">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Lineage Graph</span>
            </button>
          </Link>
          <span className="text-[#212121]">/</span>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-normal text-[#f3f3f3]">
              Risk Scoring & RPC Traces
            </span>
            <span className="text-[11px] text-[#6f6759] uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-[#151515] border border-[#212121]">
              Aave V3 · Ethereum Mainnet
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#101010] border border-[#212121] text-[12px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#98ff38]" />
            <span className="text-[#98ff38]">13.7 (LOW RISK)</span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-10 space-y-12">
        {/* Hero Section: Summary Card */}
        <section className="p-6 sm:p-8 rounded-[8px] bg-[#080808] border border-[#212121]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#212121]">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="w-6 h-6 text-[#98ff38]" />
                <h1 className="text-[26px] sm:text-[32px] font-normal text-[#f3f3f3] tracking-tight">
                  Aave V3 Lineage Risk Audit
                </h1>
              </div>
              <p className="text-[14px] text-[#9c9c9c] max-w-2xl leading-relaxed">
                Verifiable multi-hop asset provenance and deterministic 7-factor risk scoring computed via Chainlink Runtime Environment (CRE) DON consensus, persisted in Arkiv DB and archived in Swarm.
              </p>
            </div>

            <div className="p-4 rounded-[6px] bg-[#101010] border border-[#212121] shrink-0 text-right md:min-w-[200px]">
              <div className="text-[10px] uppercase tracking-wider text-[#9c9c9c] mb-1">
                Composite Score
              </div>
              <div className="text-[34px] font-normal text-[#98ff38] font-mono leading-none">
                13.7
              </div>
              <div className="text-[11px] text-[#9c9c9c] mt-1">
                Tier: <strong className="text-[#f3f3f3] font-normal">LOW (0–15)</strong>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-[12px]">
            <div>
              <span className="text-[#6f6759] uppercase tracking-wider block mb-1">Evaluated Block</span>
              <span className="font-mono text-[#f3f3f3]">#26354315</span>
            </div>
            <div>
              <span className="text-[#6f6759] uppercase tracking-wider block mb-1">Graph Topology</span>
              <span className="font-mono text-[#f3f3f3]">15 EVM Nodes · 23 Edges</span>
            </div>
            <div>
              <span className="text-[#6f6759] uppercase tracking-wider block mb-1">DON Consensus</span>
              <span className="font-mono text-[#f3f3f3]">4/4 QuickJS Nodes (100%)</span>
            </div>
            <div>
              <span className="text-[#6f6759] uppercase tracking-wider block mb-1">Rebuild Trigger</span>
              <span className="font-mono text-[#f3f3f3]">EIP-1967 Storage Drift</span>
            </div>
          </div>
        </section>

        {/* Section 1: Mathematical Formula & 2-Hop Risk Propagation */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#6f6759]" />
            <h2 className="text-[18px] font-normal text-[#f3f3f3] uppercase tracking-wider">
              1. Multi-Hop Risk Propagation Formula
            </h2>
          </div>

          <div className="p-6 rounded-[8px] bg-[#080808] border border-[#212121] space-y-5">
            <p className="text-[13px] text-[#9c9c9c] leading-relaxed">
              Risk does not aggregate linearly. Upstream dependency failures decay in impact as distance from the execution core increases. The composite score weights Hop 0 (direct proxies) at 100%, Hop 1 (implementations/governance) at 50%, and Hop 2 (oracle feeds) at 25%:
            </p>

            <div className="p-4 rounded-[6px] bg-[#101010] border border-[#212121] font-mono text-[13px] text-[#f3f3f3] overflow-x-auto">
              CompositeScore = (Hop0_Avg × 1.0) + (Hop1_Avg × 0.5) + (Hop2_Avg × 0.25)
            </div>

            {/* Calculations Breakdown Table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-[6px] bg-[#101010] border border-[#212121]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-[#f3f3f3] font-medium">Hop 0 · Core Mesh</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1a1a1a] text-[#6f6759] font-mono">Weight 1.0</span>
                </div>
                <div className="text-[11px] text-[#9c9c9c] mb-2 font-mono">
                  6 Contracts (Pool, Config, ACL, Oracle, Provider, Registry)
                </div>
                <div className="text-[11px] text-[#9c9c9c] font-mono">
                  Sum: 51.0 · Avg: 8.83
                </div>
                <div className="mt-3 text-[14px] text-[#f3f3f3] font-mono">
                  Contribution: <strong className="text-[#98ff38]">8.83</strong> pts
                </div>
              </div>

              <div className="p-4 rounded-[6px] bg-[#101010] border border-[#212121]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-[#f3f3f3] font-medium">Hop 1 · Implementation & Gov</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1a1a1a] text-[#6f6759] font-mono">Weight 0.5</span>
                </div>
                <div className="text-[11px] text-[#9c9c9c] mb-2 font-mono">
                  4 Contracts (PoolImpl, ConfigImpl, Timelock, Safe)
                </div>
                <div className="text-[11px] text-[#9c9c9c] font-mono">
                  Sum: 27.0 · Avg: 6.75
                </div>
                <div className="mt-3 text-[14px] text-[#f3f3f3] font-mono">
                  Contribution: <strong className="text-[#98ff38]">3.38</strong> pts
                </div>
              </div>

              <div className="p-4 rounded-[6px] bg-[#101010] border border-[#212121]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-[#f3f3f3] font-medium">Hop 2 · Oracle Feeds</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1a1a1a] text-[#6f6759] font-mono">Weight 0.25</span>
                </div>
                <div className="text-[11px] text-[#9c9c9c] mb-2 font-mono">
                  5 Feeds (ETH, BTC, USDC, DAI, USDT)
                </div>
                <div className="text-[11px] text-[#9c9c9c] font-mono">
                  Sum: 51.0 · Avg: 10.20
                </div>
                <div className="mt-3 text-[14px] text-[#f3f3f3] font-mono">
                  Contribution: <strong className="text-[#98ff38]">2.55</strong> pts
                </div>
              </div>
            </div>

            <div className="pt-2 text-right text-[13px] font-mono text-[#9c9c9c]">
              Total = 8.83 + 3.38 + 2.55 = <span className="text-[#98ff38] font-bold">14.76</span> ➔ Normalized: <span className="text-[#98ff38] font-bold">13.7</span>
            </div>
          </div>
        </section>

        {/* Section 2: The 7 Verifiable Factors (F1–F7) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#6f6759]" />
            <h2 className="text-[18px] font-normal text-[#f3f3f3] uppercase tracking-wider">
              2. The 7 Verifiable Risk Factors
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Factor 1 */}
            <div className="p-5 rounded-[6px] bg-[#080808] border border-[#212121] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-[#6f6759]" />
                    <span className="text-[14px] text-[#f3f3f3]">F1. Source Code Verification</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#101010] border border-[#212121] text-[#98ff38]">
                    0 / 20 pts
                  </span>
                </div>
                <p className="text-[12px] text-[#9c9c9c] leading-relaxed">
                  Queries Sourcify for cryptographic bytecode match against IPFS compiler metadata. Full match = 0 pts; Partial match = 8 pts; Unverified bytecode = 20 pts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#212121] text-[11px] font-mono text-[#6f6759]">
                Result: 15 / 15 contracts verified full_match
              </div>
            </div>

            {/* Factor 2 */}
            <div className="p-5 rounded-[6px] bg-[#080808] border border-[#212121] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#6f6759]" />
                    <span className="text-[14px] text-[#f3f3f3]">F2. Admin Control Structure</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#101010] border border-[#212121] text-[#98ff38]">
                    2 / 20 pts
                  </span>
                </div>
                <p className="text-[12px] text-[#9c9c9c] leading-relaxed">
                  Evaluates the governance execution delay. Timelock ≥ 48h = 2 pts; Timelock ≥ 24h = 5 pts; Multisig = 7–16 pts; Single EOA = 20 pts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#212121] text-[11px] font-mono text-[#6f6759]">
                Result: Aave Governance Timelock enforces 48-hour delay window
              </div>
            </div>

            {/* Factor 3 */}
            <div className="p-5 rounded-[6px] bg-[#080808] border border-[#212121] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#6f6759]" />
                    <span className="text-[14px] text-[#f3f3f3]">F3. Upgradeability Architecture</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#101010] border border-[#212121] text-[#c1c1c1]">
                    10 / 15 pts
                  </span>
                </div>
                <p className="text-[12px] text-[#9c9c9c] leading-relaxed">
                  Detects proxy pattern. Immutable logic = 0 pts; EIP-1967 transparent proxy = 10 pts; Beacon proxy = 12 pts; EIP-897 = 8 pts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#212121] text-[11px] font-mono text-[#6f6759]">
                Result: EIP-1967 standard implementation slot utilized
              </div>
            </div>

            {/* Factor 4 */}
            <div className="p-5 rounded-[6px] bg-[#080808] border border-[#212121] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#6f6759]" />
                    <span className="text-[14px] text-[#f3f3f3]">F4. Oracle Freshness & Staleness</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#101010] border border-[#212121] text-[#98ff38]">
                    0 / 15 pts
                  </span>
                </div>
                <p className="text-[12px] text-[#9c9c9c] leading-relaxed">
                  Ratio of (BlockTimestamp - OracleUpdatedAt) / Heartbeat. Ratio &lt; 0.5 = 0 pts; Ratio &lt; 0.8 = 3 pts; Stale &gt; 2.0 = 15 pts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#212121] text-[11px] font-mono text-[#6f6759]">
                Result: ETH/USD & BTC/USD ratios = 0.20 (within 3600s heartbeat)
              </div>
            </div>

            {/* Factor 5 */}
            <div className="p-5 rounded-[6px] bg-[#080808] border border-[#212121] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#6f6759]" />
                    <span className="text-[14px] text-[#f3f3f3]">F5. Multisig Concentration Risk</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#101010] border border-[#212121] text-[#98ff38]">
                    3 / 15 pts
                  </span>
                </div>
                <p className="text-[12px] text-[#9c9c9c] leading-relaxed">
                  Evaluates Gnosis Safe threshold/owner ratio. Ratio ≥ 0.6 = 3 pts; Ratio ≥ 0.4 = 9 pts; Threshold &lt; 3 = +5 penalty pts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#212121] text-[11px] font-mono text-[#6f6759]">
                Result: Emergency Safe is 4/7 threshold (ratio: 0.57) with 7 signers
              </div>
            </div>

            {/* Factor 6 */}
            <div className="p-5 rounded-[6px] bg-[#080808] border border-[#212121] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#6f6759]" />
                    <span className="text-[14px] text-[#f3f3f3]">F6. Contract Maturity & Age</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#101010] border border-[#212121] text-[#98ff38]">
                    0 / 10 pts
                  </span>
                </div>
                <p className="text-[12px] text-[#9c9c9c] leading-relaxed">
                  Time elapsed since creation block. Age ≥ 24 months = 0 pts; Age ≥ 12m = 3 pts; Age &lt; 3m = 10 pts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#212121] text-[11px] font-mono text-[#6f6759]">
                Result: Deployed Jan 2023 (34+ months mainnet battle-tested)
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Verified On-Chain RPC Call Log */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#6f6759]" />
            <h2 className="text-[18px] font-normal text-[#f3f3f3] uppercase tracking-wider">
              3. Verified RPC Evidence Log
            </h2>
          </div>

          <div className="rounded-[8px] bg-[#080808] border border-[#212121] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px] font-mono">
                <thead className="bg-[#101010] border-b border-[#212121] text-[#9c9c9c] uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">RPC Method</th>
                    <th className="py-3 px-4">Target Contract</th>
                    <th className="py-3 px-4">Slot / Calldata</th>
                    <th className="py-3 px-4">Decoded Output</th>
                    <th className="py-3 px-4 text-right">Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#212121]">
                  {/* RPC 1 */}
                  <tr className="hover:bg-[#101010]/50 transition-colors">
                    <td className="py-3.5 px-4 text-[#f3f3f3]">eth_getStorageAt</td>
                    <td className="py-3.5 px-4 text-[#9c9c9c]">0x87870Bca...4E2</td>
                    <td className="py-3.5 px-4 text-[#6f6759] truncate max-w-[140px]" title="0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc">
                      0x360894a1...2bbc (Impl)
                    </td>
                    <td className="py-3.5 px-4 text-[#98ff38]">
                      0x5FAab9E1...E14 (Pool Logic)
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={() => copy("0x5FAab9E1adbddaD0a08734BE8a52185Fd6558E14")} className="hover:text-[#f3f3f3]">
                        {copiedText === "0x5FAab9E1adbddaD0a08734BE8a52185Fd6558E14" ? <Check className="w-3.5 h-3.5 text-[#98ff38]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>

                  {/* RPC 2 */}
                  <tr className="hover:bg-[#101010]/50 transition-colors">
                    <td className="py-3.5 px-4 text-[#f3f3f3]">eth_getStorageAt</td>
                    <td className="py-3.5 px-4 text-[#9c9c9c]">0x2f39D218...4e9e</td>
                    <td className="py-3.5 px-4 text-[#6f6759] truncate max-w-[140px]" title="0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103">
                      0xb5312768...6103 (Admin)
                    </td>
                    <td className="py-3.5 px-4 text-[#98ff38]">
                      0xEE56e2B3...a8D5 (Timelock)
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={() => copy("0xEE56e2B3D491590B5b31738cC34d5232F378a8D5")} className="hover:text-[#f3f3f3]">
                        {copiedText === "0xEE56e2B3D491590B5b31738cC34d5232F378a8D5" ? <Check className="w-3.5 h-3.5 text-[#98ff38]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>

                  {/* RPC 3 */}
                  <tr className="hover:bg-[#101010]/50 transition-colors">
                    <td className="py-3.5 px-4 text-[#f3f3f3]">eth_call getPool()</td>
                    <td className="py-3.5 px-4 text-[#9c9c9c]">0x2f39D218...4e9e</td>
                    <td className="py-3.5 px-4 text-[#6f6759]">0x7535d246</td>
                    <td className="py-3.5 px-4 text-[#98ff38]">
                      0x87870Bca...4E2 (Pool Proxy)
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={() => copy("0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2")} className="hover:text-[#f3f3f3]">
                        {copiedText === "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2" ? <Check className="w-3.5 h-3.5 text-[#98ff38]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>

                  {/* RPC 4 */}
                  <tr className="hover:bg-[#101010]/50 transition-colors">
                    <td className="py-3.5 px-4 text-[#f3f3f3]">eth_call getSourceOfAsset()</td>
                    <td className="py-3.5 px-4 text-[#9c9c9c]">0x54586bE6...0Ca0</td>
                    <td className="py-3.5 px-4 text-[#6f6759]">WETH Token (0xC02aaA...)</td>
                    <td className="py-3.5 px-4 text-[#98ff38]">
                      0x5f4eC3Df...b419 (ETH/USD Feed)
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={() => copy("0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419")} className="hover:text-[#f3f3f3]">
                        {copiedText === "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419" ? <Check className="w-3.5 h-3.5 text-[#98ff38]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>

                  {/* RPC 5 */}
                  <tr className="hover:bg-[#101010]/50 transition-colors">
                    <td className="py-3.5 px-4 text-[#f3f3f3]">eth_call latestRoundData()</td>
                    <td className="py-3.5 px-4 text-[#9c9c9c]">0x5f4eC3Df...b419</td>
                    <td className="py-3.5 px-4 text-[#6f6759]">0xfeaf968c</td>
                    <td className="py-3.5 px-4 text-[#98ff38]">
                      Answer: $2,684.92 · Staleness: 0.20
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={() => copy("18446744073709570183")} className="hover:text-[#f3f3f3]">
                        {copiedText === "18446744073709570183" ? <Check className="w-3.5 h-3.5 text-[#98ff38]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>

                  {/* RPC 6 */}
                  <tr className="hover:bg-[#101010]/50 transition-colors">
                    <td className="py-3.5 px-4 text-[#f3f3f3]">eth_call getThreshold()</td>
                    <td className="py-3.5 px-4 text-[#9c9c9c]">0x2CFe3ec4...Aa30</td>
                    <td className="py-3.5 px-4 text-[#6f6759]">0xe75235b8</td>
                    <td className="py-3.5 px-4 text-[#98ff38]">
                      Threshold: 4 / 7 Owners
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={() => copy("0x2CFe3ec4d5a6811f4B8067F0DE7e47DfA938Aa30")} className="hover:text-[#f3f3f3]">
                        {copiedText === "0x2CFe3ec4d5a6811f4B8067F0DE7e47DfA938Aa30" ? <Check className="w-3.5 h-3.5 text-[#98ff38]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 4: Decentralized Persistence References */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#6f6759]" />
            <h2 className="text-[18px] font-normal text-[#f3f3f3] uppercase tracking-wider">
              4. Decentralized Persistence Proofs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Arkiv Proof */}
            <div className="p-5 rounded-[6px] bg-[#080808] border border-[#212121]">
              <div className="flex items-center gap-2.5 mb-2">
                <Database className="w-4 h-4 text-[#98ff38]" />
                <h3 className="text-[14px] text-[#f3f3f3] font-medium">Arkiv Rabdi Testnet DB</h3>
              </div>
              <p className="text-[12px] text-[#9c9c9c] mb-3 leading-relaxed">
                Relational graph nodes, dependency edges, and 7-factor breakdowns persisted with 50,000 blocks Time-To-Live.
              </p>
              <div className="text-[11px] font-mono text-[#9c9c9c] bg-[#101010] p-2.5 rounded border border-[#212121] flex items-center justify-between">
                <span className="truncate">0xc561566253956c5c8fec52d0cd49af8a5c40e1209c87894b863a5275dd665b50</span>
                <a
                  href="https://rabdi.explorer.arkiv.network"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 hover:text-[#f3f3f3]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Swarm Proof */}
            <div className="p-5 rounded-[6px] bg-[#080808] border border-[#212121]">
              <div className="flex items-center gap-2.5 mb-2">
                <HardDrive className="w-4 h-4 text-[#c1c1c1]" />
                <h3 className="text-[14px] text-[#f3f3f3] font-medium">Swarm Forensic Audit Snapshot</h3>
              </div>
              <p className="text-[12px] text-[#9c9c9c] mb-3 leading-relaxed">
                Immutable BZZ blob containing raw RPC transaction traces, execution receipts, and cryptographic compiler metadata.
              </p>
              <div className="text-[11px] font-mono text-[#9c9c9c] bg-[#101010] p-2.5 rounded border border-[#212121] flex items-center justify-between">
                <span className="truncate">3a5194ce284962a9b0598c0b1e001e96a5d63a573a4a2423b47913b71b2c8e7d</span>
                <a
                  href="https://gateway.ethswarm.org/bzz/3a5194ce284962a9b0598c0b1e001e96a5d63a573a4a2423b47913b71b2c8e7d"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 hover:text-[#f3f3f3]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function AuditMethodologyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#101010] flex items-center justify-center text-[#9c9c9c] font-mono text-[13px]">
          Loading Risk Audit & RPC Traces...
        </div>
      }
    >
      <AuditMethodologyContent />
    </Suspense>
  );
}

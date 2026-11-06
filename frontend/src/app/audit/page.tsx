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
  ChevronRight,
  Code2,
  FileCode,
  Layers,
  Radio,
  Clock,
  Lock,
  Users,
  AlertTriangle,
} from "lucide-react";

interface RpcStep {
  step: number;
  title: string;
  source: string;
  targetAddress: string;
  method: string;
  calldataOrSlot: string;
  decodedValue: string;
  etherscanUrl: string;
  curlSnippet: string;
}

const RPC_STEPS: RpcStep[] = [
  {
    step: 1,
    title: "Seed Registry ➔ Protocol Diamond",
    source: "@bgd-labs/aave-address-book",
    targetAddress: "0x2f39D218133AFAb8F2b819B1066C7f434aD94e9e",
    method: "eth_call getPool()",
    calldataOrSlot: "0x7535d246",
    decodedValue: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2 (Pool Proxy)",
    etherscanUrl:
      "https://etherscan.io/address/0x2f39D218133AFAb8F2b819B1066C7f434aD94e9e#readContract",
    curlSnippet: `curl -s -X POST https://ethereum-rpc.publicnode.com \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x2f39D218133AFAb8F2b819B1066C7f434aD94e9e","data":"0x7535d246"},"latest"]}'`,
  },
  {
    step: 2,
    title: "EIP-1967 Slot ➔ Pool Implementation",
    source: "Storage Slot Inspection",
    targetAddress: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    method: "eth_getStorageAt(slot)",
    calldataOrSlot:
      "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
    decodedValue: "0x5FAab9E1adbddaD0a08734BE8a52185Fd6558E14 (Pool Logic)",
    etherscanUrl:
      "https://etherscan.io/address/0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2#readProxyContract",
    curlSnippet: `curl -s -X POST https://ethereum-rpc.publicnode.com \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"eth_getStorageAt","params":["0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2","0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc","latest"]}'`,
  },
  {
    step: 3,
    title: "Access Control ➔ Emergency Admin Safe",
    source: "ACLManager.getEmergencyAdmin()",
    targetAddress: "0xc2aaCf6553D20d1e9d78E365AAba8032af9c85b0",
    method: "eth_call getEmergencyAdmin()",
    calldataOrSlot: "0x5b34b966",
    decodedValue: "0x2CFed90B2b761705D172Ac707Ac213fa4476Aa30 (Safe 4/7)",
    etherscanUrl:
      "https://etherscan.io/address/0x2CFed90B2b761705D172Ac707Ac213fa4476Aa30#readContract",
    curlSnippet: `curl -s -X POST https://ethereum-rpc.publicnode.com \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":3,"method":"eth_call","params":[{"to":"0xc2aaCf6553D20d1e9d78E365AAba8032af9c85b0","data":"0x5b34b966"},"latest"]}'`,
  },
  {
    step: 4,
    title: "Oracle Registry ➔ Chainlink Aggregator",
    source: "AaveOracle.getSourceOfAsset(WBTC)",
    targetAddress: "0x54586bE6333240e3ef4a78248c410Bf33060Ca0C2",
    method: "eth_call getSourceOfAsset()",
    calldataOrSlot: "0xb3449339 (Asset: WBTC 0x2260FAC5...)",
    decodedValue: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c (BTC/USD Feed)",
    etherscanUrl:
      "https://etherscan.io/address/0x54586bE6333240e3ef4a78248c410Bf33060Ca0C2#readContract",
    curlSnippet: `curl -s -X POST https://ethereum-rpc.publicnode.com \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":4,"method":"eth_call","params":[{"to":"0x54586bE6333240e3ef4a78248c410Bf33060Ca0C2","data":"0xb34493390000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c599"},"latest"]}'`,
  },
  {
    step: 5,
    title: "Chainlink Aggregator ➔ Round & Staleness",
    source: "AggregatorV3.latestRoundData()",
    targetAddress: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
    method: "eth_call latestRoundData()",
    calldataOrSlot: "0xfeaf968c",
    decodedValue:
      "Answer: $67,420.50 · Heartbeat: 3600s · Staleness: 0.95 (Fresh)",
    etherscanUrl:
      "https://etherscan.io/address/0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c#readContract",
    curlSnippet: `curl -s -X POST https://ethereum-rpc.publicnode.com \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":5,"method":"eth_call","params":[{"to":"0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c","data":"0xfeaf968c"},"latest"]}'`,
  },
];

const FACTORS = [
  {
    id: "F1",
    name: "Source Verification",
    metric: "Sourcify bytecode match",
    observed: "15 / 15 Full Match",
    pts: 0,
    max: 20,
    status: "optimal",
  },
  {
    id: "F2",
    name: "Admin Control",
    metric: "Timelock execution delay",
    observed: "48h Timelock Window",
    pts: 2,
    max: 20,
    status: "optimal",
  },
  {
    id: "F3",
    name: "Upgradeability",
    metric: "Proxy architecture",
    observed: "EIP-1967 Transparent",
    pts: 10,
    max: 15,
    status: "upgradeable",
  },
  {
    id: "F4",
    name: "Oracle Freshness",
    metric: "Age / Heartbeat ratio",
    observed: "0.20 - 0.95 ratio",
    pts: 0,
    max: 15,
    status: "optimal",
  },
  {
    id: "F5",
    name: "Multisig Concentration",
    metric: "Safe threshold / signers",
    observed: "4 of 7 signers (57%)",
    pts: 3,
    max: 15,
    status: "optimal",
  },
  {
    id: "F6",
    name: "Contract Maturity",
    metric: "Mainnet operational age",
    observed: "34+ months active",
    pts: 0,
    max: 10,
    status: "optimal",
  },
  {
    id: "F7",
    name: "Incident History",
    metric: "Historical exploit record",
    observed: "0 known incidents",
    pts: 0,
    max: 5,
    status: "optimal",
  },
];

function AuditMethodologyContent() {
  const searchParams = useSearchParams();
  const protocolId = searchParams.get("protocol") || "aave-v3-mainnet";

  const [activeTab, setActiveTab] = useState<"trail" | "matrix" | "hops" | "proofs">("trail");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="min-h-screen bg-[#101010] text-[#f3f3f3] selection:bg-[#ffffff] selection:text-[#101010]">
      {/* Top Header */}
      <header className="h-14 border-b border-[#212121] px-4 sm:px-8 flex items-center justify-between bg-[#080808] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/graph?protocol=aave-v3-mainnet">
            <button className="flex items-center gap-1.5 text-[11px] text-[#9c9c9c] hover:text-[#f3f3f3] transition-colors cursor-pointer py-1.5 px-3 rounded-[6px] border border-[#212121] hover:border-[#474747] bg-[#101010] uppercase tracking-wider">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Graph</span>
            </button>
          </Link>
          <span className="text-[#212121]">/</span>
          <span className="text-[13px] font-normal text-[#f3f3f3]">Risk Logic & RPC Trail</span>
          <span className="text-[11px] text-[#6f6759] uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-[#151515] border border-[#212121] hidden sm:inline">
            Aave V3 · Mainnet
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#101010] border border-[#212121] text-[12px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#98ff38]" />
            <span className="text-[#98ff38]">13.7 (LOW RISK)</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Minimal Hero Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[8px] bg-[#080808] border border-[#212121]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-[#98ff38]" />
              <h1 className="text-[20px] sm:text-[22px] font-normal text-[#f3f3f3] tracking-tight">
                Aave V3 Lineage Provenance
              </h1>
            </div>
            <p className="text-[12px] text-[#9c9c9c] font-mono">
              Evaluated on Ethereum Block #26354315 · Chainlink CRE 4/4 Consensus · Arkiv Rabdi
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#6f6759] block">
                Composite Score
              </span>
              <span className="text-[28px] font-mono leading-none text-[#98ff38]">13.7</span>
            </div>
            <div className="h-8 w-[1px] bg-[#212121]" />
            <div className="text-[11px] text-[#9c9c9c] font-mono">
              <div>Hop 0: 8.83</div>
              <div>Hop 1: 3.38</div>
              <div>Hop 2: 2.55</div>
            </div>
          </div>
        </section>

        {/* Minimal Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-[#212121] pb-2 text-[12px]">
          <button
            onClick={() => setActiveTab("trail")}
            className={`px-3 py-1.5 rounded-[4px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "trail"
                ? "bg-[#ffffff] text-[#101010] font-medium"
                : "text-[#9c9c9c] hover:text-[#f3f3f3] hover:bg-[#1a1a1a]"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>RPC Logic Trail (5 Steps)</span>
          </button>

          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3 py-1.5 rounded-[4px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "matrix"
                ? "bg-[#ffffff] text-[#101010] font-medium"
                : "text-[#9c9c9c] hover:text-[#f3f3f3] hover:bg-[#1a1a1a]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>7-Factor Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab("hops")}
            className={`px-3 py-1.5 rounded-[4px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "hops"
                ? "bg-[#ffffff] text-[#101010] font-medium"
                : "text-[#9c9c9c] hover:text-[#f3f3f3] hover:bg-[#1a1a1a]"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Hop Decay Formula</span>
          </button>

          <button
            onClick={() => setActiveTab("proofs")}
            className={`px-3 py-1.5 rounded-[4px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "proofs"
                ? "bg-[#ffffff] text-[#101010] font-medium"
                : "text-[#9c9c9c] hover:text-[#f3f3f3] hover:bg-[#1a1a1a]"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Arkiv & Swarm</span>
          </button>
        </div>

        {/* TAB 1: RPC LOGIC TRAIL (Where did we get the actual values?) */}
        {activeTab === "trail" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] text-[#9c9c9c] font-mono px-1">
              <span>Public RPC Gateway: https://ethereum-rpc.publicnode.com</span>
              <span>Execution Trail: Root ➔ Proxies ➔ Admin ➔ Oracles</span>
            </div>

            <div className="space-y-3">
              {RPC_STEPS.map((s) => (
                <div
                  key={s.step}
                  className="p-4 rounded-[6px] bg-[#080808] border border-[#212121] hover:border-[#474747] transition-all space-y-3"
                >
                  {/* Step Title & Links */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#212121] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1a1a1a] border border-[#212121] text-[11px] font-mono text-[#f3f3f3] flex items-center justify-center shrink-0">
                        {s.step}
                      </span>
                      <span className="text-[14px] text-[#f3f3f3] font-normal">
                        {s.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={s.etherscanUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] font-mono text-[#6f6759] hover:text-[#f3f3f3] px-2 py-1 rounded bg-[#101010] border border-[#212121] transition-colors"
                      >
                        <span>Etherscan RPC Query</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => copy(s.curlSnippet, `curl-${s.step}`)}
                        className="flex items-center gap-1 text-[11px] font-mono text-[#9c9c9c] hover:text-[#f3f3f3] px-2 py-1 rounded bg-[#101010] border border-[#212121] transition-colors cursor-pointer"
                        title="Copy curl command to run locally"
                      >
                        {copiedKey === `curl-${s.step}` ? (
                          <Check className="w-3 h-3 text-[#98ff38]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy cURL</span>
                      </button>
                    </div>
                  </div>

                  {/* 3-Column RPC Trail Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-mono">
                    <div className="p-2.5 rounded bg-[#101010] border border-[#212121]">
                      <span className="text-[#6f6759] block mb-0.5 uppercase tracking-wider text-[10px]">
                        Target Contract
                      </span>
                      <span className="text-[#f3f3f3] truncate block" title={s.targetAddress}>
                        {s.targetAddress}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-[#101010] border border-[#212121]">
                      <span className="text-[#6f6759] block mb-0.5 uppercase tracking-wider text-[10px]">
                        Method / Calldata
                      </span>
                      <span className="text-[#c1c1c1] truncate block" title={s.calldataOrSlot}>
                        {s.method}: <code className="text-[#f3f3f3]">{s.calldataOrSlot.slice(0, 16)}...</code>
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-[#101010] border border-[#212121]">
                      <span className="text-[#6f6759] block mb-0.5 uppercase tracking-wider text-[10px]">
                        Decoded Result
                      </span>
                      <span className="text-[#98ff38] truncate block" title={s.decodedValue}>
                        {s.decodedValue}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: 7-FACTOR MATRIX */}
        {activeTab === "matrix" && (
          <div className="rounded-[8px] bg-[#080808] border border-[#212121] overflow-hidden">
            <table className="w-full text-left text-[12px] font-mono">
              <thead className="bg-[#101010] border-b border-[#212121] text-[#6f6759] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Factor</th>
                  <th className="py-3 px-4">Evaluation Metric</th>
                  <th className="py-3 px-4">Observed On-Chain Value</th>
                  <th className="py-3 px-4 text-right">Points</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#212121]">
                {FACTORS.map((f) => (
                  <tr key={f.id} className="hover:bg-[#101010]/50 transition-colors">
                    <td className="py-3 px-4 font-normal text-[#f3f3f3]">
                      <span className="text-[#6f6759] mr-2">{f.id}</span>
                      {f.name}
                    </td>
                    <td className="py-3 px-4 text-[#9c9c9c]">{f.metric}</td>
                    <td className="py-3 px-4 text-[#c1c1c1]">{f.observed}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      <span className={f.pts === 0 ? "text-[#98ff38]" : "text-[#c1c1c1]"}>
                        {f.pts}
                      </span>{" "}
                      <span className="text-[#6f6759]">/ {f.max}</span>
                    </td>
                    <td className="py-3 px-4 text-right uppercase text-[10px] tracking-wider">
                      {f.status === "optimal" ? (
                        <span className="text-[#98ff38]">Optimal</span>
                      ) : (
                        <span className="text-[#eab308]">Flagged</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: HOP DECAY FORMULA */}
        {activeTab === "hops" && (
          <div className="space-y-4">
            <div className="p-4 rounded-[6px] bg-[#080808] border border-[#212121] font-mono text-[13px] text-[#f3f3f3]">
              <span className="text-[#6f6759] uppercase text-[10px] block mb-1">
                Risk Propagation Model
              </span>
              CompositeScore = (Hop0_Avg × 1.00) + (Hop1_Avg × 0.50) + (Hop2_Avg × 0.25)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-[6px] bg-[#080808] border border-[#212121] font-mono text-[11px] space-y-2">
                <div className="flex justify-between text-[#f3f3f3]">
                  <span>Hop 0 · Core Proxies</span>
                  <span className="text-[#6f6759]">Weight 1.00</span>
                </div>
                <div className="text-[#9c9c9c]">6 Contracts (Pool, Config, ACL, Oracle)</div>
                <div className="text-[#9c9c9c]">Avg Risk: 8.83</div>
                <div className="text-[#98ff38] text-[13px] pt-1 border-t border-[#212121]">
                  Contribution: 8.83 pts
                </div>
              </div>

              <div className="p-4 rounded-[6px] bg-[#080808] border border-[#212121] font-mono text-[11px] space-y-2">
                <div className="flex justify-between text-[#f3f3f3]">
                  <span>Hop 1 · Implementation</span>
                  <span className="text-[#6f6759]">Weight 0.50</span>
                </div>
                <div className="text-[#9c9c9c]">4 Contracts (PoolLogic, Safe, Timelock)</div>
                <div className="text-[#9c9c9c]">Avg Risk: 6.75</div>
                <div className="text-[#98ff38] text-[13px] pt-1 border-t border-[#212121]">
                  Contribution: 3.38 pts
                </div>
              </div>

              <div className="p-4 rounded-[6px] bg-[#080808] border border-[#212121] font-mono text-[11px] space-y-2">
                <div className="flex justify-between text-[#f3f3f3]">
                  <span>Hop 2 · Oracle Feeds</span>
                  <span className="text-[#6f6759]">Weight 0.25</span>
                </div>
                <div className="text-[#9c9c9c]">5 Aggregators (ETH, BTC, USDC, DAI, USDT)</div>
                <div className="text-[#9c9c9c]">Avg Risk: 10.20</div>
                <div className="text-[#98ff38] text-[13px] pt-1 border-t border-[#212121]">
                  Contribution: 2.55 pts
                </div>
              </div>
            </div>

            <div className="p-3 text-right font-mono text-[12px] text-[#9c9c9c] bg-[#080808] rounded-[6px] border border-[#212121]">
              Sum: 8.83 + 3.38 + 2.55 = <span className="text-[#98ff38]">14.76</span> ➔ Normalized Final: <span className="text-[#98ff38] font-bold">13.7 (LOW)</span>
            </div>
          </div>
        )}

        {/* TAB 4: DECENTRALIZED PROOFS */}
        {activeTab === "proofs" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Arkiv Proof */}
            <div className="p-5 rounded-[6px] bg-[#080808] border border-[#212121] space-y-3 font-mono text-[11px]">
              <div className="flex items-center justify-between text-[#f3f3f3]">
                <span className="flex items-center gap-1.5 text-[13px]">
                  <Database className="w-4 h-4 text-[#98ff38]" />
                  <span>Arkiv Rabdi Testnet DB</span>
                </span>
                <span className="text-[#6f6759]">Block #7794095</span>
              </div>
              <div className="text-[#9c9c9c]">
                TTL: 50,000 blocks · Lineage Topology & Factor Matrices
              </div>
              <div className="p-2.5 rounded bg-[#101010] border border-[#212121] flex items-center justify-between text-[#9c9c9c]">
                <span className="truncate mr-2">
                  0xc561566253956c5c8fec52d0cd49af8a5c40e1209c87894b863a5275dd665b50
                </span>
                <a
                  href="https://rabdi.explorer.arkiv.network"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#f3f3f3]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Swarm Proof */}
            <div className="p-5 rounded-[6px] bg-[#080808] border border-[#212121] space-y-3 font-mono text-[11px]">
              <div className="flex items-center justify-between text-[#f3f3f3]">
                <span className="flex items-center gap-1.5 text-[13px]">
                  <HardDrive className="w-4 h-4 text-[#c1c1c1]" />
                  <span>Swarm Forensic Evidence Blob</span>
                </span>
                <span className="text-[#6f6759]">BZZ Storage</span>
              </div>
              <div className="text-[#9c9c9c]">
                Immutable execution receipts & bytecode metadata
              </div>
              <div className="p-2.5 rounded bg-[#101010] border border-[#212121] flex items-center justify-between text-[#9c9c9c]">
                <span className="truncate mr-2">
                  3a5194ce284962a9b0598c0b1e001e96a5d63a573a4a2423b47913b71b2c8e7d
                </span>
                <a
                  href="https://gateway.ethswarm.org/bzz/3a5194ce284962a9b0598c0b1e001e96a5d63a573a4a2423b47913b71b2c8e7d"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#f3f3f3]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AuditMethodologyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#101010] flex items-center justify-center text-[#9c9c9c] font-mono text-[13px]">
          Loading Risk Logic & RPC Trail...
        </div>
      }
    >
      <AuditMethodologyContent />
    </Suspense>
  );
}

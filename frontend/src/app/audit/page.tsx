"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getRiskScoreConfig, GraphNode } from "@/lib/graph-data";
import { useGraphSnapshot, GRAPH_SERVICE_URL } from "@/lib/graph-api";
import { runTrail, padAddress, RPC_URL } from "@/lib/rpc-trail";
import { fetchArkivSnapshot } from "@/lib/arkiv-client";
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
  etherscanUrl: string;
  curlSnippet: string;
}

const RPC_STEPS: RpcStep[] = [
  {
    step: 1,
    title: "Seed Registry ➔ Protocol Diamond",
    source: "@bgd-labs/aave-address-book",
    targetAddress: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
    method: "eth_call getPool()",
    calldataOrSlot: "0x026b1d5f",
    etherscanUrl:
      "https://etherscan.io/address/0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e#readContract",
    curlSnippet: `curl -s -X POST https://ethereum-rpc.publicnode.com \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e","data":"0x026b1d5f"},"latest"]}'`,
  },
  {
    step: 2,
    title: "EIP-1967 Slot ➔ Pool Implementation",
    source: "Storage Slot Inspection",
    targetAddress: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    method: "eth_getStorageAt(slot)",
    calldataOrSlot:
      "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
    etherscanUrl:
      "https://etherscan.io/address/0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2#readProxyContract",
    curlSnippet: `curl -s -X POST https://ethereum-rpc.publicnode.com \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"eth_getStorageAt","params":["0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2","0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc","latest"]}'`,
  },
  {
    step: 3,
    title: "Access Control ➔ Emergency Admin Safe",
    source: "ACLManager.isEmergencyAdmin(Safe)",
    targetAddress: "0xc2aaCf6553D20d1e9d78E365AAba8032af9c85b0",
    method: "eth_call isEmergencyAdmin(address)",
    calldataOrSlot: "0x2500f2b6 (isEmergencyAdmin(Safe))",
    etherscanUrl:
      "https://etherscan.io/address/0x2CFe3ec4d5a6811f4B8067F0DE7e47DfA938Aa30#readContract",
    curlSnippet: `curl -s -X POST https://ethereum-rpc.publicnode.com \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":3,"method":"eth_call","params":[{"to":"0xc2aaCf6553D20d1e9d78E365AAba8032af9c85b0","data":"0x2500f2b60000000000000000000000002cfe3ec4d5a6811f4b8067f0de7e47dfa938aa30"},"latest"]}'`,
  },
  {
    step: 4,
    title: "Oracle Registry ➔ Chainlink Aggregator",
    source: "AaveOracle.getSourceOfAsset(WBTC)",
    targetAddress: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
    method: "eth_call getSourceOfAsset()",
    calldataOrSlot: "0x92bf2be0 (Asset: WBTC 0x2260FAC5...)",
    etherscanUrl:
      "https://etherscan.io/address/0x54586bE62E3c3580375aE3723C145253060Ca0C2#readContract",
    curlSnippet: `curl -s -X POST https://ethereum-rpc.publicnode.com \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":4,"method":"eth_call","params":[{"to":"0x54586bE62E3c3580375aE3723C145253060Ca0C2","data":"0x92bf2be00000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c599"},"latest"]}'`,
  },
  {
    step: 5,
    title: "Chainlink Aggregator ➔ Round & Staleness",
    source: "AggregatorV3.latestRoundData()",
    targetAddress: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
    method: "eth_call latestRoundData()",
    calldataOrSlot: "0xfeaf968c",
    etherscanUrl:
      "https://etherscan.io/address/0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c#readContract",
    curlSnippet: `curl -s -X POST https://ethereum-rpc.publicnode.com \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":5,"method":"eth_call","params":[{"to":"0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c","data":"0xfeaf968c"},"latest"]}'`,
  },
];

// Scoring rubric (methodology constants). Points and observations are computed
// from the live graph-service snapshot.
const FACTOR_RUBRIC = [
  { id: "F1", key: "f1_verification", name: "Source Verification", metric: "Sourcify bytecode match", max: 20 },
  { id: "F2", key: "f2_admin_control", name: "Admin Control", metric: "Admin / timelock type", max: 20 },
  { id: "F3", key: "f3_upgradeability", name: "Upgradeability", metric: "Proxy architecture", max: 15 },
  { id: "F4", key: "f4_oracle_freshness", name: "Oracle Freshness", metric: "Age / Heartbeat ratio", max: 15 },
  { id: "F5", key: "f5_concentration_risk", name: "Multisig Concentration", metric: "Safe threshold / signers", max: 15 },
  { id: "F6", key: "f6_contract_age", name: "Contract Maturity", metric: "Mainnet operational age", max: 10 },
  { id: "F7", key: "f7_incident_history", name: "Incident History", metric: "Historical exploit record", max: 5 },
] as const;

const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
const POOL_PROXY = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
const EIP1967_IMPL_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const EMERGENCY_SAFE = "0x2CFe3ec4d5a6811f4B8067F0DE7e47DfA938Aa30";

// Queries re-executed live against mainnet for the RPC trail
const TRAIL_QUERIES = [
  { step: 1, to: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e", kind: "call" as const, data: "0x026b1d5f" },
  { step: 2, to: POOL_PROXY, kind: "slot" as const, data: EIP1967_IMPL_SLOT },
  { step: 3, to: "0xc2aaCf6553D20d1e9d78E365AAba8032af9c85b0", kind: "call" as const, data: "0x2500f2b6" + padAddress(EMERGENCY_SAFE) },
  { step: 4, to: "0x54586bE62E3c3580375aE3723C145253060Ca0C2", kind: "call" as const, data: "0x92bf2be0" + padAddress(WBTC) },
  { step: 5, to: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c", kind: "call" as const, data: "0xfeaf968c" },
];

function countBy<T>(list: T[], f: (x: T) => string): string {
  const m: Record<string, number> = {};
  list.forEach((x) => {
    const k = f(x);
    m[k] = (m[k] || 0) + 1;
  });
  return Object.entries(m)
    .map(([k, v]) => `${k} ×${v}`)
    .join(", ");
}

function buildFactorRows(nodes: GraphNode[]) {
  const n = nodes.length || 1;
  const oracles = nodes.filter((x) => x.category === "oracle");
  const safes = nodes.filter((x) => (x.safeOwnerCount || 0) > 0);
  return FACTOR_RUBRIC.map((f) => {
    const pts = Number(
      (
        nodes.reduce(
          (a, x) =>
            a + ((x.breakdown?.[f.key as keyof NonNullable<GraphNode["breakdown"]>] as number) || 0),
          0
        ) / n
      ).toFixed(2)
    );
    let observed = "";
    switch (f.id) {
      case "F1":
        observed = `${nodes.filter((x) => x.sourcifyStatus === "full_match").length} / ${nodes.length} Full Match`;
        break;
      case "F2":
        observed = countBy(nodes, (x) => x.adminType);
        break;
      case "F3":
        observed = countBy(nodes, (x) => x.proxyType);
        break;
      case "F4": {
        const st = oracles.map((x) => x.oracleStaleness ?? 0);
        observed = st.length
          ? `${Math.min(...st).toFixed(2)} - ${Math.max(...st).toFixed(2)} ratio (${st.length} feeds)`
          : "no oracle nodes";
        break;
      }
      case "F5":
        observed = safes.length
          ? safes.map((x) => `${x.safeThreshold} of ${x.safeOwnerCount}`).join(", ")
          : "no multisig nodes";
        break;
      case "F6":
        observed = "Derived from graph-service age input";
        break;
      default:
        observed = `${nodes.filter((x) => (x.breakdown?.f7_incident_history || 0) > 0).length} contracts with incidents`;
    }
    return { ...f, pts, observed, status: pts === 0 ? "optimal" : "flagged" };
  });
}


function AuditMethodologyContent() {
  const searchParams = useSearchParams();
  const protocolId = searchParams.get("protocol") || "aave-v3-mainnet";
  const { data: snap, error: snapError, loading: snapLoading, reload } = useGraphSnapshot(protocolId);

  const [trail, setTrail] = useState<{
    values: Record<number, string>;
    errors: Record<number, string>;
  } | null>(null);
  const [arkivKey, setArkivKey] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const ctrl = new AbortController();
    runTrail(TRAIL_QUERIES, ctrl.signal).then((r) => {
      if (!ctrl.signal.aborted) setTrail(r);
    });
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    let alive = true;
    fetchArkivSnapshot(protocolId)
      .then((r) => alive && setArkivKey(r ? String(r.$key) : null))
      .catch(() => alive && setArkivKey(null));
    return () => {
      alive = false;
    };
  }, [protocolId]);

  const factorRows = useMemo(() => (snap ? buildFactorRows(snap.nodes) : []), [snap]);
  const risk = getRiskScoreConfig(snap?.compositeScore ?? 0);
  const hopRows = useMemo(() => {
    if (!snap) return [];
    const defs = [
      { hop: 0, title: "Hop 0 · Core", weight: 1.0, avg: snap.hopScores.hop0Avg },
      { hop: 1, title: "Hop 1 · Logic & Governance", weight: 0.5, avg: snap.hopScores.hop1Avg },
      { hop: 2, title: "Hop 2 · Oracle Feeds", weight: 0.25, avg: snap.hopScores.hop2Avg },
    ];
    return defs.map((d) => ({
      ...d,
      members: snap.nodes.filter((n) => n.hop === d.hop),
      contribution: Number((d.avg * d.weight).toFixed(2)),
    }));
  }, [snap]);

  const [activeTab, setActiveTab] = useState<"trail" | "matrix" | "hops" | "proofs">("trail");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  if (snapLoading || !snap) {
    return (
      <div className="min-h-screen bg-[#101010] flex flex-col items-center justify-center gap-3 text-[13px] font-mono text-[#9c9c9c] p-6 text-center">
        {snapError ? (
          <>
            <span className="text-[#f3f3f3]">Audit data unavailable</span>
            <span className="max-w-md">{snapError}</span>
            <span className="text-[11px] text-[#6f6759]">
              Expected graph-service at {GRAPH_SERVICE_URL}
            </span>
            <button
              onClick={reload}
              className="mt-2 px-4 py-1.5 rounded-[6px] border border-[#474747] text-[#f3f3f3] uppercase tracking-wider text-[11px] hover:border-[#f3f3f3] cursor-pointer"
            >
              Retry
            </button>
          </>
        ) : (
          <span>Loading live risk snapshot…</span>
        )}
      </div>
    );
  }

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
            <span className={risk.textColor}>{snap.compositeScore.toFixed(1)} ({snap.riskTier} RISK)</span>
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
              Evaluated on Ethereum Block #{snap.evaluatedAtBlock} · Fingerprint {snap.fingerprint.slice(0, 10)}… · {snap.nodeCount} contracts
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#6f6759] block">
                Composite Score
              </span>
              <span className={`text-[28px] font-mono leading-none ${risk.textColor}`}>{snap.compositeScore.toFixed(1)}</span>
            </div>
            <div className="h-8 w-[1px] bg-[#212121]" />
            <div className="text-[11px] text-[#9c9c9c] font-mono">
              {hopRows.map((h) => (
                <div key={h.hop}>Hop {h.hop}: {h.contribution.toFixed(2)}</div>
              ))}
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
              <span>Public RPC Gateway: {RPC_URL}</span>
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
                      {(() => {
                        const v = trail?.values[s.step];
                        const err = trail?.errors[s.step];
                        const text = err ? `RPC error: ${err}` : v ?? "Querying mainnet…";
                        return (
                          <span className={`${err ? "text-[#eab308]" : "text-[#98ff38]"} truncate block`} title={text}>
                            {text}
                          </span>
                        );
                      })()}
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
                {factorRows.map((f) => (
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
              {hopRows.map((h) => (
                <div
                  key={h.hop}
                  className="p-4 rounded-[6px] bg-[#080808] border border-[#212121] font-mono text-[11px] space-y-2"
                >
                  <div className="flex justify-between text-[#f3f3f3]">
                    <span>{h.title}</span>
                    <span className="text-[#6f6759]">Weight {h.weight.toFixed(2)}</span>
                  </div>
                  <div className="text-[#9c9c9c]">
                    {h.members.length} contracts
                    {h.members.length > 0 && (
                      <span className="block truncate" title={h.members.map((m) => m.label).join(", ")}>
                        {h.members.map((m) => m.label).join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="text-[#9c9c9c]">Avg Risk: {h.avg.toFixed(2)}</div>
                  <div className="text-[#98ff38] text-[13px] pt-1 border-t border-[#212121]">
                    Contribution: {h.contribution.toFixed(2)} pts
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 text-right font-mono text-[12px] text-[#9c9c9c] bg-[#080808] rounded-[6px] border border-[#212121]">
              Sum: {hopRows.map((h) => h.contribution.toFixed(2)).join(" + ")} ={" "}
              <span className={risk.textColor}>
                {hopRows.reduce((a, h) => a + h.contribution, 0).toFixed(2)}
              </span>{" "}
              ➔ Final: <span className={`${risk.textColor} font-bold`}>{snap.compositeScore.toFixed(1)} ({snap.riskTier})</span>
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
                <span className="text-[#6f6759]">risk_snapshot_v1</span>
              </div>
              <div className="text-[#9c9c9c]">Latest risk snapshot entity key</div>
              <div className="p-2.5 rounded bg-[#101010] border border-[#212121] flex items-center justify-between text-[#9c9c9c]">
                <span className="truncate mr-2">
                  {arkivKey === undefined
                    ? "Querying Arkiv…"
                    : arkivKey ?? "Not found in Arkiv (check NEXT_PUBLIC_ARKIV_ACCESS_KEY)"}
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
                  <span>Swarm Graph & Evidence</span>
                </span>
                <span className="text-[#6f6759]">Snapshot {snap.snapshotId}</span>
              </div>
              {[
                { label: "Graph", ref: snap.swarmGraphRef },
                { label: "Evidence", ref: snap.swarmEvidenceRef },
              ].map((r) => (
                <div
                  key={r.label}
                  className="p-2.5 rounded bg-[#101010] border border-[#212121] flex items-center justify-between text-[#9c9c9c]"
                >
                  <span className="truncate mr-2" title={r.ref}>
                    {r.label}: {r.ref || "not uploaded"}
                  </span>
                  {r.ref && (
                    <a
                      href={`${(process.env.NEXT_PUBLIC_SWARM_GATEWAY || "https://api.gateway.ethswarm.org").replace(/\/$/, "")}/bzz/${r.ref}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-[#f3f3f3]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
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

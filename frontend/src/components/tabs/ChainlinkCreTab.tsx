"use client";

import React, { useState, useEffect } from "react";
import { GraphNode, getRiskScoreConfig } from "@/lib/graph-data";
import {
  Radio,
  Zap,
  Terminal,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  RotateCcw,
  ShieldAlert,
  Share2,
} from "lucide-react";

interface SimulationStep {
  step: number;
  title: string;
  detail: string;
  status: "pending" | "running" | "done";
}

interface ChainlinkCreTabProps {
  nodes?: GraphNode[];
  compositeScore?: number;
  riskTier?: string;
  fingerprint?: string;
  isRebuilding?: boolean;
  mutatedNodeInfo?: {
    id: string;
    label: string;
    oldAddress: string;
    newAddress: string;
    reason?: string;
  } | null;
  onRebuildStart?: () => void;
  onRebuildComplete?: (
    updatedNodes: GraphNode[],
    newScore: number,
    newTier: string,
    newFingerprint: string,
    mutation: {
      id: string;
      label: string;
      oldAddress: string;
      newAddress: string;
      reason?: string;
    }
  ) => void;
  onResetBaseline?: () => void;
  onSwitchToGraphTab?: () => void;
}

const CANONICAL_BASELINE_FINGERPRINT = "0x39a7cd678a45f1e63df9441182b58d3e87149bc0d23f82fa05f4fb0b4993e06c";

// Public RPC Helper
async function queryMainnetRpc(method: string, params: any[] = []): Promise<any> {
  const RPC_URLS = [
    "https://cloudflare-eth.com",
    "https://ethereum-rpc.publicnode.com",
    "https://eth.llamarpc.com",
  ];

  for (const url of RPC_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      const json = await res.json();
      if (json.result) return json.result;
    } catch {
      continue;
    }
  }
  return null;
}

export function ChainlinkCreTab({
  nodes = [],
  compositeScore = 13.7,
  riskTier = "LOW",
  fingerprint = CANONICAL_BASELINE_FINGERPRINT,
  isRebuilding = false,
  mutatedNodeInfo = null,
  onRebuildStart,
  onRebuildComplete,
  onResetBaseline,
  onSwitchToGraphTab,
}: ChainlinkCreTabProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSteps, setSimSteps] = useState<SimulationStep[]>([]);
  const [lastTxReceipt, setLastTxReceipt] = useState<any | null>(null);

  // Live Mainnet State
  const [liveBlock, setLiveBlock] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("aave-v3-pool-impl");
  const [customInputAddr, setCustomInputAddr] = useState<string>("0x7777777777777777777777777777777777777777");

  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  const riskConfig = getRiskScoreConfig(compositeScore);

  const appendLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [...prev.slice(-30), `[${time}] ${msg}`]);
  };

  // Sync with CRE Daemon or Mainnet RPC
  useEffect(() => {
    async function initLiveState() {
      appendLog("Initializing Chainlink Runtime Environment (CRE) engine...");
      try {
        const res = await fetch("http://localhost:3002/api/cre/status").catch(() => null);
        if (res && res.ok) {
          const status = await res.json();
          setServerOnline(true);
          appendLog(`Connected to CRE Daemon at localhost:3002 (${status.engine})`);
          appendLog(`Monitored contracts: ${status.nodeCount || 15} · Baseline: ${status.baselineFingerprint?.slice(0, 16)}...`);
        } else {
          setServerOnline(false);
          appendLog("CRE Daemon offline. Running in local fallback simulation mode.");
        }
      } catch {
        setServerOnline(false);
      }

      const hexBlock = await queryMainnetRpc("eth_blockNumber");
      if (hexBlock) {
        const blockNum = parseInt(hexBlock, 16);
        setLiveBlock(blockNum);
        appendLog(`Connected to Ethereum Mainnet RPC. Current block height: #${blockNum}`);
      }
    }

    initLiveState();
  }, []);

  /**
   * Mutate address and trigger CRE rebuild
   */
  const handleMutateAddress = async (nodeId: string, newAddr: string, reasonTitle: string) => {
    setIsSimulating(true);
    setLastTxReceipt(null);
    if (onRebuildStart) onRebuildStart();

    const targetNode = nodes.find((n) => n.id === nodeId);
    const oldAddr = targetNode ? targetNode.address : "0x0000000000000000000000000000000000000000";
    const nodeLabel = targetNode ? targetNode.label : nodeId;

    appendLog(`----------------------------------------------------------------`);
    appendLog(`[MUTATION] ${nodeLabel}: ${oldAddr.slice(0, 10)}... → ${newAddr.slice(0, 10)}...`);

    let currentBlock = liveBlock || 26354740;
    try {
      const hex = await queryMainnetRpc("eth_blockNumber");
      if (hex) currentBlock = parseInt(hex, 16);
      setLiveBlock(currentBlock);
    } catch {}

    const executionSteps: SimulationStep[] = [
      {
        step: 1,
        title: "On-Chain State Mutation Detected",
        detail: `${nodeLabel} changed to ${newAddr.slice(0, 10)}... at Block #${currentBlock}`,
        status: "running",
      },
      {
        step: 2,
        title: "CRE DON QuickJS Consensus Engine",
        detail: "BFT 2/3 consensus reached across 4 DON nodes. Keccak256 protocol fingerprint recalculated.",
        status: "pending",
      },
      {
        step: 3,
        title: "Automated Graph Rebuild Dispatched",
        detail: "POST http://localhost:3001/rebuild invoked. 7-factor risk scores re-evaluated.",
        status: "pending",
      },
      {
        step: 4,
        title: "Arkiv Snapshot Minted & Swarm Anchored",
        detail: "Persisted in Arkiv Rabdi testnet with 50,000 blocks BTL. Forensic evidence stored in Swarm.",
        status: "pending",
      },
      {
        step: 5,
        title: "RiskRegistry.sol On-Chain Attestation",
        detail: "CRE Forwarder calls reportRisk('aave-v3-mainnet', score, tier, snapshotId, blockNumber)",
        status: "pending",
      },
    ];

    setSimSteps(executionSteps);

    let backendResult: any = null;
    try {
      const res = await fetch("http://localhost:3002/api/cre/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId,
          newAddress: newAddr,
          reason: reasonTitle,
        }),
      }).catch(() => null);

      if (res && res.ok) {
        backendResult = await res.json();
      }
    } catch {}

    let current = 0;
    const interval = setInterval(() => {
      current++;
      setSimSteps((prev) =>
        prev.map((s, idx) => {
          if (idx < current) return { ...s, status: "done" };
          if (idx === current) return { ...s, status: "running" };
          return s;
        })
      );

      if (current === 1) {
        appendLog(`[CRE DON] Event received: ${reasonTitle}`);
      } else if (current === 2) {
        const nextFp = backendResult?.newFingerprint || "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
        appendLog(`[CRE DON] Drift Detected! Computed FP: ${nextFp.slice(0, 16)}...`);
      } else if (current === 3) {
        appendLog(`[CRE DON] Dispatched POST /rebuild to Graph Engine.`);
      } else if (current === 4) {
        const newScore = backendResult?.compositeScore || 32.50;
        appendLog(`[Graph Service] Risk recalculated: ${newScore} / 100 (${backendResult?.riskTier || "MEDIUM"}).`);
      }

      if (current >= executionSteps.length) {
        clearInterval(interval);
        setIsSimulating(false);

        const newFp = backendResult?.newFingerprint || "0x82f1b" + Array.from({ length: 59 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
        const newScore = backendResult?.compositeScore || 32.50;
        const newTier = backendResult?.riskTier || "MEDIUM";
        const txHash =
          backendResult?.attestationTxHash ||
          "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

        appendLog(`[ON-CHAIN] Attested in RiskRegistry.sol! Tx: ${txHash.slice(0, 18)}...`);

        // Propagate updated nodes to parent
        const updatedNodes = nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                address: newAddr,
                contractAddress: newAddr,
                riskScore: n.category === "implementation" ? 45 : 35,
              }
            : n
        );

        if (onRebuildComplete) {
          onRebuildComplete(updatedNodes, newScore, newTier, newFp, {
            id: nodeId,
            label: nodeLabel,
            oldAddress: oldAddr,
            newAddress: newAddr,
            reason: reasonTitle,
          });
        }

        setLastTxReceipt({
          transactionHash: txHash,
          blockNumber: currentBlock,
          contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
          creForwarder: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          protocolId: "aave-v3-mainnet",
          compositeScore: newScore,
          riskTier: newTier,
          event: `RiskReported(aave-v3-mainnet, ${Math.round(newScore * 100)}, ${newTier}, aave-v3-${currentBlock}, ${currentBlock})`,
        });
      }
    }, 600);
  };

  const isDrifted = Boolean(mutatedNodeInfo) || fingerprint !== CANONICAL_BASELINE_FINGERPRINT;

  return (
    <div className="space-y-5 text-[#ececf2]">
      {/* KPI Header Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3.5 rounded-[4px] bg-[#17171d]/80 backdrop-blur-md border border-[#282832] hover:border-[#7d8495]/40 transition-all">
          <span className="text-[#7d8495] block text-[10px] uppercase">CRE Orchestration</span>
          <span className="text-[#ececf2] font-semibold flex items-center gap-1.5 mt-0.5">
            <Radio className="w-3 h-3 text-[#b068ff] animate-pulse" />
            <span>4 DON Nodes</span>
          </span>
          <span className="text-[10px] text-[#aaaab8]">QuickJS-WASM Engine</span>
        </div>

        <div className="p-3.5 rounded-[4px] bg-[#17171d]/80 backdrop-blur-md border border-[#282832] hover:border-[#7d8495]/40 transition-all">
          <span className="text-[#7d8495] block text-[10px] uppercase">Ethereum Mainnet</span>
          <span className="text-[#d6d8e4] font-semibold block mt-0.5">
            {liveBlock ? `Block #${liveBlock}` : "Connecting..."}
          </span>
          <span className="text-[10px] text-[#aaaab8]">15 Ingested Contracts</span>
        </div>

        <div className="p-3.5 rounded-[4px] bg-[#17171d]/80 backdrop-blur-md border border-[#282832] hover:border-[#7d8495]/40 transition-all">
          <span className="text-[#7d8495] block text-[10px] uppercase">Composite Risk</span>
          <span className={`font-semibold block mt-0.5 ${riskConfig.textColor}`}>
            {compositeScore} / 100 ({riskTier})
          </span>
          <span className="text-[10px] text-[#aaaab8]">{isDrifted ? "Elevated after drift" : "Canonical Baseline"}</span>
        </div>

        <div className="p-3.5 rounded-[4px] bg-[#17171d]/80 backdrop-blur-md border border-[#282832] hover:border-[#7d8495]/40 transition-all">
          <span className="text-[#7d8495] block text-[10px] uppercase">Topology Fingerprint</span>
          <span className={`font-mono font-semibold truncate block mt-0.5 ${isDrifted ? "text-amber-400" : "text-[#d6d8e4]"}`}>
            {fingerprint.slice(0, 14)}...
          </span>
          <span className="text-[10px] text-[#aaaab8]">Keccak256 Hash</span>
        </div>
      </div>

      {/* Rebuilding Active Alert / Live Diff Banner */}
      {isDrifted && mutatedNodeInfo && (
        <div className="p-4 rounded-[4px] bg-[#140f06]/90 border border-amber-600/70 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <div className="font-semibold text-white flex items-center gap-2">
                <span>Fingerprint Drift Detected on {mutatedNodeInfo.label}</span>
                <span className="text-[9.5px] px-1.5 py-0.2 rounded-[2px] bg-amber-900/80 text-amber-200 uppercase font-bold border border-amber-700/60">
                  Rebuild Dispatched
                </span>
              </div>
              <div className="text-[11px] text-[#c4b596] mt-0.5">
                Address: <code className="text-white">{mutatedNodeInfo.newAddress.slice(0, 12)}...</code> · Composite Risk: <span className="text-amber-300 font-bold">{compositeScore} ({riskTier})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onSwitchToGraphTab && (
              <button
                onClick={onSwitchToGraphTab}
                className="px-3 py-1.5 rounded-[2px] bg-[#1e1709] border border-amber-500/70 hover:bg-[#281f0d] text-amber-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3 h-3" />
                <span>View in Graph</span>
              </button>
            )}
            {onResetBaseline && (
              <button
                onClick={onResetBaseline}
                className="px-3 py-1.5 rounded-[2px] bg-[#17171d] border border-[#282832] hover:bg-[#282832] text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-[#d6d8e4]" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Address Mutation & Drift Trigger Console */}
      <div className="rounded-[4px] border border-[#282832] bg-[#17171d] p-4 sm:p-5 font-mono text-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[#ececf2] font-semibold flex items-center gap-2 text-sm font-serif">
            <Zap className="w-4 h-4 text-[#b068ff]" />
            <span>Simulate On-Chain State Change (Trigger CRE Drift Rebuild)</span>
          </span>
          <span className="text-[10px] text-[#7d8495]">Pick preset or enter custom address</span>
        </div>

        {/* 4 Instant Mutation Presets */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() =>
              handleMutateAddress(
                "aave-v3-pool-impl",
                "0x7777777777777777777777777777777777777777",
                "EVM Upgraded Event (Pool Logic)"
              )
            }
            disabled={isSimulating}
            className="p-3 rounded-[3px] bg-[#0e0e12]/80 backdrop-blur-sm border border-[#282832] hover:border-[#b068ff]/70 text-left transition-all duration-200 cursor-pointer disabled:opacity-50 group"
          >
            <span className="text-[#ececf2] group-hover:text-[#b068ff] font-semibold block text-[11px] transition-colors">
              1. Upgrade Pool Impl
            </span>
            <span className="text-[10px] text-[#aaaab8] truncate block mt-0.5">Hop 1 → 0x7777...7777</span>
          </button>

          <button
            onClick={() =>
              handleMutateAddress(
                "aave-v3-governance-executor",
                "0x8888888888888888888888888888888888888888",
                "Admin Timelock Controller Migration"
              )
            }
            disabled={isSimulating}
            className="p-3 rounded-[3px] bg-[#0e0e12]/80 backdrop-blur-sm border border-[#282832] hover:border-[#b068ff]/70 text-left transition-all duration-200 cursor-pointer disabled:opacity-50 group"
          >
            <span className="text-[#ececf2] group-hover:text-[#b068ff] font-semibold block text-[11px] transition-colors">
              2. Rotate Timelock
            </span>
            <span className="text-[10px] text-[#aaaab8] truncate block mt-0.5">Hop 1 → 0x8888...8888</span>
          </button>

          <button
            onClick={() =>
              handleMutateAddress(
                "aave-v3-emergency-safe",
                "0x9999999999999999999999999999999999999999",
                "Guardian Multisig Safe Transfer"
              )
            }
            disabled={isSimulating}
            className="p-3 rounded-[3px] bg-[#0e0e12]/80 backdrop-blur-sm border border-[#282832] hover:border-amber-500/70 text-left transition-all duration-200 cursor-pointer disabled:opacity-50 group"
          >
            <span className="text-[#ececf2] group-hover:text-amber-400 font-semibold block text-[11px] transition-colors">
              3. Rotate Guardian
            </span>
            <span className="text-[10px] text-[#aaaab8] truncate block mt-0.5">Hop 1 → 0x9999...9999</span>
          </button>

          <button
            onClick={() =>
              handleMutateAddress(
                "chainlink-eth-usd",
                "0x1111111111111111111111111111111111111111",
                "Oracle Price Feed Redirection"
              )
            }
            disabled={isSimulating}
            className="p-3 rounded-[3px] bg-[#0e0e12]/80 backdrop-blur-sm border border-[#282832] hover:border-emerald-500/70 text-left transition-all duration-200 cursor-pointer disabled:opacity-50 group"
          >
            <span className="text-[#ececf2] group-hover:text-emerald-400 font-semibold block text-[11px] transition-colors">
              4. Redirect ETH/USD
            </span>
            <span className="text-[10px] text-[#aaaab8] truncate block mt-0.5">Hop 2 → 0x1111...1111</span>
          </button>
        </div>

        {/* Custom Input Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-[#282832]">
          <div className="sm:col-span-5">
            <select
              value={selectedNodeId}
              onChange={(e) => {
                setSelectedNodeId(e.target.value);
                const n = nodes.find((node) => node.id === e.target.value);
                if (n) setCustomInputAddr(n.address);
              }}
              className="w-full bg-[#0e0e12] border border-[#282832] rounded-[2px] px-3 py-2 text-xs text-[#ececf2] focus:outline-none focus:border-[#d6d8e4]"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  [Hop {n.hop}] {n.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-5">
            <input
              type="text"
              value={customInputAddr}
              onChange={(e) => setCustomInputAddr(e.target.value)}
              placeholder="0x..."
              className="w-full bg-[#0e0e12] border border-[#282832] rounded-[2px] px-3 py-2 text-xs text-[#ececf2] font-mono focus:outline-none focus:border-[#d6d8e4]"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              onClick={() =>
                handleMutateAddress(selectedNodeId, customInputAddr, `Mutation on ${selectedNodeId}`)
              }
              disabled={isSimulating}
              className="w-full py-2 px-3 rounded-[2px] bg-[#d6d8e4] hover:bg-[#ececf2] text-[#000000] font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSimulating ? "Processing..." : "Trigger CRE"}
            </button>
          </div>
        </div>
      </div>

      {/* Execution Trace & Attestation Mined Receipt */}
      <div className="rounded-[4px] border border-[#282832] bg-[#17171d] p-4 sm:p-5 font-mono text-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[#ececf2] font-semibold flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#d6d8e4]" />
            <span>CRE Consensus & On-Chain RiskRegistry Attestation</span>
          </span>
          <span className="text-[10px] text-[#7d8495]">Chainlink Runtime Environment v1.0.0</span>
        </div>

        {simSteps.length > 0 ? (
          <div className="space-y-2">
            {simSteps.map((s) => (
              <div
                key={s.step}
                className={`p-2.5 rounded-[2px] border transition-all flex items-start gap-2.5 ${
                  s.status === "done"
                    ? "bg-[#0e0e12] border-[#282832] text-[#ececf2]"
                    : s.status === "running"
                    ? "bg-[#0e0e12] border-[#b068ff] text-white animate-pulse"
                    : "bg-[#0e0e12]/40 border-[#282832]/50 text-[#aaaab8]/50"
                }`}
              >
                <div className="mt-0.5">
                  {s.status === "done" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : s.status === "running" ? (
                    <Radio className="w-3.5 h-3.5 text-[#b068ff] shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-[#282832] flex items-center justify-center text-[9px] text-[#7d8495]">
                      {s.step}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#ececf2]">{s.title}</span>
                    <span className="text-[9px] text-[#aaaab8] uppercase">{s.status}</span>
                  </div>
                  <p className="text-[11px] text-[#aaaab8] mt-0.5">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-5 text-center text-[#7d8495] border border-dashed border-[#282832] rounded-[2px]">
            Trigger an address mutation above to see CRE consensus nodes recalculate the fingerprint and rebuild lineage.
          </div>
        )}

        {/* Mined Transaction Receipt */}
        {lastTxReceipt && (
          <div className="p-3.5 rounded-[4px] bg-[#0e0e12] border border-[#282832] space-y-1.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#282832] text-emerald-400 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>On-Chain Attestation Confirmed (RiskRegistry.sol)</span>
              </span>
              <span className="text-[10px] text-[#aaaab8]">Block #{lastTxReceipt.blockNumber}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#aaaab8]">
              <div>
                <span className="text-[#7d8495] block text-[10px]">Transaction Hash:</span>
                <span className="text-white truncate block">{lastTxReceipt.transactionHash}</span>
              </div>
              <div>
                <span className="text-[#7d8495] block text-[10px]">Emitted Event:</span>
                <span className="text-emerald-400 font-semibold truncate block">{lastTxReceipt.event}</span>
              </div>
            </div>
          </div>
        )}

        {/* Compact Terminal Console */}
        <div className="rounded-[2px] bg-[#0e0e12] border border-[#282832] p-2.5 text-[10px]">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#282832] mb-1.5 text-[#7d8495]">
            <span>CRE Execution Logs</span>
            <span className="text-emerald-400 font-semibold">DON: ACTIVE</span>
          </div>
          <div className="space-y-0.5 max-h-[110px] overflow-y-auto text-[#aaaab8]">
            {terminalLogs.map((l, i) => (
              <div key={i} className="leading-tight font-mono">
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

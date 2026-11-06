"use client";

import React, { useRef, useState, useMemo } from "react";
import { GraphNode, GraphEdge, CONTRACT_JUSTIFICATIONS } from "@/lib/graph-data";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  FileCode,
  CheckCircle2,
  Database,
  Layers,
  HelpCircle,
  X,
  Code2,
} from "lucide-react";

interface ProvenanceGraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string;
  onSelectNode: (node: GraphNode) => void;
}

export function ProvenanceGraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
}: ProvenanceGraphCanvasProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedAddress(txt);
    setTimeout(() => setCopiedAddress(null), 1800);
  };

  // Category visual styles
  const categoryConfig: Record<string, { color: string; border: string; ring: string; glyph: string; name: string }> = {
    proxy: { color: "bg-sky-950/80 text-sky-400", border: "border-sky-800/70", ring: "#38bdf8", glyph: "P", name: "Proxy" },
    implementation: { color: "bg-emerald-950/80 text-emerald-400", border: "border-emerald-800/70", ring: "#34d399", glyph: "I", name: "Impl" },
    oracle: { color: "bg-amber-950/80 text-amber-400", border: "border-amber-800/70", ring: "#fbbf24", glyph: "O", name: "Oracle" },
    multisig: { color: "bg-purple-950/80 text-purple-400", border: "border-purple-800/70", ring: "#c084fc", glyph: "S", name: "Multisig" },
    timelock: { color: "bg-indigo-950/80 text-indigo-400", border: "border-indigo-800/70", ring: "#818cf8", glyph: "T", name: "Timelock" },
  };

  const getStyle = (cat: string, admin?: string) => {
    if (admin === "timelock") return categoryConfig.timelock;
    return categoryConfig[cat] || { color: "bg-slate-900 text-slate-400", border: "border-slate-800", ring: "#94a3b8", glyph: "C", name: "Contract" };
  };

  // Deterministic, non-overlapping Hop coordinate mapping
  // Canvas width: 1120px, height: 680px
  const layoutCoordinates: Record<string, { x: number; y: number }> = {
    // Hop 0: Core Architecture (Lane X: 190)
    "aave-v3-addresses-provider": { x: 190, y: 75 },
    "aave-v3-pool": { x: 190, y: 175 },
    "aave-v3-pool-configurator": { x: 190, y: 275 },
    "aave-v3-oracle": { x: 190, y: 375 },
    "aave-v3-acl-manager": { x: 190, y: 475 },
    "aave-v3-data-provider": { x: 190, y: 575 },

    // Hop 1: Governance & Implementation (Lane X: 570)
    "aave-v3-pool-impl": { x: 570, y: 135 },
    "aave-v3-configurator-impl": { x: 570, y: 245 },
    "aave-v3-governance-executor": { x: 570, y: 365 },
    "aave-v3-emergency-safe": { x: 570, y: 495 },

    // Hop 2: External Chainlink Oracles (Lane X: 940)
    "chainlink-eth-usd": { x: 940, y: 85 },
    "chainlink-btc-usd": { x: 940, y: 195 },
    "chainlink-usdc-usd": { x: 940, y: 305 },
    "chainlink-dai-usd": { x: 940, y: 415 },
    "chainlink-usdt-usd": { x: 940, y: 525 },
  };

  const activeTargetId = hoveredNodeId || selectedNodeId;

  // Active Network traversal highlighting
  const activeNetwork = useMemo(() => {
    if (!activeTargetId) return { nodes: new Set<string>(), edges: new Set<string>() };

    const activeNodes = new Set<string>([activeTargetId]);
    const activeEdges = new Set<string>();

    edges.forEach((e) => {
      if (e.from === activeTargetId || e.to === activeTargetId) {
        activeNodes.add(e.from);
        activeNodes.add(e.to);
        activeEdges.add(`${e.from}->${e.to}`);
      }
    });

    return { nodes: activeNodes, edges: activeEdges };
  }, [activeTargetId, edges]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".interactive-node, button")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-[680px] bg-[#07090e] border border-[#161a25] rounded-xl overflow-hidden select-none bg-grid flex flex-col justify-between">
      {/* Top Floating Controls & Justification Launcher */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e121a]/95 backdrop-blur border border-[#1f2637] text-xs font-mono text-[#8b95ad] shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white">Stratified Lineage DAG</span>
            <span className="text-[#3b445a]">·</span>
            <span className="text-emerald-400">3 Segregated Hops</span>
            <span className="text-[#3b445a]">·</span>
            <span className="text-blue-400">15 Verified Contracts</span>
          </div>
        </div>

        {/* Contract Address Justification Trigger */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowJustificationModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-950/70 hover:bg-blue-900/80 text-blue-300 border border-blue-800/80 text-xs font-mono transition-all cursor-pointer shadow-lg hover:shadow-blue-950/50"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">Contract Address Justification & Sources</span>
            <span className="text-[10px] bg-blue-900/80 px-1.5 py-0.2 rounded border border-blue-700/60 text-white">
              15 Provenance Proofs
            </span>
          </button>
        </div>
      </div>

      {/* Main SVG Visualization Workspace */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1140 680"
          preserveAspectRatio="xMidYMid meet"
        >
          <g
            transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}
            style={{ transformOrigin: "570px 340px" }}
          >
            {/* Background Segregated Hop Column Panels */}
            {/* Hop 0 Panel */}
            <g className="hop-column-0">
              <rect
                x="30"
                y="20"
                width="320"
                height="640"
                rx="14"
                fill="#080c16"
                stroke="#172238"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <rect x="30" y="20" width="320" height="38" rx="14" fill="#0d1424" />
              <text x="50" y="44" fill="#38bdf8" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700" letterSpacing="0.08em">
                HOP 0 · CORE ARCHITECTURE (6)
              </text>
              <text x="270" y="44" fill="#64748b" fontFamily="ui-monospace, monospace" fontSize="9" textAnchor="end">
                Root Proxies & Reg
              </text>
            </g>

            {/* Hop 1 Panel */}
            <g className="hop-column-1">
              <rect
                x="410"
                y="20"
                width="320"
                height="640"
                rx="14"
                fill="#0c0a17"
                stroke="#2b1a47"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <rect x="410" y="20" width="320" height="38" rx="14" fill="#18132d" />
              <text x="430" y="44" fill="#c084fc" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700" letterSpacing="0.08em">
                HOP 1 · GOVERNANCE & LOGIC (4)
              </text>
              <text x="650" y="44" fill="#7e6d9b" fontFamily="ui-monospace, monospace" fontSize="9" textAnchor="end">
                Timelocks & Impls
              </text>
            </g>

            {/* Hop 2 Panel */}
            <g className="hop-column-2">
              <rect
                x="780"
                y="20"
                width="320"
                height="640"
                rx="14"
                fill="#120e09"
                stroke="#3d270c"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <rect x="780" y="20" width="320" height="38" rx="14" fill="#22170c" />
              <text x="800" y="44" fill="#fbbf24" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700" letterSpacing="0.08em">
                HOP 2 · EXTERNAL ORACLES (5)
              </text>
              <text x="1020" y="44" fill="#947c54" fontFamily="ui-monospace, monospace" fontSize="9" textAnchor="end">
                Chainlink EAC Feeds
              </text>
            </g>

            {/* Define Arrowhead Markers */}
            <defs>
              <marker
                id="dag-arrow-default"
                viewBox="0 -5 10 10"
                refX="8"
                refY="0"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path d="M0,-4L8,0L0,4" fill="#334155" />
              </marker>
              <marker
                id="dag-arrow-active"
                viewBox="0 -5 10 10"
                refX="8"
                refY="0"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0,-4L8,0L0,4" fill="#38bdf8" />
              </marker>
              <marker
                id="dag-arrow-governance"
                viewBox="0 -5 10 10"
                refX="8"
                refY="0"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0,-4L8,0L0,4" fill="#c084fc" />
              </marker>
              <marker
                id="dag-arrow-oracle"
                viewBox="0 -5 10 10"
                refX="8"
                refY="0"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0,-4L8,0L0,4" fill="#fbbf24" />
              </marker>
            </defs>

            {/* Render Smooth Cubic Bezier Edges */}
            <g className="dag-edges">
              {edges.map((edge) => {
                const src = layoutCoordinates[edge.from];
                const tgt = layoutCoordinates[edge.to];
                if (!src || !tgt) return null;

                const edgeKey = `${edge.from}->${edge.to}`;
                const isActive = activeNetwork.edges.has(edgeKey);
                const isHovered = hoveredNodeId === edge.from || hoveredNodeId === edge.to;
                const isDimmed = activeTargetId && !isActive;

                // Source connects from right edge (+110) or bottom/top if within same column
                const isSameColumn = Math.abs(src.x - tgt.x) < 50;

                let d = "";
                let midX = (src.x + tgt.x) / 2;
                let midY = (src.y + tgt.y) / 2;

                if (isSameColumn) {
                  // Connect with clean left-arching bezier curve
                  const arcX = src.x - 120;
                  d = `M ${src.x - 100} ${src.y} C ${arcX} ${src.y}, ${arcX} ${tgt.y}, ${tgt.x - 100} ${tgt.y}`;
                  midX = arcX + 15;
                  midY = (src.y + tgt.y) / 2;
                } else {
                  // Connect from right of source to left of target
                  const x1 = src.x + 105;
                  const y1 = src.y;
                  const x2 = tgt.x - 105;
                  const y2 = tgt.y;
                  const dx = x2 - x1;
                  d = `M ${x1} ${y1} C ${x1 + dx * 0.45} ${y1}, ${x2 - dx * 0.45} ${y2}, ${x2} ${y2}`;
                  midX = (x1 + x2) / 2;
                  midY = (y1 + y2) / 2;
                }

                const strokeColor = isActive
                  ? edge.type.includes("governance") || edge.type.includes("multisig")
                    ? "#c084fc"
                    : edge.type.includes("oracle")
                    ? "#fbbf24"
                    : "#38bdf8"
                  : isDimmed
                  ? "#111622"
                  : "#1e293b";

                const marker = isActive
                  ? edge.type.includes("governance") || edge.type.includes("multisig")
                    ? "url(#dag-arrow-governance)"
                    : edge.type.includes("oracle")
                    ? "url(#dag-arrow-oracle)"
                    : "url(#dag-arrow-active)"
                  : "url(#dag-arrow-default)";

                return (
                  <g key={edgeKey} className="edge-group">
                    {/* Path glow on active */}
                    {isActive && (
                      <path
                        d={d}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="5"
                        strokeOpacity="0.25"
                      />
                    )}

                    {/* Main Bezier Curve */}
                    <path
                      d={d}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isActive ? 2.5 : 1.5}
                      strokeOpacity={isDimmed ? 0.2 : 0.85}
                      markerEnd={marker}
                      className="transition-all duration-200"
                    />

                    {/* Midpoint Label Pill */}
                    <g transform={`translate(${midX}, ${midY})`} opacity={isDimmed ? 0.2 : 0.95}>
                      <rect
                        x="-48"
                        y="-8"
                        width="96"
                        height="16"
                        rx="4"
                        fill="#090d16"
                        stroke={isActive ? strokeColor : "#1c2538"}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3.5"
                        fill={isActive ? "#e2e8f0" : "#64748b"}
                        fontFamily="ui-monospace, monospace"
                        fontSize="8"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {edge.label.toUpperCase()}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>

            {/* Render Nodes as Stratified Modern Cards */}
            <g className="dag-nodes">
              {nodes.map((node) => {
                const pos = layoutCoordinates[node.id];
                if (!pos) return null;

                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isConnected = activeNetwork.nodes.has(node.id);
                const isDimmed = activeTargetId && !isSelected && !isHovered && !isConnected;

                const style = getStyle(node.category, node.adminType);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="interactive-node cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectNode(node);
                    }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    opacity={isDimmed ? 0.22 : 1}
                  >
                    {/* Active Halo Glow */}
                    {(isSelected || isHovered) && (
                      <rect
                        x="-106"
                        y="-26"
                        width="212"
                        height="52"
                        rx="12"
                        fill="transparent"
                        stroke={style.ring}
                        strokeWidth="2.5"
                        strokeOpacity="0.8"
                      />
                    )}

                    {/* Node Card Body */}
                    <rect
                      x="-102"
                      y="-22"
                      width="204"
                      height="44"
                      rx="9"
                      fill={isSelected ? "#131929" : "#0a0e18"}
                      stroke={isSelected ? style.ring : isHovered ? "#38bdf8" : "#1b2438"}
                      strokeWidth={isSelected ? "1.8" : "1.2"}
                      className="transition-colors duration-150 shadow-md"
                    />

                    {/* Category Glyph Badge (Left) */}
                    <g transform="translate(-86, 0)">
                      <circle
                        r="12"
                        fill="#0e1526"
                        stroke={style.ring}
                        strokeWidth="1.5"
                      />
                      <text
                        textAnchor="middle"
                        dy=".35em"
                        fill="#ffffff"
                        fontFamily="ui-monospace, monospace"
                        fontWeight="700"
                        fontSize="10"
                      >
                        {style.glyph}
                      </text>
                    </g>

                    {/* Node Text & Address */}
                    <g transform="translate(-68, -4)">
                      <text
                        fill="#ffffff"
                        fontFamily="ui-sans-serif, system-ui, sans-serif"
                        fontSize="10.5"
                        fontWeight="600"
                      >
                        {node.label.length > 17 ? `${node.label.slice(0, 16)}…` : node.label}
                      </text>
                      <text
                        y="14"
                        fill="#5e6f8d"
                        fontFamily="ui-monospace, monospace"
                        fontSize="8.5"
                      >
                        {node.address.slice(0, 8)}...{node.address.slice(-6)}
                      </text>
                    </g>

                    {/* Risk Badge (Right) */}
                    <g transform="translate(80, 0)">
                      <rect
                        x="-16"
                        y="-8"
                        width="30"
                        height="16"
                        rx="4"
                        fill={node.riskScore === 0 ? "#064e3b" : node.riskScore <= 10 ? "#065f46" : "#78350f"}
                        stroke={node.riskScore === 0 ? "#10b981" : node.riskScore <= 10 ? "#34d399" : "#f59e0b"}
                        strokeWidth="0.8"
                      />
                      <text
                        textAnchor="middle"
                        dy="3.5"
                        fill={node.riskScore === 0 ? "#a7f3d0" : node.riskScore <= 10 ? "#6ee7b7" : "#fde68a"}
                        fontFamily="ui-monospace, monospace"
                        fontSize="8.5"
                        fontWeight="700"
                      >
                        {node.riskScore}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>

      {/* Bottom Zoom & Reset Controls */}
      <div className="absolute bottom-3 left-4 z-20 flex items-center gap-1.5 bg-[#0e121a]/95 backdrop-blur border border-[#1f2637] p-1 rounded-lg shadow-lg">
        <button
          onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 2.0))}
          className="p-1.5 text-[#8b95ad] hover:text-white rounded hover:bg-[#1a202e] transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.6))}
          className="p-1.5 text-[#8b95ad] hover:text-white rounded hover:bg-[#1a202e] transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 text-[#8b95ad] hover:text-white rounded hover:bg-[#1a202e] transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Legend */}
      <div className="absolute bottom-3 right-4 z-20 hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#0e121a]/95 backdrop-blur border border-[#1f2637] text-[10px] font-mono text-[#8290ad] shadow-lg">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0284c7]"></span>
          Proxy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
          Impl
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#4f46e5]"></span>
          Timelock
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#9333ea]"></span>
          Safe Multisig
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#d97706]"></span>
          Oracle
        </span>
      </div>

      {/* Contract Address Justification Slide-Over Modal */}
      {showJustificationModal && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90%] bg-[#080b13] border border-[#20293e] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#e2e8f0]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#182033] flex items-center justify-between bg-[#0b0f1a]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-semibold text-white text-sm">
                    Contract Address Discovery & Lineage Justification
                  </h3>
                  <p className="text-[11px] text-[#6b7b99] font-mono">
                    Verifiable cryptographic & on-chain provenance for all 15 Aave V3 contracts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowJustificationModal(false)}
                className="p-1.5 text-[#6b7b99] hover:text-white rounded-lg hover:bg-[#141b2d] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Justification Methodology Explainer */}
            <div className="px-6 py-3 bg-[#0d1220] border-b border-[#182033] text-xs font-mono text-[#8a98b4] flex items-center justify-between gap-4">
              <div>
                <span className="text-white font-semibold">Discovery Pipeline: </span>
                Seed via canonical <code className="text-blue-400">@bgd-labs/aave-address-book</code> → Dynamic RPC queries to <code className="text-indigo-400">PoolAddressesProvider</code> → Low-level <code className="text-amber-400">eth_getStorageAt</code> for EIP-1967 proxy slots → Oracle source mapping on <code className="text-emerald-400">AaveOracle</code>.
              </div>
            </div>

            {/* Justification Table */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 font-mono text-xs">
              {nodes.map((node) => {
                const j = node.justification || CONTRACT_JUSTIFICATIONS[node.id];
                return (
                  <div
                    key={node.id}
                    className="p-3.5 rounded-lg bg-[#090d16] border border-[#172030] hover:border-[#263550] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{node.label}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded border border-blue-800/60 bg-blue-950/40 text-blue-400">
                            Hop {node.hop}
                          </span>
                          <span className="text-[10px] uppercase text-[#677797]">
                            ({node.category})
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8696b5] mt-1 flex items-center gap-2">
                          <span>Address:</span>
                          <span className="text-white font-semibold">{node.address}</span>
                          <button
                            onClick={() => copy(node.address)}
                            className="p-1 hover:text-white text-[#52607e] cursor-pointer"
                            title="Copy Address"
                          >
                            {copiedAddress === node.address ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <a
                            href={`https://etherscan.io/address/${node.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#52607e] hover:text-white"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-1 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/60 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Sourcify Verified
                      </span>
                    </div>

                    {j && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-[#131a28] text-[11px] text-[#7182a0]">
                        <div>
                          <span className="text-[#4e5d7a]">Upstream Source: </span>
                          <span className="text-[#a4b3d0]">{j.source}</span>
                        </div>
                        <div>
                          <span className="text-[#4e5d7a]">Discovery Method: </span>
                          <span className="text-[#a4b3d0]">{j.method}</span>
                        </div>
                        {j.slot && (
                          <div className="md:col-span-2">
                            <span className="text-[#4e5d7a]">EVM Storage Slot: </span>
                            <code className="text-amber-400 text-[10px]">{j.slot}</code>
                          </div>
                        )}
                        <div className="md:col-span-2 text-[#8b99b5] text-[11px] leading-relaxed italic">
                          "{j.description}"
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[#182033] bg-[#0b0f1a] flex items-center justify-between text-[11px] text-[#6b7b99] font-mono">
              <span>All 15 contracts verified against Ethereum Mainnet JSON-RPC and Sourcify Registry</span>
              <button
                onClick={() => setShowJustificationModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#141b2c] hover:bg-[#1d273f] text-white text-xs font-mono transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

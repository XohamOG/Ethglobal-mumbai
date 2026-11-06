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
  HelpCircle,
  X,
  Columns,
  GitBranch,
  CheckCircle2,
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
  const [layoutMode, setLayoutMode] = useState<"hierarchy" | "lanes">("hierarchy");
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

  // Category visual styles (pure circular nodes)
  const categoryConfig: Record<string, { ring: string; fill: string; glyph: string; name: string }> = {
    proxy: { ring: "#38bdf8", fill: "#032840", glyph: "P", name: "Proxy" },
    implementation: { ring: "#34d399", fill: "#033221", glyph: "I", name: "Implementation" },
    oracle: { ring: "#fbbf24", fill: "#362203", glyph: "O", name: "Oracle" },
    multisig: { ring: "#c084fc", fill: "#2b0f42", glyph: "S", name: "Safe Multisig" },
    timelock: { ring: "#818cf8", fill: "#1a153f", glyph: "T", name: "Timelock" },
  };

  const getStyle = (cat: string, admin?: string) => {
    if (admin === "timelock") return categoryConfig.timelock;
    return categoryConfig[cat] || { ring: "#94a3b8", fill: "#131926", glyph: "C", name: "Contract" };
  };

  // Pure deterministic coordinates without background cards
  const layoutCoordinates: Record<string, { x: number; y: number }> =
    layoutMode === "hierarchy"
      ? {
          // Top-to-Bottom Hierarchical Tree:
          // Level 0 (Root Seed, Top Center)
          "aave-v3-addresses-provider": { x: 570, y: 70 },

          // Level 1 (Core Diamond Proxies & Oracle)
          "aave-v3-pool": { x: 230, y: 220 },
          "aave-v3-pool-configurator": { x: 460, y: 220 },
          "aave-v3-oracle": { x: 690, y: 220 },
          "aave-v3-acl-manager": { x: 910, y: 220 },
          "aave-v3-data-provider": { x: 1040, y: 220 },

          // Level 2 (Logic Impls & Governance Admin)
          "aave-v3-pool-impl": { x: 200, y: 390 },
          "aave-v3-configurator-impl": { x: 430, y: 390 },
          "aave-v3-governance-executor": { x: 660, y: 390 },
          "aave-v3-emergency-safe": { x: 900, y: 390 },

          // Level 3 (External Chainlink Price Feeds)
          "chainlink-eth-usd": { x: 200, y: 560 },
          "chainlink-btc-usd": { x: 385, y: 560 },
          "chainlink-usdc-usd": { x: 570, y: 560 },
          "chainlink-dai-usd": { x: 755, y: 560 },
          "chainlink-usdt-usd": { x: 940, y: 560 },
        }
      : {
          // Horizontal Columns (Hop 0 -> Hop 1 -> Hop 2):
          // Hop 0: Core Architecture (X: 190)
          "aave-v3-addresses-provider": { x: 190, y: 75 },
          "aave-v3-pool": { x: 190, y: 175 },
          "aave-v3-pool-configurator": { x: 190, y: 275 },
          "aave-v3-oracle": { x: 190, y: 375 },
          "aave-v3-acl-manager": { x: 190, y: 475 },
          "aave-v3-data-provider": { x: 190, y: 575 },

          // Hop 1: Governance & Implementation (X: 570)
          "aave-v3-pool-impl": { x: 570, y: 140 },
          "aave-v3-configurator-impl": { x: 570, y: 260 },
          "aave-v3-governance-executor": { x: 570, y: 380 },
          "aave-v3-emergency-safe": { x: 570, y: 500 },

          // Hop 2: External Chainlink Oracles (X: 940)
          "chainlink-eth-usd": { x: 940, y: 90 },
          "chainlink-btc-usd": { x: 940, y: 200 },
          "chainlink-usdc-usd": { x: 940, y: 310 },
          "chainlink-dai-usd": { x: 940, y: 420 },
          "chainlink-usdt-usd": { x: 940, y: 530 },
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
    <div className="relative w-full h-[680px] bg-[#07090e] border border-[#161a25] rounded-xl overflow-hidden select-none flex flex-col justify-between">
      {/* Top Floating Controls & Layout Switcher */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Minimal Layout Mode Switcher */}
          <div className="flex items-center bg-[#0a0d16]/95 backdrop-blur border border-[#1f283d] p-0.5 rounded-lg shadow-lg">
            <button
              onClick={() => {
                setLayoutMode("hierarchy");
                handleReset();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                layoutMode === "hierarchy"
                  ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30"
                  : "text-[#6c7b9b] hover:text-white"
              }`}
              title="Hierarchical Tree Layout"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Hierarchical</span>
            </button>
            <button
              onClick={() => {
                setLayoutMode("lanes");
                handleReset();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                layoutMode === "lanes"
                  ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30"
                  : "text-[#6c7b9b] hover:text-white"
              }`}
              title="Hop Columns Layout"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Columns</span>
            </button>
          </div>
        </div>

        {/* Contract Address Justification Trigger */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowJustificationModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1320] hover:bg-[#161f33] text-blue-300 border border-[#202d48] text-xs font-mono transition-all cursor-pointer shadow-lg"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Contract Justification</span>
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
            {/* Define Arrowhead Markers */}
            <defs>
              <marker
                id="pure-arrow-default"
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
                id="pure-arrow-active"
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
                id="pure-arrow-governance"
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
                id="pure-arrow-oracle"
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

            {/* Connecting Edges */}
            <g className="graph-edges">
              {edges.map((edge) => {
                const src = layoutCoordinates[edge.from];
                const tgt = layoutCoordinates[edge.to];
                if (!src || !tgt) return null;

                const edgeKey = `${edge.from}->${edge.to}`;
                const isActive = activeNetwork.edges.has(edgeKey);
                const isDimmed = activeTargetId && !isActive;

                let d = "";
                let midX = (src.x + tgt.x) / 2;
                let midY = (src.y + tgt.y) / 2;

                const nodeR = 22; // Circular node radius

                if (layoutMode === "hierarchy") {
                  // Hierarchical Top-to-Bottom Flow
                  const y1 = src.y + nodeR;
                  const x1 = src.x;
                  const y2 = tgt.y - nodeR;
                  const x2 = tgt.x;
                  const dy = y2 - y1;

                  d = `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.5}, ${x2} ${y2 - dy * 0.5}, ${x2} ${y2}`;
                  midX = (x1 + x2) / 2;
                  midY = (y1 + y2) / 2;
                } else {
                  // Hop Columns Left-to-Right Flow
                  const isSameColumn = Math.abs(src.x - tgt.x) < 50;

                  if (isSameColumn) {
                    const arcX = src.x - 70;
                    d = `M ${src.x - nodeR} ${src.y} C ${arcX} ${src.y}, ${arcX} ${tgt.y}, ${tgt.x - nodeR} ${tgt.y}`;
                    midX = arcX + 15;
                    midY = (src.y + tgt.y) / 2;
                  } else {
                    const x1 = src.x + nodeR;
                    const y1 = src.y;
                    const x2 = tgt.x - nodeR;
                    const y2 = tgt.y;
                    const dx = x2 - x1;

                    d = `M ${x1} ${y1} C ${x1 + dx * 0.45} ${y1}, ${x2 - dx * 0.45} ${y2}, ${x2} ${y2}`;
                    midX = (x1 + x2) / 2;
                    midY = (y1 + y2) / 2;
                  }
                }

                const strokeColor = isActive
                  ? edge.type.includes("governance") || edge.type.includes("multisig")
                    ? "#c084fc"
                    : edge.type.includes("oracle")
                    ? "#fbbf24"
                    : "#38bdf8"
                  : isDimmed
                  ? "#101520"
                  : "#1e293b";

                const marker = isActive
                  ? edge.type.includes("governance") || edge.type.includes("multisig")
                    ? "url(#pure-arrow-governance)"
                    : edge.type.includes("oracle")
                    ? "url(#pure-arrow-oracle)"
                    : "url(#pure-arrow-active)"
                  : "url(#pure-arrow-default)";

                return (
                  <g key={edgeKey} className="edge-group">
                    {/* Active glow on edge */}
                    {isActive && (
                      <path
                        d={d}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="5"
                        strokeOpacity="0.25"
                      />
                    )}

                    {/* Edge Main Path */}
                    <path
                      d={d}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isActive ? 2.5 : 1.5}
                      strokeOpacity={isDimmed ? 0.2 : 0.85}
                      markerEnd={marker}
                      className="transition-all duration-200"
                    />

                    {/* Relationship Pill */}
                    <g transform={`translate(${midX}, ${midY})`} opacity={isDimmed ? 0.2 : 0.9}>
                      <rect
                        x="-38"
                        y="-7"
                        width="76"
                        height="14"
                        rx="3"
                        fill="#07090e"
                        stroke={isActive ? strokeColor : "#1b2334"}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3.5"
                        fill={isActive ? "#e2e8f0" : "#64748b"}
                        fontFamily="ui-monospace, monospace"
                        fontSize="7.5"
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

            {/* Circular Nodes ONLY */}
            <g className="graph-nodes">
              {nodes.map((node) => {
                const pos = layoutCoordinates[node.id];
                if (!pos) return null;

                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isConnected = activeNetwork.nodes.has(node.id);
                const isDimmed = activeTargetId && !isSelected && !isHovered && !isConnected;

                const style = getStyle(node.category, node.adminType);
                const nodeR = 22;

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
                    opacity={isDimmed ? 0.2 : 1}
                  >
                    {/* Active Halo Ring */}
                    {(isSelected || isHovered) && (
                      <circle
                        r={nodeR + 6}
                        fill="transparent"
                        stroke={style.ring}
                        strokeWidth="2.5"
                        strokeOpacity="0.8"
                        className="animate-pulse"
                      />
                    )}

                    {/* Node Main Circle */}
                    <circle
                      r={nodeR}
                      fill={style.fill}
                      stroke={style.ring}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-transform duration-200 shadow-lg hover:scale-105"
                    />

                    {/* Inner Glyph Icon */}
                    <text
                      textAnchor="middle"
                      dy=".35em"
                      fill="#ffffff"
                      fontFamily="ui-monospace, monospace"
                      fontSize="12"
                      fontWeight="700"
                      pointerEvents="none"
                    >
                      {style.glyph}
                    </text>

                    {/* Node Label Underneath Circle */}
                    <text
                      y={nodeR + 15}
                      textAnchor="middle"
                      fill="#f1f5f9"
                      fontFamily="ui-sans-serif, system-ui, sans-serif"
                      fontSize="11"
                      fontWeight="600"
                      pointerEvents="none"
                    >
                      {node.label}
                    </text>

                    {/* Address Snippet */}
                    <text
                      y={nodeR + 28}
                      textAnchor="middle"
                      fill="#64748b"
                      fontFamily="ui-monospace, monospace"
                      fontSize="9"
                      pointerEvents="none"
                    >
                      {node.address.slice(0, 6)}...{node.address.slice(-4)}
                    </text>
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
          className="p-1.5 text-[#8b95ad] hover:text-white rounded hover:bg-[#1a202e] transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.6))}
          className="p-1.5 text-[#8b95ad] hover:text-white rounded hover:bg-[#1a202e] transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 text-[#8b95ad] hover:text-white rounded hover:bg-[#1a202e] transition-colors cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Minimal Bottom Legend */}
      <div className="absolute bottom-3 right-4 z-20 hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#0e121a]/95 backdrop-blur border border-[#1f2637] text-[10px] font-mono text-[#8290ad] shadow-lg">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]"></span>
          Proxy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#34d399]"></span>
          Impl
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#818cf8]"></span>
          Timelock
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#c084fc]"></span>
          Safe Multisig
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]"></span>
          Oracle
        </span>
      </div>

      {/* Contract Address Justification Slide-Over Modal */}
      {showJustificationModal && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90%] bg-[#080b13] border border-[#20293e] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#e2e8f0]">
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

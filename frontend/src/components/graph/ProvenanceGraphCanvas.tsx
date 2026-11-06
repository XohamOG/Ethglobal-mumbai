"use client";

import React, { useRef, useState, useMemo } from "react";
import { GraphNode, GraphEdge, CONTRACT_JUSTIFICATIONS, getRiskScoreConfig } from "@/lib/graph-data";
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
  Zap,
} from "lucide-react";

interface ProvenanceGraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string;
  onSelectNode: (node: GraphNode) => void;
  isRebuilding?: boolean;
  mutatedNodeId?: string;
  onResetBaseline?: () => void;
  onSwitchToCreTab?: () => void;
}

export function ProvenanceGraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  isRebuilding = false,
  mutatedNodeId,
  onResetBaseline,
  onSwitchToCreTab,
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

  // Cyber Sigilism visual styling for circular nodes
  const categoryConfig: Record<string, { ring: string; fill: string; glyph: string; name: string }> = {
    proxy: { ring: "#d6d8e4", fill: "#17171d", glyph: "P", name: "Proxy" },
    implementation: { ring: "#7d8495", fill: "#17171d", glyph: "I", name: "Implementation" },
    oracle: { ring: "#b068ff", fill: "#17171d", glyph: "O", name: "Oracle" },
    multisig: { ring: "#d6d8e4", fill: "#17171d", glyph: "S", name: "Safe Multisig" },
    timelock: { ring: "#b068ff", fill: "#17171d", glyph: "T", name: "Timelock" },
  };

  const getStyle = (cat: string, admin?: string) => {
    if (admin === "timelock") return categoryConfig.timelock;
    return categoryConfig[cat] || { ring: "#7d8495", fill: "#17171d", glyph: "C", name: "Contract" };
  };

  // Deterministic node coordinates
  const layoutCoordinates: Record<string, { x: number; y: number }> =
    layoutMode === "hierarchy"
      ? {
          // Top-to-Bottom Hierarchical Tree:
          "aave-v3-addresses-provider": { x: 570, y: 70 },

          "aave-v3-pool": { x: 230, y: 220 },
          "aave-v3-pool-configurator": { x: 460, y: 220 },
          "aave-v3-oracle": { x: 690, y: 220 },
          "aave-v3-acl-manager": { x: 910, y: 220 },
          "aave-v3-data-provider": { x: 1040, y: 220 },

          "aave-v3-pool-impl": { x: 200, y: 390 },
          "aave-v3-configurator-impl": { x: 430, y: 390 },
          "aave-v3-governance-executor": { x: 660, y: 390 },
          "aave-v3-emergency-safe": { x: 900, y: 390 },

          "chainlink-eth-usd": { x: 200, y: 560 },
          "chainlink-btc-usd": { x: 385, y: 560 },
          "chainlink-usdc-usd": { x: 570, y: 560 },
          "chainlink-dai-usd": { x: 755, y: 560 },
          "chainlink-usdt-usd": { x: 940, y: 560 },
        }
      : {
          // Horizontal Columns (Hop 0 -> Hop 1 -> Hop 2):
          "aave-v3-addresses-provider": { x: 190, y: 75 },
          "aave-v3-pool": { x: 190, y: 175 },
          "aave-v3-pool-configurator": { x: 190, y: 275 },
          "aave-v3-oracle": { x: 190, y: 375 },
          "aave-v3-acl-manager": { x: 190, y: 475 },
          "aave-v3-data-provider": { x: 190, y: 575 },

          "aave-v3-pool-impl": { x: 570, y: 140 },
          "aave-v3-configurator-impl": { x: 570, y: 260 },
          "aave-v3-governance-executor": { x: 570, y: 380 },
          "aave-v3-emergency-safe": { x: 570, y: 500 },

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
    <div className="relative w-full h-[680px] bg-[#0e0e12] border border-[#282832] rounded-[6px] overflow-hidden select-none flex flex-col justify-between">
      {/* Top Floating Controls */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Layout Mode Switcher */}
          <div className="flex items-center bg-[#17171d] border border-[#282832] p-0.5 rounded-[2px] shadow-lg">
            <button
              onClick={() => {
                setLayoutMode("hierarchy");
                handleReset();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-mono transition-all cursor-pointer ${
                layoutMode === "hierarchy"
                  ? "bg-[#282832] text-[#ececf2] font-semibold border border-[#7d8495]/40"
                  : "text-[#aaaab8] hover:text-[#ececf2]"
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-mono transition-all cursor-pointer ${
                layoutMode === "lanes"
                  ? "bg-[#282832] text-[#ececf2] font-semibold border border-[#7d8495]/40"
                  : "text-[#aaaab8] hover:text-[#ececf2]"
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[#17171d] hover:bg-[#282832] text-[#ececf2] border border-[#282832] text-xs font-mono transition-all cursor-pointer shadow-lg"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#d6d8e4]" />
            <span>Contract Justification</span>
          </button>
        </div>
      </div>

      {/* Live Rebuild / Mutation Drift HUD Alert */}
      {mutatedNodeId && (
        <div className="absolute top-14 left-4 right-4 z-20 flex items-center justify-between p-3 rounded-[3px] bg-[#140f06]/95 border border-amber-600/70 text-amber-200 text-xs font-mono shadow-[0_0_25px_rgba(245,158,11,0.2)] backdrop-blur-md animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0"></span>
            <div>
              <span className="font-semibold text-white">
                Fingerprint Drift Detected on {nodes.find((n) => n.id === mutatedNodeId)?.label || mutatedNodeId}
              </span>
              <span className="text-[10px] bg-amber-900/80 text-amber-300 px-1.5 py-0.2 rounded border border-amber-700/60 font-bold uppercase ml-2">
                2-Hop Rebuild Dispatched
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onSwitchToCreTab && (
              <button
                onClick={onSwitchToCreTab}
                className="px-2.5 py-1 rounded bg-[#1e1709] border border-amber-500/70 hover:bg-[#281f0d] text-amber-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Inspect in CRE</span>
              </button>
            )}
            {onResetBaseline && (
              <button
                onClick={onResetBaseline}
                className="px-2.5 py-1 rounded bg-[#17171d] border border-[#282832] hover:bg-[#282832] text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-[#d6d8e4]" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      )}

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
            {/* Arrowhead Markers */}
            <defs>
              <marker
                id="sigil-arrow-default"
                viewBox="0 -5 10 10"
                refX="8"
                refY="0"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path d="M0,-4L8,0L0,4" fill="#7d8495" />
              </marker>
              <marker
                id="sigil-arrow-active"
                viewBox="0 -5 10 10"
                refX="8"
                refY="0"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0,-4L8,0L0,4" fill="#d6d8e4" />
              </marker>
              <marker
                id="sigil-arrow-accent"
                viewBox="0 -5 10 10"
                refX="8"
                refY="0"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0,-4L8,0L0,4" fill="#b068ff" />
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

                const nodeR = 22; // Circular seal radius

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
                  ? edge.type.includes("oracle") || edge.type.includes("governance")
                    ? "#b068ff"
                    : "#d6d8e4"
                  : isDimmed
                  ? "#17171d"
                  : "#282832";

                const marker = isActive
                  ? edge.type.includes("oracle") || edge.type.includes("governance")
                    ? "url(#sigil-arrow-accent)"
                    : "url(#sigil-arrow-active)"
                  : "url(#sigil-arrow-default)";

                return (
                  <g key={edgeKey} className="edge-group">
                    {/* Active glow on edge */}
                    {isActive && (
                      <path
                        d={d}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="4"
                        strokeOpacity="0.2"
                      />
                    )}

                    {/* Edge Main Path */}
                    <path
                      d={d}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isActive ? 2 : 1.2}
                      strokeOpacity={isDimmed ? 0.15 : 0.8}
                      markerEnd={marker}
                      className="transition-all duration-200"
                    />

                    {/* Relationship Pill */}
                    <g transform={`translate(${midX}, ${midY})`} opacity={isDimmed ? 0.2 : 0.85}>
                      <rect
                        x="-36"
                        y="-7"
                        width="72"
                        height="14"
                        rx="2"
                        fill="#0e0e12"
                        stroke={isActive ? strokeColor : "#282832"}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3.5"
                        fill={isActive ? "#ececf2" : "#aaaab8"}
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

            {/* Circular Nodes ONLY (Cyber Sigilism Circular Seals) */}
            <g className="graph-nodes">
              {nodes.map((node) => {
                const pos = layoutCoordinates[node.id];
                if (!pos) return null;

                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isConnected = activeNetwork.nodes.has(node.id);
                const isDimmed = activeTargetId && !isSelected && !isHovered && !isConnected;

                const style = getStyle(node.category, node.adminType);
                const nodeRisk = getRiskScoreConfig(node.riskScore);
                const isMutated = mutatedNodeId === node.id;
                const nodeRisk = getRiskScoreConfig(node.riskScore);
                const isMutated = mutatedNodeId === node.id;
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
                    {/* Active Glass Glow Ring matching Risk Level */}
                    {(isSelected || isHovered) && (
                      <>
                        <circle
                          r={nodeR + 8}
                          fill={nodeRisk.hex}
                          fillOpacity="0.08"
                          stroke={nodeRisk.hex}
                          strokeWidth="1"
                          strokeOpacity="0.4"
                        />
                        <circle
                          r={nodeR + 4}
                          fill="transparent"
                          stroke={isSelected ? "#b068ff" : nodeRisk.hex}
                          strokeWidth="1.5"
                          strokeOpacity="0.8"
                          strokeDasharray="3 3"
                        />
                      </>
                    )}

                    {/* Node Main Circle with Glass Effect */}
                    <circle
                      r={nodeR}
                      fill={style.fill}
                      stroke={isSelected ? "#b068ff" : isHovered ? nodeRisk.hex : style.ring}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className="transition-transform duration-200 hover:scale-105"
                    />

                    {/* Small Risk Level Pip Indicator */}
                    <circle
                      cx={nodeR - 5}
                      cy={-nodeR + 6}
                      r="3.5"
                      fill={isMutated ? "#f59e0b" : nodeRisk.hex}
                      stroke="#0e0e12"
                      strokeWidth="1.2"
                    />

                    {/* Mutated / Drifted Glowing Outer Ring */}
                    {isMutated && (
                      <circle
                        r={nodeR + 6}
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Small Risk Level Pip Indicator */}
                    <circle
                      cx={nodeR - 5}
                      cy={-nodeR + 6}
                      r="3.5"
                      fill={isMutated ? "#f59e0b" : nodeRisk.hex}
                      stroke="#0e0e12"
                      strokeWidth="1.2"
                    />

                    {/* Mutated / Drifted Glowing Outer Ring */}
                    {isMutated && (
                      <circle
                        r={nodeR + 6}
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Inner Glyph Icon */}
                    <text
                      textAnchor="middle"
                      dy=".35em"
                      fill="#ececf2"
                      fontFamily="ui-monospace, monospace"
                      fontSize="11"
                      fontWeight="700"
                      pointerEvents="none"
                    >
                      {style.glyph}
                    </text>

                    {/* Node Label Underneath Circle */}
                    <text
                      y={nodeR + 15}
                      textAnchor="middle"
                      fill="#ececf2"
                      fontFamily="Arial, Helvetica, sans-serif"
                      fontSize="11"
                      fontWeight="600"
                      pointerEvents="none"
                    >
                      {node.label}
                    </text>

                    {/* Address Snippet */}
                    <text
                      y={nodeR + 27}
                      textAnchor="middle"
                      fill="#aaaab8"
                      fontFamily="ui-monospace, monospace"
                      fontSize="8.5"
                      pointerEvents="none"
                    >
                      {node.address.slice(0, 6)}...{node.address.slice(-4)}
                    </text>

                    {/* Dynamic Risk Score Badge */}
                    <text
                      y={nodeR + 38}
                      textAnchor="middle"
                      fill={isMutated ? "#f59e0b" : nodeRisk.hex}
                      fontFamily="ui-monospace, monospace"
                      fontSize="8"
                      fontWeight="700"
                      pointerEvents="none"
                    >
                      {isMutated ? "MUTATED · RISK " + node.riskScore : "RISK " + node.riskScore}
                    </text>

                    {/* Dynamic Risk Score Badge */}
                    <text
                      y={nodeR + 38}
                      textAnchor="middle"
                      fill={isMutated ? "#f59e0b" : nodeRisk.hex}
                      fontFamily="ui-monospace, monospace"
                      fontSize="8"
                      fontWeight="700"
                      pointerEvents="none"
                    >
                      {isMutated ? "MUTATED · RISK " + node.riskScore : "RISK " + node.riskScore}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>

      {/* Bottom Zoom & Reset Controls */}
      <div className="absolute bottom-3 left-4 z-20 flex items-center gap-1.5 bg-[#17171d] border border-[#282832] p-1 rounded-[2px] shadow-lg">
        <button
          onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 2.0))}
          className="p-1.5 text-[#aaaab8] hover:text-[#ececf2] rounded-[2px] hover:bg-[#282832] transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.6))}
          className="p-1.5 text-[#aaaab8] hover:text-[#ececf2] rounded-[2px] hover:bg-[#282832] transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 text-[#aaaab8] hover:text-[#ececf2] rounded-[2px] hover:bg-[#282832] transition-colors cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Minimal Bottom Legend */}
      <div className="absolute bottom-3 right-4 z-20 hidden md:flex items-center gap-3 px-3 py-1.5 rounded-[2px] bg-[#17171d] border border-[#282832] text-[10px] font-mono text-[#aaaab8] shadow-lg">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-[#d6d8e4]"></span>
          Proxy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-[#7d8495]"></span>
          Impl
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-[#b068ff]"></span>
          Timelock
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-[#d6d8e4]"></span>
          Multisig
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-[#b068ff]"></span>
          Oracle
        </span>
      </div>

      {/* Contract Address Justification Slide-Over Modal */}
      {showJustificationModal && (
        <div className="absolute inset-0 z-40 bg-[#0e0e12]/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90%] bg-[#17171d] border border-[#282832] rounded-[6px] shadow-2xl flex flex-col overflow-hidden text-[#ececf2]">
            <div className="px-6 py-4 border-b border-[#282832] flex items-center justify-between bg-[#17171d]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#d6d8e4]" />
                <div>
                  <h3 className="font-serif font-bold text-base text-[#ececf2]">
                    Contract Discovery & Lineage Justification
                  </h3>
                  <p className="text-[11px] text-[#aaaab8] font-mono">
                    Verifiable cryptographic & on-chain provenance for all 15 Aave V3 contracts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowJustificationModal(false)}
                className="p-1.5 text-[#aaaab8] hover:text-[#ececf2] rounded-[2px] hover:bg-[#282832] transition-colors cursor-pointer"
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
                    className="p-3.5 rounded-[4px] bg-[#0e0e12] border border-[#282832] hover:border-[#7d8495]/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#ececf2] text-sm">{node.label}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-[2px] border border-[#282832] bg-[#282832]/60 text-[#d6d8e4]">
                            Hop {node.hop}
                          </span>
                          <span className="text-[10px] uppercase text-[#aaaab8]">
                            ({node.category})
                          </span>
                        </div>
                        <div className="text-[11px] text-[#aaaab8] mt-1 flex items-center gap-2">
                          <span>Address:</span>
                          <span className="text-[#ececf2] font-semibold">{node.address}</span>
                          <button
                            onClick={() => copy(node.address)}
                            className="p-1 hover:text-white text-[#7d8495] cursor-pointer"
                            title="Copy Address"
                          >
                            {copiedAddress === node.address ? <Check className="w-3 h-3 text-[#b068ff]" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <a
                            href={`https://etherscan.io/address/${node.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#7d8495] hover:text-white"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-[2px] bg-[#282832] text-[#d6d8e4] border border-[#7d8495]/40 font-semibold">
                        Sourcify Verified
                      </span>
                    </div>

                    {j && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-[#282832] text-[11px] text-[#aaaab8]">
                        <div>
                          <span className="text-[#7d8495]">Source: </span>
                          <span className="text-[#ececf2]">{j.source}</span>
                        </div>
                        <div>
                          <span className="text-[#7d8495]">Method: </span>
                          <span className="text-[#ececf2]">{j.method}</span>
                        </div>
                        {j.slot && (
                          <div className="md:col-span-2">
                            <span className="text-[#7d8495]">EVM Slot: </span>
                            <code className="text-[#b068ff] text-[10px]">{j.slot}</code>
                          </div>
                        )}
                        <div className="md:col-span-2 text-[#aaaab8] text-[11px] leading-relaxed italic">
                          "{j.description}"
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3 border-t border-[#282832] bg-[#17171d] flex items-center justify-end">
              <button
                onClick={() => setShowJustificationModal(false)}
                className="px-4 py-1.5 rounded-[2px] bg-[#282832] hover:bg-[#7d8495]/40 text-[#ececf2] text-xs font-mono transition-colors cursor-pointer"
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

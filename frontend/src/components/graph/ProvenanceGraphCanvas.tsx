"use client";

import React, { useRef, useState, useMemo } from "react";
import { GraphNode, GraphEdge, getRiskScoreConfig } from "@/lib/graph-data";
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
  ArrowRight,
} from "lucide-react";

export type GraphStage = "registry" | "hop0" | "hop1" | "hop2" | "all";

interface ProvenanceGraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string;
  onSelectNode: (node: GraphNode) => void;
  isRebuilding?: boolean;
  mutatedNodeId?: string;
  onResetBaseline?: () => void;
  onSwitchToCreTab?: () => void;
  stage?: GraphStage;
  onAdvanceStage?: (nextStage: GraphStage) => void;
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
  stage = "all",
  onAdvanceStage,
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

  // Hyperstudio minimalist wireframe configuration
  const categoryConfig: Record<string, { stroke: string; fill: string; glyph: string; name: string }> = {
    proxy: { stroke: "#c1c1c1", fill: "#080808", glyph: "P", name: "Proxy" },
    implementation: { stroke: "#474747", fill: "#080808", glyph: "I", name: "Implementation" },
    oracle: { stroke: "#6f6759", fill: "#080808", glyph: "O", name: "Oracle" },
    multisig: { stroke: "#9c9c9c", fill: "#080808", glyph: "S", name: "Safe Multisig" },
    timelock: { stroke: "#6f6759", fill: "#080808", glyph: "T", name: "Timelock" },
  };

  const getStyle = (cat: string, admin?: string) => {
    if (admin === "timelock") return categoryConfig.timelock;
    return categoryConfig[cat] || { stroke: "#474747", fill: "#080808", glyph: "C", name: "Contract" };
  };

  // Deterministic node coordinates based on layoutMode and active drill-down stage
  const layoutCoordinates: Record<string, { x: number; y: number } | undefined> = useMemo(() => {
    if (stage === "registry") {
      return {
        "aave-v3-addresses-provider": { x: 570, y: 320 },
      };
    }

    if (stage === "hop0") {
      return {
        "aave-v3-addresses-provider": { x: 570, y: 160 },
        "aave-v3-pool": { x: 230, y: 400 },
        "aave-v3-pool-configurator": { x: 400, y: 400 },
        "aave-v3-acl-manager": { x: 570, y: 400 },
        "aave-v3-oracle": { x: 740, y: 400 },
        "aave-v3-data-provider": { x: 910, y: 400 },
      };
    }

    if (stage === "hop1") {
      return {
        "aave-v3-addresses-provider": { x: 570, y: 90 },
        "aave-v3-pool": { x: 260, y: 240 },
        "aave-v3-pool-configurator": { x: 460, y: 240 },
        "aave-v3-acl-manager": { x: 680, y: 240 },
        "aave-v3-oracle": { x: 880, y: 240 },
        "aave-v3-data-provider": { x: 1020, y: 240 },

        "aave-v3-pool-impl": { x: 260, y: 450 },
        "aave-v3-configurator-impl": { x: 460, y: 450 },
        "aave-v3-governance-executor": { x: 680, y: 450 },
        "aave-v3-emergency-safe": { x: 880, y: 450 },
      };
    }

    // Default full / hop2 / all
    return layoutMode === "hierarchy"
      ? {
          "aave-v3-addresses-provider": { x: 570, y: 70 },

          "aave-v3-pool": { x: 270, y: 200 },
          "aave-v3-pool-configurator": { x: 470, y: 200 },
          "aave-v3-acl-manager": { x: 670, y: 200 },
          "aave-v3-data-provider": { x: 870, y: 200 },

          "aave-v3-pool-impl": { x: 210, y: 360 },
          "aave-v3-configurator-impl": { x: 390, y: 360 },
          "aave-v3-oracle": { x: 570, y: 360 },
          "aave-v3-governance-executor": { x: 750, y: 360 },
          "aave-v3-emergency-safe": { x: 930, y: 360 },

          "chainlink-eth-usd": { x: 250, y: 530 },
          "chainlink-btc-usd": { x: 410, y: 530 },
          "chainlink-usdc-usd": { x: 570, y: 530 },
          "chainlink-dai-usd": { x: 730, y: 530 },
          "chainlink-usdt-usd": { x: 890, y: 530 },
        }
      : {
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
  }, [layoutMode, stage]);

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
    <div className="relative w-full h-full min-h-[580px] bg-[#101010] overflow-hidden select-none flex flex-col justify-between">
      {/* Live Rebuild / Mutation Drift HUD Alert */}
      {mutatedNodeId && (
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between p-3 rounded-[4px] bg-[#080808]/95 border border-[#474747] text-[#f3f3f3] text-[12px] font-mono backdrop-blur-md animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-ping shrink-0" />
            <div>
              <span className="text-[#f3f3f3]">
                Fingerprint Drift Detected: {nodes.find((n) => n.id === mutatedNodeId)?.label || mutatedNodeId}
              </span>
              <span className="text-[10px] bg-[#1a1a1a] text-[#f3f3f3] px-2 py-0.5 rounded border border-[#212121] uppercase ml-2">
                2-Hop Rebuild Dispatched
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onSwitchToCreTab && (
              <button
                onClick={onSwitchToCreTab}
                className="px-3 py-1 rounded-[8px] bg-transparent border border-[#474747] hover:border-[#ffffff] text-[#f3f3f3] text-[12px] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Zap className="w-3 h-3 text-[#6f6759]" />
                <span>Inspect in CRE</span>
              </button>
            )}
            {onResetBaseline && (
              <button
                onClick={onResetBaseline}
                className="px-3 py-1 rounded-[8px] bg-[#ffffff] hover:bg-[#f3f3f3] text-[#101010] text-[12px] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
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
                id="hyper-arrow-default"
                viewBox="0 -5 10 10"
                refX="8"
                refY="0"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path d="M0,-4L8,0L0,4" fill="#212121" />
              </marker>
              <marker
                id="hyper-arrow-active"
                viewBox="0 -5 10 10"
                refX="8"
                refY="0"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0,-4L8,0L0,4" fill="#ffffff" />
              </marker>
              <marker
                id="hyper-arrow-gold"
                viewBox="0 -5 10 10"
                refX="8"
                refY="0"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0,-4L8,0L0,4" fill="#6f6759" />
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

                const nodeR = 24;

                if (layoutMode === "hierarchy") {
                  const y1 = src.y + nodeR;
                  const x1 = src.x;
                  const y2 = tgt.y - nodeR;
                  const x2 = tgt.x;
                  const dy = y2 - y1;

                  d = `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.5}, ${x2} ${y2 - dy * 0.5}, ${x2} ${y2}`;
                  midX = (x1 + x2) / 2;
                  midY = (y1 + y2) / 2;
                } else {
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
                    ? "#6f6759"
                    : "#ffffff"
                  : isDimmed
                  ? "#101010"
                  : "#212121";

                const marker = isActive
                  ? edge.type.includes("oracle") || edge.type.includes("governance")
                    ? "url(#hyper-arrow-gold)"
                    : "url(#hyper-arrow-active)"
                  : "url(#hyper-arrow-default)";

                return (
                  <g key={edgeKey} className="edge-group">
                    <path
                      d={d}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isActive ? 1.5 : 1}
                      strokeOpacity={isActive ? 1.0 : isDimmed ? 0.08 : 0.45}
                      markerEnd={marker}
                      className="transition-all duration-200"
                    />

                    {isActive && (
                      <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none">
                        <rect
                          x="-38"
                          y="-8"
                          width="76"
                          height="16"
                          rx="4"
                          fill="#080808"
                          stroke={strokeColor}
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="3.5"
                          fill="#f3f3f3"
                          fontFamily="ui-monospace, monospace"
                          fontSize="7.5"
                          fontWeight="400"
                          textAnchor="middle"
                        >
                          {edge.label.toUpperCase()}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Circular Nodes */}
            <g className="graph-nodes">
              {nodes.map((node) => {
                const pos = layoutCoordinates[node.id];
                if (!pos) return null;

                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isConnected = activeNetwork.nodes.has(node.id);
                const isDimmed = activeTargetId && !isSelected && !isHovered && !isConnected;

                const style = getStyle(node.category, node.adminType);
                const isMutated = mutatedNodeId === node.id;
                const nodeR = 24;

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
                    {/* Active Outer Ring */}
                    {(isSelected || isHovered) && (
                      <circle
                        r={nodeR + 6}
                        fill="transparent"
                        stroke={isSelected ? "#ffffff" : "#6f6759"}
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Node Main Circle */}
                    <circle
                      r={nodeR}
                      fill={style.fill}
                      stroke={isSelected ? "#ffffff" : isHovered ? "#c1c1c1" : style.stroke}
                      strokeWidth={isSelected ? 2 : 1}
                      className="transition-transform duration-200"
                    />

                    {/* Mutated Ring */}
                    {isMutated && (
                      <circle
                        r={nodeR + 4}
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Pulse Green status pip */}
                    <circle
                      cx={nodeR - 5}
                      cy={-nodeR + 6}
                      r="3.5"
                      fill={isMutated ? "#f59e0b" : "#98ff38"}
                      stroke="#080808"
                      strokeWidth="1.5"
                    />

                    {/* Inner Glyph Icon */}
                    <text
                      textAnchor="middle"
                      dy=".35em"
                      fill="#f3f3f3"
                      fontFamily="ui-monospace, monospace"
                      fontSize="11"
                      fontWeight="400"
                      pointerEvents="none"
                    >
                      {style.glyph}
                    </text>

                    {/* Node Label Underneath Circle */}
                    <text
                      y={nodeR + 16}
                      textAnchor="middle"
                      fill="#f3f3f3"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="11.5"
                      fontWeight="400"
                      letterSpacing="-0.01em"
                      pointerEvents="none"
                    >
                      {stage === "registry" ? "Aave V3 Protocol Registry" : node.label}
                    </text>

                    {/* Address Snippet */}
                    <text
                      y={nodeR + 29}
                      textAnchor="middle"
                      fill="#9c9c9c"
                      fontFamily="ui-monospace, monospace"
                      fontSize="8.5"
                      pointerEvents="none"
                    >
                      {node.address.slice(0, 6)}...{node.address.slice(-4)}
                    </text>

                    {/* Risk Score */}
                    <text
                      y={nodeR + 40}
                      textAnchor="middle"
                      fill={isMutated ? "#f59e0b" : "#9c9c9c"}
                      fontFamily="ui-monospace, monospace"
                      fontSize="8"
                      fontWeight="400"
                      pointerEvents="none"
                    >
                      {isMutated ? "MUTATED · " + node.riskScore : "RISK: " + node.riskScore}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>

      {/* Progressive Drill-down Callout Buttons at Bottom Center */}
      {stage === "registry" && onAdvanceStage && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-fadeIn">
          <button
            onClick={() => onAdvanceStage("hop0")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ffffff] hover:bg-[#f3f3f3] text-[#101010] text-[12px] uppercase font-normal tracking-wider transition-colors cursor-pointer shadow-lg"
          >
            <span>Click node to reveal Hop 0 (Core Mesh)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {stage === "hop0" && onAdvanceStage && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-fadeIn">
          <button
            onClick={() => onAdvanceStage("hop1")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ffffff] hover:bg-[#f3f3f3] text-[#101010] text-[12px] uppercase font-normal tracking-wider transition-colors cursor-pointer shadow-lg"
          >
            <span>Click node to reveal Hop 1 (Governance & Logic)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {stage === "hop1" && onAdvanceStage && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-fadeIn">
          <button
            onClick={() => onAdvanceStage("hop2")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ffffff] hover:bg-[#f3f3f3] text-[#101010] text-[12px] uppercase font-normal tracking-wider transition-colors cursor-pointer shadow-lg"
          >
            <span>Click node to reveal Hop 2 (Chainlink Oracles)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {stage === "hop2" && onAdvanceStage && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-fadeIn">
          <button
            onClick={() => onAdvanceStage("all")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ffffff] hover:bg-[#f3f3f3] text-[#101010] text-[12px] uppercase font-normal tracking-wider transition-colors cursor-pointer shadow-lg"
          >
            <span>View All 15 Nodes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bottom Floating Canvas Controls */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Zoom Controls */}
          <div className="flex items-center bg-[#080808] border border-[#212121] rounded-[4px] p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 2.2))}
              className="p-1.5 rounded-[3px] text-[#9c9c9c] hover:text-[#f3f3f3] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.5))}
              className="p-1.5 rounded-[3px] text-[#9c9c9c] hover:text-[#f3f3f3] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-[3px] text-[#9c9c9c] hover:text-[#f3f3f3] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              title="Reset Zoom & Pan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Minimal Legend */}
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-[4px] bg-[#080808]/90 border border-[#212121] text-[11px] text-[#9c9c9c] uppercase tracking-wider pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-[#c1c1c1] bg-transparent" />
            <span>Proxy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-[#474747] bg-transparent" />
            <span>Impl</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-[#6f6759] bg-transparent" />
            <span>Oracle / Gov</span>
          </div>
        </div>
      </div>

      {/* Contract Justification Modal */}
      {showJustificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101010]/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#080808] border border-[#212121] rounded-[8px] p-6 text-left max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-[#212121] mb-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#6f6759]" />
                <h3 className="text-[16px] font-normal text-[#f3f3f3] uppercase tracking-wider">
                  Contract Lineage Verification
                </h3>
              </div>
              <button
                onClick={() => setShowJustificationModal(false)}
                className="p-1 rounded-[4px] text-[#9c9c9c] hover:text-[#f3f3f3] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 text-[13px]">
              {nodes
                .filter((n) => n.justification)
                .map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-[4px] bg-[#101010] border border-[#212121]"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="text-[#f3f3f3] font-medium">{item.label}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#1a1a1a] text-[#9c9c9c] border border-[#212121] uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#9c9c9c] mb-2">
                      <span className="truncate">{item.address}</span>
                      <button
                        onClick={() => copy(item.address)}
                        className="p-1 hover:text-[#f3f3f3] cursor-pointer"
                        title="Copy Address"
                      >
                        {copiedAddress === item.address ? (
                          <Check className="w-3.5 h-3.5 text-[#98ff38]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <p className="text-[12px] text-[#9c9c9c] leading-relaxed">
                      {item.justification?.description}
                    </p>
                    <div className="mt-2 text-[11px] font-mono text-[#6f6759] flex items-center gap-3">
                      <span>Source: {item.justification?.source}</span>
                      <span>·</span>
                      <span>Method: {item.justification?.method}</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-4 border-t border-[#212121] mt-4 flex items-center justify-between">
              <span className="text-[11px] text-[#9c9c9c]">
                Source: Ethereum Mainnet RPC · Verified against Etherscan
              </span>
              <button
                onClick={() => setShowJustificationModal(false)}
                className="px-4 py-1.5 rounded-full bg-[#ffffff] hover:bg-[#f3f3f3] text-[#101010] text-[12px] uppercase font-normal tracking-wider transition-colors cursor-pointer"
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

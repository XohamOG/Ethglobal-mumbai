"use client";

import React, { useRef, useState, useMemo } from "react";
import { GraphNode, GraphEdge } from "@/lib/graph-data";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Zap,
} from "lucide-react";

interface ProvenanceGraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId?: string | null;
  onSelectNode: (node: GraphNode | null) => void;
  isRebuilding?: boolean;
  mutatedNodeId?: string;
  onResetBaseline?: () => void;
  onSwitchToCreTab?: () => void;
  activeHop?: number | "all" | "oracle-chain";
}

// Canonical balanced layout coordinates for 15 Aave V3 nodes
// Configured to showcase: PoolAddressesProvider -> Pool (Proxy) -> AaveOracle -> Chainlink Feeds
const DEFAULT_NODE_COORDINATES: Record<string, { x: number; y: number }> = {
  // Step 1: Root Address Registry (Left)
  "aave-v3-addresses-provider": { x: 260, y: 140 },

  // Step 2: Pool Core Proxy (Center)
  "aave-v3-pool": { x: 570, y: 140 },

  // Step 3: Aave Oracle (Center Lower)
  "aave-v3-oracle": { x: 570, y: 340 },

  // Step 4: Upstream Chainlink Price Feeds (Bottom Arc)
  "chainlink-eth-usd": { x: 250, y: 530 },
  "chainlink-btc-usd": { x: 410, y: 530 },
  "chainlink-usdc-usd": { x: 570, y: 530 },
  "chainlink-dai-usd": { x: 730, y: 530 },
  "chainlink-usdt-usd": { x: 890, y: 530 },

  // Implementations & Governance Admins (Surrounding)
  "aave-v3-pool-impl": { x: 880, y: 140 },
  "aave-v3-governance-executor": { x: 880, y: 280 },
  "aave-v3-pool-configurator": { x: 260, y: 280 },
  "aave-v3-configurator-impl": { x: 260, y: 420 },
  "aave-v3-acl-manager": { x: 420, y: 240 },
  "aave-v3-emergency-safe": { x: 720, y: 240 },
  "aave-v3-data-provider": { x: 880, y: 420 },
};

// Rich Graphino / Neo4j Color Schemes & Labels by Node
const NODE_CONFIG: Record<
  string,
  { bg: string; border: string; dot: string; lines: [string, string] }
> = {
  "aave-v3-addresses-provider": {
    bg: "#065f46",
    border: "#10b981",
    dot: "#34d399",
    lines: ["Addresses", "Provider"],
  },
  "aave-v3-pool": {
    bg: "#9a3412",
    border: "#f97316",
    dot: "#fb923c",
    lines: ["Aave V3 Pool", "(Proxy)"],
  },
  "aave-v3-oracle": {
    bg: "#854d0e",
    border: "#eab308",
    dot: "#fef08a",
    lines: ["Aave", "Oracle"],
  },
  "chainlink-eth-usd": {
    bg: "#155e75",
    border: "#06b6d4",
    dot: "#67e8f9",
    lines: ["ETH / USD", "Chainlink"],
  },
  "chainlink-btc-usd": {
    bg: "#155e75",
    border: "#06b6d4",
    dot: "#67e8f9",
    lines: ["BTC / USD", "Chainlink"],
  },
  "chainlink-usdc-usd": {
    bg: "#155e75",
    border: "#06b6d4",
    dot: "#67e8f9",
    lines: ["USDC / USD", "Chainlink"],
  },
  "chainlink-dai-usd": {
    bg: "#155e75",
    border: "#06b6d4",
    dot: "#67e8f9",
    lines: ["DAI / USD", "Chainlink"],
  },
  "chainlink-usdt-usd": {
    bg: "#155e75",
    border: "#06b6d4",
    dot: "#67e8f9",
    lines: ["USDT / USD", "Chainlink"],
  },
  "aave-v3-pool-impl": {
    bg: "#3730a3",
    border: "#6366f1",
    dot: "#a5b4fc",
    lines: ["Pool Logic", "(Implementation)"],
  },
  "aave-v3-pool-configurator": {
    bg: "#9a3412",
    border: "#f97316",
    dot: "#fb923c",
    lines: ["Configurator", "(Proxy)"],
  },
  "aave-v3-configurator-impl": {
    bg: "#3730a3",
    border: "#6366f1",
    dot: "#a5b4fc",
    lines: ["Config Logic", "(Implementation)"],
  },
  "aave-v3-governance-executor": {
    bg: "#581c87",
    border: "#a855f7",
    dot: "#d8b4fe",
    lines: ["Governance", "Timelock"],
  },
  "aave-v3-emergency-safe": {
    bg: "#831843",
    border: "#ec4899",
    dot: "#f472b6",
    lines: ["Emergency Safe", "4/7 Multisig"],
  },
  "aave-v3-acl-manager": {
    bg: "#075985",
    border: "#38bdf8",
    dot: "#bae6fd",
    lines: ["ACL", "Manager"],
  },
  "aave-v3-data-provider": {
    bg: "#075985",
    border: "#38bdf8",
    dot: "#bae6fd",
    lines: ["Data", "Provider"],
  },
};

// Relationship Type Normalizer (Graphino style: DEPENDS_ON, USES_ORACLE, etc.)
const EDGE_RELATIONSHIPS: Record<string, string> = {
  "aave-v3-addresses-provider->aave-v3-pool": "REGISTERS_POOL",
  "aave-v3-addresses-provider->aave-v3-pool-configurator": "REGISTERS_CONFIG",
  "aave-v3-pool->aave-v3-oracle": "USES_ORACLE",
  "aave-v3-pool->aave-v3-pool-impl": "DELEGATES_TO",
  "aave-v3-pool->aave-v3-governance-executor": "GOVERNED_BY",
  "aave-v3-pool-configurator->aave-v3-configurator-impl": "DELEGATES_TO",
  "aave-v3-acl-manager->aave-v3-emergency-safe": "CONTROLLED_BY",
  "aave-v3-oracle->chainlink-eth-usd": "FETCHES_FEED",
  "aave-v3-oracle->chainlink-btc-usd": "FETCHES_FEED",
  "aave-v3-oracle->chainlink-usdc-usd": "FETCHES_FEED",
  "aave-v3-oracle->chainlink-dai-usd": "FETCHES_FEED",
  "aave-v3-oracle->chainlink-usdt-usd": "FETCHES_FEED",
};

export function ProvenanceGraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  isRebuilding = false,
  mutatedNodeId,
  onResetBaseline,
  onSwitchToCreTab,
  activeHop = "all",
}: ProvenanceGraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);

  // Pan and Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Draggable Node state
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>(
    () => ({ ...DEFAULT_NODE_COORDINATES })
  );
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMovedNode, setHasMovedNode] = useState(false);

  // Hover state
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Reset positions to default clean layout
  const handleResetPositions = () => {
    setNodePositions({ ...DEFAULT_NODE_COORDINATES });
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Convert client mouse event coordinates to SVG user-space coordinates
  const getSvgPoint = (e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current || !groupRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = groupRef.current.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  };

  // Node Drag Handlers
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const pt = getSvgPoint(e);
    const current = nodePositions[nodeId] || DEFAULT_NODE_COORDINATES[nodeId] || { x: 570, y: 340 };

    setDraggedNodeId(nodeId);
    setHasMovedNode(false);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setDragOffset({
      x: pt.x - current.x,
      y: pt.y - current.y,
    });
  };

  // Canvas Pan Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest(".interactive-node, button")) return;

    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. If dragging a node:
    if (draggedNodeId) {
      const movedDist = Math.hypot(e.clientX - dragStartPos.x, e.clientY - dragStartPos.y);
      if (movedDist > 3) {
        setHasMovedNode(true);
      }

      const pt = getSvgPoint(e);
      const newX = Math.round(pt.x - dragOffset.x);
      const newY = Math.round(pt.y - dragOffset.y);

      setNodePositions((prev) => ({
        ...prev,
        [draggedNodeId]: { x: newX, y: newY },
      }));
      return;
    }

    // 2. If panning the canvas:
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
    setIsPanning(false);
  };

  // Highlight and Dependency Calculation Logic
  // - Default: No node selected + activeHop "all" => ALL nodes & edges active (not dimmed)
  // - Node clicked => Selected node + its direct dependencies active, rest dimmed
  // - Hop clicked => Nodes in that hop + relevant edges active, rest dimmed
  // - "oracle-chain" => PoolAddressesProvider -> Pool -> AaveOracle -> Chainlink Feeds
  const { highlightedNodes, highlightedEdges, hasFilter } = useMemo(() => {
    // 1. If a node is explicitly selected by user:
    if (selectedNodeId) {
      const activeNodes = new Set<string>([selectedNodeId]);
      const activeEdges = new Set<string>();

      edges.forEach((e) => {
        if (e.from === selectedNodeId || e.to === selectedNodeId) {
          activeNodes.add(e.from);
          activeNodes.add(e.to);
          activeEdges.add(`${e.from}->${e.to}`);
        }
      });

      return {
        highlightedNodes: activeNodes,
        highlightedEdges: activeEdges,
        hasFilter: true,
      };
    }

    // 2. If "oracle-chain" preset is selected:
    if (activeHop === "oracle-chain") {
      const chainNodes = new Set<string>([
        "aave-v3-addresses-provider",
        "aave-v3-pool",
        "aave-v3-oracle",
        "chainlink-eth-usd",
        "chainlink-btc-usd",
        "chainlink-usdc-usd",
        "chainlink-dai-usd",
        "chainlink-usdt-usd",
      ]);
      const chainEdges = new Set<string>([
        "aave-v3-addresses-provider->aave-v3-pool",
        "aave-v3-pool->aave-v3-oracle",
        "aave-v3-oracle->chainlink-eth-usd",
        "aave-v3-oracle->chainlink-btc-usd",
        "aave-v3-oracle->chainlink-usdc-usd",
        "aave-v3-oracle->chainlink-dai-usd",
        "aave-v3-oracle->chainlink-usdt-usd",
      ]);

      return {
        highlightedNodes: chainNodes,
        highlightedEdges: chainEdges,
        hasFilter: true,
      };
    }

    // 3. If a hop is active (0, 1, or 2):
    if (activeHop !== "all") {
      const activeNodes = new Set<string>();
      const activeEdges = new Set<string>();

      nodes.forEach((n) => {
        if (n.hop === activeHop) {
          activeNodes.add(n.id);
        }
      });

      // Context bridges
      if (activeHop === 1) {
        activeNodes.add("aave-v3-pool");
        activeNodes.add("aave-v3-pool-configurator");
      } else if (activeHop === 2) {
        activeNodes.add("aave-v3-oracle");
      }

      edges.forEach((e) => {
        if (activeNodes.has(e.from) && activeNodes.has(e.to)) {
          activeEdges.add(`${e.from}->${e.to}`);
        }
      });

      return {
        highlightedNodes: activeNodes,
        highlightedEdges: activeEdges,
        hasFilter: true,
      };
    }

    // 4. Default state: Highlight ALL nodes & edges
    return {
      highlightedNodes: new Set<string>(nodes.map((n) => n.id)),
      highlightedEdges: new Set<string>(edges.map((e) => `${e.from}->${e.to}`)),
      hasFilter: false,
    };
  }, [selectedNodeId, activeHop, nodes, edges]);

  return (
    <div className="relative w-full h-full min-h-[580px] bg-[#0d0d0d] overflow-hidden select-none flex flex-col justify-between">
      {/* Live Rebuild / Mutation Drift HUD Alert */}
      {mutatedNodeId && (
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between p-3 rounded-[6px] bg-[#080808]/95 border border-[#474747] text-[#f3f3f3] text-[12px] font-mono backdrop-blur-md animate-fadeIn">
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
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => {
          if (!hasMovedNode) {
            onSelectNode(null);
          }
        }}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox="0 0 1140 680"
          preserveAspectRatio="xMidYMid meet"
        >
          <g
            ref={groupRef}
            transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}
            style={{ transformOrigin: "570px 340px" }}
          >
            {/* Arrowhead Markers — Graphino Cyan / Teal */}
            <defs>
              <marker
                id="graphino-arrow-default"
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
                id="graphino-arrow-active"
                viewBox="0 -5 10 10"
                refX="8"
                refY="0"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
              >
                <path d="M0,-4L9,0L0,4" fill="#22d3ee" />
              </marker>
              <marker
                id="graphino-arrow-dimmed"
                viewBox="0 -5 10 10"
                refX="8"
                refY="0"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path d="M0,-3.5L7,0L0,3.5" fill="#262626" />
              </marker>
            </defs>

            {/* Connecting Directed Curved Edges */}
            <g className="graph-edges">
              {edges.map((edge) => {
                const fromPos = nodePositions[edge.from] || DEFAULT_NODE_COORDINATES[edge.from];
                const toPos = nodePositions[edge.to] || DEFAULT_NODE_COORDINATES[edge.to];
                if (!fromPos || !toPos) return null;

                const edgeKey = `${edge.from}->${edge.to}`;
                const isEdgeHighlighted = highlightedEdges.has(edgeKey);
                const isDimmed = hasFilter && !isEdgeHighlighted;

                // Node radius offset (r = 34) so arrow meets circle border cleanly
                const nodeR = 34;
                const dx = toPos.x - fromPos.x;
                const dy = toPos.y - fromPos.y;
                const dist = Math.hypot(dx, dy);

                const nx = dist > 0 ? (dx / dist) * nodeR : 0;
                const ny = dist > 0 ? (dy / dist) * nodeR : 0;

                const startX = fromPos.x + nx;
                const startY = fromPos.y + ny;
                const endX = toPos.x - nx;
                const endY = toPos.y - ny;

                // Smooth bezier curvature
                const curvature = Math.min(Math.abs(dy) * 0.45, 120);
                const cp1x = startX;
                const cp1y = startY + (dy > 0 ? curvature : -curvature);
                const cp2x = endX;
                const cp2y = endY - (dy > 0 ? curvature : -curvature);

                const d = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;

                const relLabel = EDGE_RELATIONSHIPS[edgeKey] || edge.label.toUpperCase().replace(/\s+/g, "_");

                const strokeColor = isDimmed
                  ? "#262626"
                  : isEdgeHighlighted
                  ? "#22d3ee"
                  : "#0284c7";

                const strokeWidth = isEdgeHighlighted ? 2.2 : isDimmed ? 0.8 : 1.5;
                const strokeOpacity = isEdgeHighlighted ? 1.0 : isDimmed ? 0.08 : 0.65;
                const markerEnd = isDimmed
                  ? "url(#graphino-arrow-dimmed)"
                  : isEdgeHighlighted
                  ? "url(#graphino-arrow-active)"
                  : "url(#graphino-arrow-default)";

                return (
                  <g key={edgeKey} className="edge-group">
                    <path
                      d={d}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      markerEnd={markerEnd}
                      className="transition-all duration-150"
                    />

                    {/* Edge Label Badge Along the Curve (Graphino style) */}
                    {!isDimmed && (
                      <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none">
                        <rect
                          x="-38"
                          y="-9"
                          width="76"
                          height="18"
                          rx="4"
                          fill="#080808"
                          stroke={isEdgeHighlighted ? "#22d3ee" : "#0284c7"}
                          strokeWidth={isEdgeHighlighted ? "1.2" : "0.8"}
                          opacity={isEdgeHighlighted ? 1 : 0.8}
                        />
                        <text
                          x="0"
                          y="3.5"
                          fill={isEdgeHighlighted ? "#67e8f9" : "#38bdf8"}
                          fontFamily="ui-monospace, monospace"
                          fontSize="7.5"
                          fontWeight="700"
                          textAnchor="middle"
                          letterSpacing="0.04em"
                        >
                          {relLabel}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Rich Solid Circular Nodes (Graphino Neo4j Visuals) */}
            <g className="graph-nodes">
              {nodes.map((node) => {
                const pos = nodePositions[node.id] || DEFAULT_NODE_COORDINATES[node.id];
                if (!pos) return null;

                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isNodeHighlighted = highlightedNodes.has(node.id);
                const isDimmed = hasFilter && !isNodeHighlighted;

                const config = NODE_CONFIG[node.id] || {
                  bg: "#1e293b",
                  border: "#64748b",
                  dot: "#94a3b8",
                  lines: [node.label, ""],
                };

                const isMutated = mutatedNodeId === node.id;
                const nodeR = 34;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="interactive-node cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasMovedNode) return;
                      if (isSelected) {
                        onSelectNode(null);
                      } else {
                        onSelectNode(node);
                      }
                    }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    opacity={isDimmed ? 0.15 : 1}
                  >
                    {/* Active Selected Cyan Glow Ring */}
                    {isSelected && (
                      <circle
                        r={nodeR + 8}
                        fill="transparent"
                        stroke="#22d3ee"
                        strokeWidth="2"
                        strokeDasharray="5 3"
                        className="animate-spin"
                        style={{ animationDuration: "14s" }}
                      />
                    )}

                    {/* Hover Ring */}
                    {isHovered && !isSelected && (
                      <circle
                        r={nodeR + 5}
                        fill="transparent"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                      />
                    )}

                    {/* Mutated / Drift Ring */}
                    {isMutated && (
                      <circle
                        r={nodeR + 6}
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Node Main Solid Colored Circle */}
                    <circle
                      r={nodeR}
                      fill={config.bg}
                      stroke={isSelected ? "#ffffff" : isHovered ? "#67e8f9" : config.border}
                      strokeWidth={isSelected ? 2.5 : 2}
                      className="transition-all duration-150"
                      filter="drop-shadow(0 2px 8px rgba(0, 0, 0, 0.6))"
                    />

                    {/* Status Indicator Pip */}
                    <circle
                      cx={nodeR - 6}
                      cy={-nodeR + 7}
                      r="4"
                      fill={isMutated ? "#f59e0b" : config.dot}
                      stroke="#080808"
                      strokeWidth="1.5"
                    />

                    {/* Primary Text Inside Node Circle (Line 1) */}
                    <text
                      textAnchor="middle"
                      dy={config.lines[1] ? "-3" : "4"}
                      fill="#ffffff"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontSize="10.5"
                      fontWeight="600"
                      letterSpacing="-0.01em"
                      pointerEvents="none"
                    >
                      {config.lines[0]}
                    </text>

                    {/* Secondary Text Inside Node Circle (Line 2) */}
                    {config.lines[1] && (
                      <text
                        textAnchor="middle"
                        dy="11"
                        fill="#e2e8f0"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="9"
                        fontWeight="500"
                        opacity="0.9"
                        pointerEvents="none"
                      >
                        {config.lines[1]}
                      </text>
                    )}

                    {/* Address Snippet Below Circle */}
                    <text
                      y={nodeR + 15}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontFamily="ui-monospace, monospace"
                      fontSize="8.5"
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

      {/* Floating Canvas Controls & Legend */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        {/* Left Toolbar: Zoom & Position Reset */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center bg-[#080808] border border-[#212121] rounded-[6px] p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 2.2))}
              className="p-1.5 rounded-[4px] text-[#9c9c9c] hover:text-[#f3f3f3] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.5))}
              className="p-1.5 rounded-[4px] text-[#9c9c9c] hover:text-[#f3f3f3] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="p-1.5 rounded-[4px] text-[#9c9c9c] hover:text-[#f3f3f3] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              title="Reset Zoom & Pan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-[1px] bg-[#212121] mx-1" />

            <button
              onClick={handleResetPositions}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] uppercase tracking-wider text-[#9c9c9c] hover:text-[#f3f3f3] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              title="Reset node positions to default layout"
            >
              <Move className="w-3 h-3 text-[#38bdf8]" />
              <span>Reset Layout</span>
            </button>
          </div>
        </div>

        {/* Center Canvas Flow Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#080808]/90 border border-[#212121] text-[11px] text-[#9c9c9c] pointer-events-auto">
          {selectedNodeId ? (
            <span>
              Isolated dependencies for:{" "}
              <strong className="text-[#38bdf8] font-normal">
                {nodes.find((n) => n.id === selectedNodeId)?.label}
              </strong>{" "}
              · Click canvas to clear
            </span>
          ) : activeHop === "oracle-chain" ? (
            <span>
              <strong className="text-[#38bdf8]">Oracle Dependency Chain Active:</strong> AddressesProvider ➔ Pool (Proxy) ➔ AaveOracle ➔ Chainlink Feeds
            </span>
          ) : (
            <span>Click any node to isolate dependencies · Drag nodes to reposition</span>
          )}
        </div>

        {/* Right Legend */}
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-[6px] bg-[#080808]/90 border border-[#212121] text-[11px] text-[#9c9c9c] uppercase tracking-wider pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
            <span>Registry</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
            <span>Proxy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
            <span>Oracle</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" />
            <span>Price Feed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
            <span>Impl</span>
          </div>
        </div>
      </div>
    </div>
  );
}

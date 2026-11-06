"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import { GraphNode, GraphEdge, getRiskScoreConfig } from "@/lib/graph-data";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Check,
  Copy,
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
  activeHop?: number | "all";
  onResetLayout?: () => void;
}

// Canonical balanced layout coordinates for 15 Aave V3 nodes
const DEFAULT_NODE_COORDINATES: Record<string, { x: number; y: number }> = {
  // Layer 0 (y = 75) — Root Protocol Registry
  "aave-v3-addresses-provider": { x: 570, y: 75 },

  // Layer 1 (y = 210) — Hop 0 Core Proxies
  "aave-v3-pool": { x: 270, y: 210 },
  "aave-v3-pool-configurator": { x: 470, y: 210 },
  "aave-v3-acl-manager": { x: 670, y: 210 },
  "aave-v3-data-provider": { x: 870, y: 210 },

  // Layer 2 (y = 370) — Hop 1 Implementations, Governance Timelock, Safe & Oracle
  "aave-v3-pool-impl": { x: 210, y: 370 },
  "aave-v3-configurator-impl": { x: 390, y: 370 },
  "aave-v3-oracle": { x: 570, y: 370 },
  "aave-v3-governance-executor": { x: 750, y: 370 },
  "aave-v3-emergency-safe": { x: 930, y: 370 },

  // Layer 3 (y = 530) — Hop 2 Chainlink Oracles
  "chainlink-eth-usd": { x: 250, y: 530 },
  "chainlink-btc-usd": { x: 410, y: 530 },
  "chainlink-usdc-usd": { x: 570, y: 530 },
  "chainlink-dai-usd": { x: 730, y: 530 },
  "chainlink-usdt-usd": { x: 890, y: 530 },
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
    if (e.button !== 0) return; // Only primary button
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

  // Node Category Configuration (Hyperstudio wireframe tokens)
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

  // Highlight and Dependency Calculation Logic
  // - Default: No node selected + activeHop "all" => ALL nodes & edges active (not dimmed)
  // - Node clicked => Selected node + its direct dependencies active, rest dimmed
  // - Hop clicked => Nodes in that hop + relevant edges active, rest dimmed
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

    // 2. If a hop is active (0, 1, or 2):
    if (activeHop !== "all") {
      const activeNodes = new Set<string>();
      const activeEdges = new Set<string>();

      nodes.forEach((n) => {
        if (n.hop === activeHop) {
          activeNodes.add(n.id);
        }
      });

      // Also highlight associated proxy bridges for context
      if (activeHop === 1) {
        // Hop 1 connects to Pool and Configurator
        activeNodes.add("aave-v3-pool");
        activeNodes.add("aave-v3-pool-configurator");
      } else if (activeHop === 2) {
        // Hop 2 connects to AaveOracle
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

    // 3. Default state: Highlight ALL nodes & edges
    return {
      highlightedNodes: new Set<string>(nodes.map((n) => n.id)),
      highlightedEdges: new Set<string>(edges.map((e) => `${e.from}->${e.to}`)),
      hasFilter: false,
    };
  }, [selectedNodeId, activeHop, nodes, edges]);

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
                <path d="M0,-4L8,0L0,4" fill="#474747" />
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

            {/* Connecting Directed Edges */}
            <g className="graph-edges">
              {edges.map((edge) => {
                const fromPos = nodePositions[edge.from] || DEFAULT_NODE_COORDINATES[edge.from];
                const toPos = nodePositions[edge.to] || DEFAULT_NODE_COORDINATES[edge.to];
                if (!fromPos || !toPos) return null;

                const edgeKey = `${edge.from}->${edge.to}`;
                const isEdgeHighlighted = highlightedEdges.has(edgeKey);
                const isDimmed = hasFilter && !isEdgeHighlighted;

                // Node radius offset so arrow meets the circle border cleanly
                const nodeR = 24;
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

                const strokeColor = isEdgeHighlighted
                  ? edge.type === "governance" || edge.type === "oracle"
                    ? "#6f6759"
                    : "#ffffff"
                  : "#474747";

                const marker = isEdgeHighlighted
                  ? edge.type === "governance" || edge.type === "oracle"
                    ? "url(#hyper-arrow-gold)"
                    : "url(#hyper-arrow-active)"
                  : "url(#hyper-arrow-default)";

                return (
                  <g key={edgeKey} className="edge-group">
                    <path
                      d={d}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isEdgeHighlighted ? 2 : 1}
                      strokeOpacity={isEdgeHighlighted ? 1.0 : isDimmed ? 0.04 : 0.45}
                      markerEnd={marker}
                      className="transition-all duration-150"
                    />

                    {/* Edge Label Badge on Active Highlight */}
                    {isEdgeHighlighted && (
                      <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none">
                        <rect
                          x="-42"
                          y="-9"
                          width="84"
                          height="18"
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

            {/* Circular Draggable Nodes */}
            <g className="graph-nodes">
              {nodes.map((node) => {
                const pos = nodePositions[node.id] || DEFAULT_NODE_COORDINATES[node.id];
                if (!pos) return null;

                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isNodeHighlighted = highlightedNodes.has(node.id);
                const isDimmed = hasFilter && !isNodeHighlighted;

                const style = getStyle(node.category, node.adminType);
                const isMutated = mutatedNodeId === node.id;
                const nodeR = 24;

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
                        onSelectNode(null); // Deselect on clicking selected node
                      } else {
                        onSelectNode(node);
                      }
                    }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    opacity={isDimmed ? 0.15 : 1}
                  >
                    {/* Active Selected Halo Ring */}
                    {isSelected && (
                      <circle
                        r={nodeR + 7}
                        fill="transparent"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        className="animate-spin"
                        style={{ animationDuration: "12s" }}
                      />
                    )}

                    {/* Hover Ring */}
                    {isHovered && !isSelected && (
                      <circle
                        r={nodeR + 5}
                        fill="transparent"
                        stroke="#6f6759"
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
                      className="transition-transform duration-150"
                    />

                    {/* Mutated / Drift Ring */}
                    {isMutated && (
                      <circle
                        r={nodeR + 4}
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Status Pip */}
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
                      fontSize="11"
                      fontWeight="400"
                      letterSpacing="-0.01em"
                      pointerEvents="none"
                    >
                      {node.label}
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
              <Move className="w-3 h-3 text-[#6f6759]" />
              <span>Reset Layout</span>
            </button>
          </div>
        </div>

        {/* Center Canvas Hint */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#080808]/85 border border-[#212121] text-[11px] text-[#9c9c9c] pointer-events-auto">
          {selectedNodeId ? (
            <span>
              Isolated dependencies for:{" "}
              <strong className="text-[#f3f3f3] font-normal">
                {nodes.find((n) => n.id === selectedNodeId)?.label}
              </strong>{" "}
              · Click background to clear
            </span>
          ) : (
            <span>Click any node to highlight dependencies · Drag nodes to reposition</span>
          )}
        </div>

        {/* Right Legend */}
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-[6px] bg-[#080808]/90 border border-[#212121] text-[11px] text-[#9c9c9c] uppercase tracking-wider pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-[#c1c1c1] bg-transparent" />
            <span>Proxy (P)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-[#474747] bg-transparent" />
            <span>Impl (I)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-[#6f6759] bg-transparent" />
            <span>Oracle (O)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-[#9c9c9c] bg-transparent" />
            <span>Safe (S)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

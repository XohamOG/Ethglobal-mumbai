"use client";

import React, { useState, useMemo } from "react";
import { GraphNode, GraphEdge } from "@/lib/graph-data";
import { cn } from "@/lib/utils";

interface InteractiveGraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string;
  onSelectNode: (node: GraphNode) => void;
}

interface NodePosition {
  x: number;
  y: number;
}

export function InteractiveGraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
}: InteractiveGraphCanvasProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Group nodes by hop level and calculate fixed visual slot coordinates
  const positions = useMemo(() => {
    const posMap: Record<string, NodePosition> = {};
    const hop0 = nodes.filter((n) => n.hop === 0);
    const hop1 = nodes.filter((n) => n.hop === 1);
    const hop2 = nodes.filter((n) => n.hop === 2);

    const calcY = (index: number, total: number) => {
      const startY = 60;
      const spacing = 100;
      return startY + index * spacing;
    };

    hop0.forEach((n, i) => {
      posMap[n.id] = { x: 70, y: calcY(i, hop0.length) };
    });

    hop1.forEach((n, i) => {
      // Offset slightly to center vertically relative to hop 0
      posMap[n.id] = { x: 380, y: calcY(i, hop1.length) + 60 };
    });

    hop2.forEach((n, i) => {
      posMap[n.id] = { x: 690, y: calcY(i, hop2.length) + 20 };
    });

    return posMap;
  }, [nodes]);

  // Determine active/highlighted connections
  const activeEdges = useMemo(() => {
    const activeId = hoveredNodeId || selectedNodeId;
    if (!activeId) return new Set<string>();
    const active = new Set<string>();
    edges.forEach((e) => {
      if (e.from === activeId || e.to === activeId) {
        active.add(`${e.from}->${e.to}`);
      }
    });
    return active;
  }, [hoveredNodeId, selectedNodeId, edges]);

  const maxCanvasHeight = 580;

  return (
    <div className="relative w-full h-[580px] bg-[#07090e] border border-[#161a25] rounded-xl overflow-hidden select-none bg-grid">
      {/* Background layer label tags */}
      <div className="absolute top-3 left-4 text-[10px] font-mono uppercase tracking-widest text-[#444e66] pointer-events-none">
        Hop 0 · Core Protocol
      </div>
      <div className="absolute top-3 left-[40%] text-[10px] font-mono uppercase tracking-widest text-[#444e66] pointer-events-none">
        Hop 1 · Direct Dependencies
      </div>
      <div className="absolute top-3 right-6 text-[10px] font-mono uppercase tracking-widest text-[#444e66] pointer-events-none">
        Hop 2 · Transitive Dependencies
      </div>

      <svg className="w-full h-full" viewBox="0 0 920 580">
        <defs>
          {/* Arrow markers */}
          <marker
            id="arrow-default"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#2c344a" />
          </marker>
          <marker
            id="arrow-active"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#60a5fa" />
          </marker>
        </defs>

        {/* Connection Edges */}
        {edges.map((edge) => {
          const fromPos = positions[edge.from];
          const toPos = positions[edge.to];
          if (!fromPos || !toPos) return null;

          const edgeKey = `${edge.from}->${edge.to}`;
          const isActive = activeEdges.has(edgeKey);

          // Node cards are approx 200px wide, 64px high
          const startX = fromPos.x + 190;
          const startY = fromPos.y + 32;
          const endX = toPos.x;
          const endY = toPos.y + 32;

          // Smooth cubic bezier curve control points
          const dx = endX - startX;
          const cp1X = startX + dx * 0.5;
          const cp1Y = startY;
          const cp2X = endX - dx * 0.5;
          const cp2Y = endY;

          const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

          return (
            <g key={edgeKey}>
              {/* Background wider hit target */}
              <path
                d={pathData}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
                className="cursor-pointer"
              />
              {/* Actual visible connection line */}
              <path
                d={pathData}
                fill="none"
                stroke={isActive ? "#60a5fa" : "#1d2334"}
                strokeWidth={isActive ? 2 : 1.25}
                strokeDasharray={isActive ? "4 3" : undefined}
                markerEnd={isActive ? "url(#arrow-active)" : "url(#arrow-default)"}
                className="transition-all duration-200"
              />
            </g>
          );
        })}

        {/* Node Cards */}
        {nodes.map((node) => {
          const pos = positions[node.id];
          if (!pos) return null;

          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNodeId === node.id;

          const categoryColors = {
            proxy: { border: "#2563eb", badge: "bg-blue-950/80 text-blue-400 border-blue-900/60" },
            implementation: { border: "#059669", badge: "bg-emerald-950/80 text-emerald-400 border-emerald-900/60" },
            oracle: { border: "#d97706", badge: "bg-amber-950/80 text-amber-400 border-amber-900/60" },
            multisig: { border: "#9333ea", badge: "bg-purple-950/80 text-purple-400 border-purple-900/60" },
            token: { border: "#475569", badge: "bg-slate-900 text-slate-400 border-slate-800" },
          }[node.category];

          return (
            <foreignObject
              key={node.id}
              x={pos.x}
              y={pos.y}
              width={190}
              height={66}
              className="overflow-visible"
            >
              <div
                onClick={() => onSelectNode(node)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                style={{
                  borderColor: isSelected ? categoryColors.border : isHovered ? "#3b4460" : "#1b202e",
                }}
                className={cn(
                  "w-full h-full p-2.5 rounded-lg border bg-[#0d1017] transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm",
                  isSelected && "ring-1 ring-blue-500/40 bg-[#121622] scale-[1.02]",
                  isHovered && !isSelected && "bg-[#10131d]"
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-semibold text-white truncate max-w-[120px]">
                    {node.label}
                  </span>
                  <span className={cn("text-[9px] font-mono px-1 py-0.2 rounded border uppercase", categoryColors.badge)}>
                    {node.category.slice(0, 5)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#5b647c]">
                  <span className="truncate max-w-[90px]">
                    {node.address.slice(0, 6)}...{node.address.slice(-4)}
                  </span>
                  <span className="text-emerald-400 font-medium">
                    {node.riskScore === 0 ? "Safe (0)" : `R:${node.riskScore}`}
                  </span>
                </div>
              </div>
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
}

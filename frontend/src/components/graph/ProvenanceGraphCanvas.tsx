"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { GraphNode, GraphEdge } from "@/lib/graph-data";
import { ZoomIn, ZoomOut, RotateCcw, Play, Pause, Columns, Disc } from "lucide-react";

interface ProvenanceGraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string;
  onSelectNode: (node: GraphNode) => void;
}

interface SimulationNode extends d3.SimulationNodeDatum, GraphNode {
  r: number;
}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  label: string;
  type: string;
}

export function ProvenanceGraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
}: ProvenanceGraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"columns" | "radial">("columns");
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<SVGGElement | null>(null);

  // Category visual styles
  const categoryConfig: Record<string, { color: string; ring: string; glyph: string; name: string }> = {
    proxy: { color: "#0284c7", ring: "#38bdf8", glyph: "P", name: "Proxy" },
    implementation: { color: "#059669", ring: "#34d399", glyph: "I", name: "Implementation" },
    oracle: { color: "#d97706", ring: "#fbbf24", glyph: "O", name: "Oracle" },
    multisig: { color: "#9333ea", ring: "#c084fc", glyph: "S", name: "Safe Multisig" },
    timelock: { color: "#4f46e5", ring: "#818cf8", glyph: "T", name: "Timelock" },
    token: { color: "#0d9488", ring: "#2dd4bf", glyph: "$", name: "Reserve Token" },
  };

  const getNodeStyle = (category: string, adminType?: string) => {
    if (adminType === "timelock") return categoryConfig.timelock;
    return categoryConfig[category] || { color: "#475569", ring: "#94a3b8", glyph: "C", name: "Contract" };
  };

  // Connected nodes map for highlighting active traversal paths
  const activeNetwork = useMemo(() => {
    const targetId = hoveredNodeId || selectedNodeId;
    if (!targetId) return { nodes: new Set<string>(), edges: new Set<string>() };

    const activeNodes = new Set<string>([targetId]);
    const activeEdges = new Set<string>();

    edges.forEach((e) => {
      if (e.from === targetId || e.to === targetId) {
        activeNodes.add(e.from);
        activeNodes.add(e.to);
        activeEdges.add(`${e.from}->${e.to}`);
      }
    });

    return { nodes: activeNodes, edges: activeEdges };
  }, [hoveredNodeId, selectedNodeId, edges]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const width = containerRef.current.clientWidth || 920;
    const height = containerRef.current.clientHeight || 640;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Container for zooming/panning
    const g = svg.append("g").attr("class", "graph-root");
    gRef.current = g.node();

    // Background Column Bands in Columns mode
    if (layoutMode === "columns") {
      const colBands = g.append("g").attr("class", "column-bands");

      const bands = [
        {
          hop: 0,
          label: "HOP 0 · CORE ARCHITECTURE",
          sub: "Primary Execution & Orchestration",
          x: width * 0.04,
          w: width * 0.3,
          color: "#0369a1",
        },
        {
          hop: 1,
          label: "HOP 1 · GOVERNANCE & ADMIN",
          sub: "Timelocks & Multisig Signers",
          x: width * 0.36,
          w: width * 0.28,
          color: "#7e22ce",
        },
        {
          hop: 2,
          label: "HOP 2 · EXTERNAL DEPENDENCIES",
          sub: "Chainlink Oracles & Reserve Assets",
          x: width * 0.66,
          w: width * 0.3,
          color: "#b45309",
        },
      ];

      bands.forEach((b) => {
        const bandG = colBands.append("g").attr("class", `band-hop-${b.hop}`);

        bandG
          .append("rect")
          .attr("x", b.x)
          .attr("y", 15)
          .attr("width", b.w)
          .attr("height", height - 30)
          .attr("rx", 10)
          .attr("fill", "#090d16")
          .attr("fill-opacity", 0.6)
          .attr("stroke", "#171f30")
          .attr("stroke-dasharray", "4 4");

        bandG
          .append("text")
          .attr("x", b.x + 14)
          .attr("y", 38)
          .attr("fill", "#64748b")
          .attr("font-family", "ui-monospace, monospace")
          .attr("font-size", 10)
          .attr("font-weight", "600")
          .attr("letter-spacing", "0.08em")
          .text(b.label);

        bandG
          .append("text")
          .attr("x", b.x + 14)
          .attr("y", 52)
          .attr("fill", "#3e4c66")
          .attr("font-family", "ui-monospace, monospace")
          .attr("font-size", 9)
          .text(b.sub);
      });
    }

    // Define Arrowhead Markers for relationship edges
    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "prov-arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 26)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L8,0L0,4")
      .attr("fill", "#334155");

    defs
      .append("marker")
      .attr("id", "prov-arrow-active")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 26)
      .attr("refY", 0)
      .attr("markerWidth", 7)
      .attr("markerHeight", 7)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L8,0L0,4")
      .attr("fill", "#38bdf8");

    // Prepare simulation nodes with hop-tiered sizing
    const simNodes: SimulationNode[] = nodes.map((n) => {
      const r = n.hop === 0 ? 28 : n.hop === 1 ? 24 : 20;

      let initialX = width * 0.5;
      let initialY = height * 0.5;

      if (layoutMode === "columns") {
        initialX = n.hop === 0 ? width * 0.19 : n.hop === 1 ? width * 0.5 : width * 0.81;
        initialY = height * 0.2 + Math.random() * (height * 0.6);
      } else {
        const angle = Math.random() * 2 * Math.PI;
        const dist = n.hop === 0 ? 70 : n.hop === 1 ? 170 : 270;
        initialX = width / 2 + Math.cos(angle) * dist;
        initialY = height / 2 + Math.sin(angle) * dist;
      }

      return {
        ...n,
        r,
        x: initialX,
        y: initialY,
      };
    });

    // Prepare simulation links
    const nodeMap = new Map(simNodes.map((d) => [d.id, d]));
    const simLinks: SimulationLink[] = edges
      .filter((e) => nodeMap.has(e.from) && nodeMap.has(e.to))
      .map((e) => ({
        source: nodeMap.get(e.from)!,
        target: nodeMap.get(e.to)!,
        label: e.label,
        type: e.type,
      }));

    // Setup Force Simulation
    const simulation = d3
      .forceSimulation<SimulationNode>(simNodes)
      .force(
        "link",
        d3
          .forceLink<SimulationNode, SimulationLink>(simLinks)
          .id((d) => d.id)
          .distance((d) => {
            const srcHop = (d.source as SimulationNode).hop;
            const tgtHop = (d.target as SimulationNode).hop;
            return srcHop === tgtHop ? 100 : 140;
          })
          .strength(0.55)
      )
      .force("charge", d3.forceManyBody().strength(-360).distanceMax(550))
      .force("collide", d3.forceCollide().radius((d: any) => d.r + 32).iterations(3))
      .alphaDecay(0.028);

    if (layoutMode === "columns") {
      simulation
        .force(
          "x",
          d3
            .forceX<SimulationNode>((d) =>
              d.hop === 0 ? width * 0.19 : d.hop === 1 ? width * 0.5 : width * 0.81
            )
            .strength(0.48)
        )
        .force("y", d3.forceY(height / 2).strength(0.26));
    } else {
      simulation
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("r", d3.forceRadial((d: any) => (d.hop === 0 ? 80 : d.hop === 1 ? 180 : 280), width / 2, height / 2).strength(0.8));
    }

    simulationRef.current = simulation;

    // Zoom & Pan Behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.35, 3.0])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom).on("dblclick.zoom", null);

    // Render Edges (Links)
    const linkGroup = g.append("g").attr("class", "links");
    const linkElements = linkGroup
      .selectAll("g")
      .data(simLinks)
      .join("g")
      .attr("class", "link-item");

    // Edge Path
    const linkPaths = linkElements
      .append("line")
      .attr("stroke", "#1c2436")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#prov-arrow)");

    // Edge Relationship Badge
    const linkBadges = linkElements
      .append("g")
      .attr("class", "edge-badge cursor-pointer")
      .style("opacity", 0.85);

    linkBadges
      .append("rect")
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("height", 14)
      .attr("fill", "#090d16")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1);

    const linkTexts = linkBadges
      .append("text")
      .attr("fill", "#64748b")
      .attr("font-family", "ui-monospace, monospace")
      .attr("font-size", 9)
      .attr("text-anchor", "middle")
      .attr("dy", 10.5)
      .text((d) => d.type.toUpperCase().replace(/_/g, " "));

    // Size the badge rect according to text width
    linkTexts.each(function () {
      const bbox = (this as SVGTextElement).getBBox();
      const parent = d3.select((this as SVGTextElement).parentNode as SVGGElement);
      parent
        .select("rect")
        .attr("width", bbox.width + 10)
        .attr("x", -bbox.width / 2 - 5)
        .attr("y", 0);
    });

    // Render Nodes Group
    const nodeGroup = g.append("g").attr("class", "nodes");
    const nodeElements = nodeGroup
      .selectAll<SVGGElement, SimulationNode>("g")
      .data(simNodes)
      .join("g")
      .attr("class", "node-item cursor-grab active:cursor-grabbing")
      .call(
        d3
          .drag<any, SimulationNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node Outer Glow Ring
    nodeElements
      .append("circle")
      .attr("r", (d) => d.r + 4)
      .attr("fill", "transparent")
      .attr("stroke", (d) => getNodeStyle(d.category, d.adminType).ring)
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.4)
      .attr("class", "halo-ring");

    // Node Main Body Circle
    nodeElements
      .append("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d) => getNodeStyle(d.category, d.adminType).color)
      .attr("stroke", "#080b12")
      .attr("stroke-width", 2.5)
      .attr("class", "node-circle shadow-lg transition-transform hover:scale-105");

    // Inner Glyph Icon
    nodeElements
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("fill", "#ffffff")
      .attr("font-family", "ui-sans-serif, system-ui, sans-serif")
      .attr("font-weight", "700")
      .attr("font-size", (d) => (d.hop === 0 ? 13 : d.hop === 1 ? 11 : 10))
      .attr("pointer-events", "none")
      .text((d) => getNodeStyle(d.category, d.adminType).glyph);

    // Node Title Label (Below Circle)
    nodeElements
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", (d) => d.r + 14)
      .attr("fill", "#e2e8f0")
      .attr("font-family", "ui-sans-serif, system-ui, sans-serif")
      .attr("font-size", 10.5)
      .attr("font-weight", 500)
      .attr("pointer-events", "none")
      .text((d) => d.label);

    // Node Risk Chip Label
    nodeElements
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", (d) => d.r + 26)
      .attr("fill", (d) => (d.riskScore === 0 ? "#34d399" : d.riskScore <= 10 ? "#6ee7b7" : "#fbbf24"))
      .attr("font-family", "ui-monospace, monospace")
      .attr("font-size", 9)
      .attr("font-weight", 600)
      .attr("pointer-events", "none")
      .text((d) => (d.riskScore === 0 ? "Safe (0)" : `Risk ${d.riskScore}`));

    // Interactivity: Click & Hover handlers
    nodeElements
      .on("click", (event, d) => {
        event.stopPropagation();
        onSelectNode(d);
      })
      .on("mouseenter", (event, d) => {
        setHoveredNodeId(d.id);
      })
      .on("mouseleave", () => {
        setHoveredNodeId(null);
      });

    // Click background to deselect
    svg.on("click", () => {
      setHoveredNodeId(null);
    });

    // Simulation Tick Update
    simulation.on("tick", () => {
      linkPaths
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkBadges.attr("transform", (d: any) => {
        const midX = (d.source.x + d.target.x) / 2;
        const midY = (d.source.y + d.target.y) / 2;
        return `translate(${midX}, ${midY})`;
      });

      nodeElements.attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, layoutMode, onSelectNode]);

  // Update visual highlighting when selection/hover changes
  useEffect(() => {
    if (!gRef.current) return;
    const g = d3.select(gRef.current);

    const hasSelection = hoveredNodeId || selectedNodeId;

    // Update Nodes appearance
    g.selectAll<SVGGElement, SimulationNode>(".node-item").each(function (d) {
      const isSelected = selectedNodeId === d.id;
      const isHovered = hoveredNodeId === d.id;
      const isConnected = activeNetwork.nodes.has(d.id);

      const el = d3.select(this);

      if (!hasSelection) {
        el.style("opacity", 1);
        el.select(".halo-ring")
          .attr("stroke-width", 1.5)
          .attr("stroke-opacity", 0.4);
      } else if (isSelected || isHovered) {
        el.style("opacity", 1);
        el.select(".halo-ring")
          .attr("stroke-width", 4)
          .attr("stroke-opacity", 0.95);
      } else if (isConnected) {
        el.style("opacity", 0.9);
        el.select(".halo-ring")
          .attr("stroke-width", 2.5)
          .attr("stroke-opacity", 0.7);
      } else {
        el.style("opacity", 0.22);
        el.select(".halo-ring").attr("stroke-opacity", 0.1);
      }
    });

    // Update Edges appearance
    g.selectAll<SVGGElement, SimulationLink>(".link-item").each(function (d: any) {
      const edgeKey = `${d.source.id}->${d.target.id}`;
      const isActive = activeNetwork.edges.has(edgeKey);
      const el = d3.select(this);

      if (!hasSelection) {
        el.select("line")
          .attr("stroke", "#1c2436")
          .attr("stroke-width", 1.5)
          .attr("marker-end", "url(#prov-arrow)");
        el.select(".edge-badge").style("opacity", 0.75);
      } else if (isActive) {
        el.select("line")
          .attr("stroke", "#38bdf8")
          .attr("stroke-width", 2.5)
          .attr("marker-end", "url(#prov-arrow-active)");
        el.select(".edge-badge")
          .style("opacity", 1)
          .select("rect")
          .attr("stroke", "#38bdf8");
      } else {
        el.select("line")
          .attr("stroke", "#111722")
          .attr("stroke-width", 1)
          .attr("marker-end", "url(#prov-arrow)");
        el.select(".edge-badge").style("opacity", 0.15);
      }
    });
  }, [hoveredNodeId, selectedNodeId, activeNetwork]);

  // Controls Handlers
  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleReset = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(350).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  const toggleSimulation = () => {
    if (!simulationRef.current) return;
    if (isPaused) {
      simulationRef.current.alpha(0.3).restart();
      setIsPaused(false);
    } else {
      simulationRef.current.stop();
      setIsPaused(true);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[640px] bg-[#07090e] border border-[#161a25] rounded-xl overflow-hidden select-none bg-grid"
    >
      {/* Top Floating Status Toolbar */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e121a]/90 backdrop-blur border border-[#1f2637] text-xs font-mono text-[#8b95ad] shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Asset Provenance Graph</span>
          <span className="text-[#3b445a]">·</span>
          <span className="text-emerald-400">{nodes.length} Verified Contracts</span>
          <span className="text-[#3b445a]">·</span>
          <span className="text-blue-400">{edges.length} Relationships</span>
        </div>

        {/* Layout Toggle */}
        <div className="flex items-center bg-[#0e121a]/90 backdrop-blur border border-[#1f2637] p-0.5 rounded-lg">
          <button
            onClick={() => setLayoutMode("columns")}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              layoutMode === "columns"
                ? "bg-[#182030] text-blue-400 font-semibold"
                : "text-[#64748b] hover:text-white"
            }`}
            title="Organize by Provenance Hop Columns"
          >
            <Columns className="w-3 h-3" />
            <span>Hop Columns</span>
          </button>
          <button
            onClick={() => setLayoutMode("radial")}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              layoutMode === "radial"
                ? "bg-[#182030] text-blue-400 font-semibold"
                : "text-[#64748b] hover:text-white"
            }`}
            title="Concentric Radial Cluster"
          >
            <Disc className="w-3 h-3" />
            <span>Concentric</span>
          </button>
        </div>
      </div>

      {/* Category Legend Bar (Top Right) */}
      <div className="absolute top-3 right-4 z-10 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#0e121a]/90 backdrop-blur border border-[#1f2637] text-[11px] font-mono text-[#94a3b8] shadow-lg">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] ring-1 ring-[#38bdf8]/60"></span>
          Proxy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] ring-1 ring-[#34d399]/60"></span>
          Implementation
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] ring-1 ring-[#fbbf24]/60"></span>
          Oracle
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#9333ea] ring-1 ring-[#c084fc]/60"></span>
          Safe Multisig
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5] ring-1 ring-[#818cf8]/60"></span>
          Timelock
        </span>
      </div>

      {/* Zoom / Physics Controls (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-[#0e121a]/90 backdrop-blur border border-[#1f2637] p-1 rounded-lg shadow-lg">
        <button
          onClick={() => handleZoom(1.25)}
          className="p-1.5 text-[#8b95ad] hover:text-white rounded hover:bg-[#1a202e] transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(0.8)}
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
        <div className="w-px h-4 bg-[#21283a] mx-0.5"></div>
        <button
          onClick={toggleSimulation}
          className="p-1.5 text-[#8b95ad] hover:text-white rounded hover:bg-[#1a202e] transition-colors"
          title={isPaused ? "Resume Physics" : "Pause Physics"}
        >
          {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
        </button>
      </div>

      {/* Hint Badge (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none text-[10px] font-mono text-[#525d78]">
        Drag nodes · Click to inspect on Arkiv & Swarm
      </div>

      {/* SVG Rendering Surface */}
      <svg ref={svgRef} className="w-full h-full cursor-default" />
    </div>
  );
}

"use client";

import React from "react";
import { FlaskConical, X, RotateCcw, MousePointerClick } from "lucide-react";
import { GraphNode } from "@/lib/graph-data";
import { CompositeModel, nodeLeverage } from "@/lib/risk-model";

interface DemoModePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  /** Node picked on the graph (with demo overrides already applied). */
  selectedNode: GraphNode | null;
  baselineNodeScore: number | null;
  /** All nodes with demo overrides applied (used for node leverage). */
  nodes: GraphNode[];
  baseline: CompositeModel;
  live: CompositeModel;
  overrideCount: number;
  onChangeScore: (nodeId: string, score: number) => void;
  onResetNode: (nodeId: string) => void;
  onResetAll: () => void;
}

const TIER_COLOR: Record<string, string> = {
  LOW: "text-[#98ff38]",
  MEDIUM: "text-[#eab308]",
  HIGH: "text-[#f59e0b]",
  CRITICAL: "text-[#ef4444]",
};

/**
 * Demo-only what-if tool. It re-runs the real hop-decay model locally
 * (hop0 avg × 1.0 + hop1 avg × 0.5 + hop2 avg × 0.25). Nothing is written to
 * storage, Arkiv, Swarm, or sent to CRE; state is lost on reload / when closed.
 */
export function DemoModePanel({
  isOpen,
  onToggle,
  selectedNode,
  baselineNodeScore,
  nodes,
  baseline,
  live,
  overrideCount,
  onChangeScore,
  onResetNode,
  onResetAll,
}: DemoModePanelProps) {
  const delta = Number((live.composite - baseline.composite).toFixed(2));
  const leverage = selectedNode ? nodeLeverage(selectedNode, nodes) : 0;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 select-none">
      {isOpen && (
        <div className="w-80 rounded-[12px] border border-[#474747] bg-[#080808]/95 backdrop-blur-md shadow-2xl p-4 animate-fadeIn max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-[#f59e0b]" />
              <span className="text-[12px] uppercase tracking-wider text-[#f3f3f3]">
                Demo Mode
              </span>
              <span className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30">
                Not saved
              </span>
            </div>
            <button
              onClick={onToggle}
              className="text-[#9c9c9c] hover:text-[#f3f3f3] cursor-pointer"
              aria-label="Close demo mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Live Aave score */}
          <div className="rounded-[8px] border border-[#212121] bg-[#101010] p-3 mb-3">
            <div className="text-[10px] uppercase tracking-wider text-[#6f6759] mb-1">
              Aave V3 Composite Risk
            </div>
            <div className="flex items-end justify-between">
              <span className={`text-[32px] leading-none font-mono ${TIER_COLOR[live.tier]}`}>
                {live.composite.toFixed(2)}
              </span>
              <div className="text-right text-[11px] font-mono text-[#9c9c9c]">
                <div>
                  baseline {baseline.composite.toFixed(2)}
                  {delta !== 0 && (
                    <span className={delta > 0 ? "text-[#f59e0b]" : "text-[#98ff38]"}>
                      {" "}
                      ({delta > 0 ? "+" : ""}
                      {delta})
                    </span>
                  )}
                </div>
                <div className={`uppercase tracking-wider ${TIER_COLOR[live.tier]}`}>
                  {live.tier}
                </div>
              </div>
            </div>

            {/* Real calculation */}
            <div className="mt-3 pt-2 border-t border-[#212121] space-y-1 text-[11px] font-mono text-[#9c9c9c]">
              {live.hops.map((h) => (
                <div key={h.hop} className="flex justify-between">
                  <span>
                    hop {h.hop} avg {h.avg.toFixed(2)} × {h.weight.toFixed(2)}
                  </span>
                  <span className="text-[#f3f3f3]">{h.contribution.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1 border-t border-[#212121] text-[#f3f3f3]">
                <span>sum</span>
                <span>{live.composite.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-[#6f6759] pt-1">
                LOW ≤25 · MEDIUM ≤50 · HIGH ≤75 · CRITICAL &gt;75
              </div>
            </div>
          </div>

          {/* Node slider */}
          {selectedNode ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] text-[#f3f3f3] truncate pr-2">
                  {selectedNode.label}
                </span>
                <span className="text-[11px] font-mono text-[#9c9c9c] shrink-0">
                  hop {selectedNode.hop}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#9c9c9c] mb-2">
                <span>
                  node risk: <span className="text-[#f3f3f3]">{selectedNode.riskScore}</span>
                </span>
                <span>base {baselineNodeScore}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={selectedNode.riskScore}
                onChange={(e) => onChangeScore(selectedNode.id, Number(e.target.value))}
                className="w-full accent-[#98ff38] cursor-pointer"
                aria-label={`Risk score for ${selectedNode.label}`}
              />
              <div className="flex justify-between text-[10px] font-mono text-[#6f6759]">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
              <div className="mt-2 text-[10px] font-mono text-[#6f6759]">
                +1 node risk = +{leverage.toFixed(3)} composite (hop weight{" "}
                {(leverage * nodes.filter((n) => n.hop === selectedNode.hop).length).toFixed(2)}
                {" "}÷ {nodes.filter((n) => n.hop === selectedNode.hop).length} nodes in hop)
              </div>
              <button
                onClick={() => onResetNode(selectedNode.id)}
                className="mt-2 text-[11px] uppercase tracking-wider text-[#9c9c9c] hover:text-[#f3f3f3] cursor-pointer"
              >
                Reset this node
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[12px] text-[#9c9c9c] py-2">
              <MousePointerClick className="w-4 h-4 text-[#6f6759] shrink-0" />
              Click any node on the graph to adjust its risk score.
            </div>
          )}

          {overrideCount > 0 && (
            <button
              onClick={onResetAll}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-[6px] border border-[#212121] hover:border-[#474747] text-[11px] uppercase tracking-wider text-[#9c9c9c] hover:text-[#f3f3f3] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset all ({overrideCount})
            </button>
          )}
        </div>
      )}

      <button
        onClick={onToggle}
        title="Demo mode: what-if risk simulator"
        aria-label="Toggle demo mode"
        className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-2xl transition-colors cursor-pointer ${
          isOpen
            ? "bg-[#f59e0b] border-[#f59e0b] text-[#080808]"
            : "bg-[#080808] border-[#474747] text-[#f59e0b] hover:border-[#f59e0b]"
        }`}
      >
        <FlaskConical className="w-5 h-5" />
      </button>
    </div>
  );
}

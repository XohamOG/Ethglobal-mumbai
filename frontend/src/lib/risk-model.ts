import type { GraphNode } from "@/lib/graph-data";

/**
 * Same propagation model as graph-service (scorer.ts calculateCompositeRisk):
 *   composite = hop0Avg × 1.00 + hop1Avg × 0.50 + hop2Avg × 0.25   (capped to [0, 100])
 * Tiers: LOW ≤ 25 · MEDIUM ≤ 50 · HIGH ≤ 75 · CRITICAL > 75
 */
export const HOP_WEIGHTS: Record<number, number> = { 0: 1.0, 1: 0.5, 2: 0.25 };

export type RiskTier = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface HopBreakdown {
  hop: number;
  count: number;
  avg: number;
  weight: number;
  contribution: number;
}

export interface CompositeModel {
  hops: HopBreakdown[];
  composite: number;
  tier: RiskTier;
}

export function tierFor(score: number): RiskTier {
  if (score <= 25) return "LOW";
  if (score <= 50) return "MEDIUM";
  if (score <= 75) return "HIGH";
  return "CRITICAL";
}

export function computeComposite(nodes: GraphNode[]): CompositeModel {
  const hops = [0, 1, 2].map((hop) => {
    const members = nodes.filter((n) => n.hop === hop);
    const avg = members.length
      ? members.reduce((a, n) => a + n.riskScore, 0) / members.length
      : 0;
    const weight = HOP_WEIGHTS[hop];
    return { hop, count: members.length, avg, weight, contribution: avg * weight };
  });
  const raw = hops.reduce((a, h) => a + h.contribution, 0);
  const composite = Number(Math.min(100, Math.max(0, raw)).toFixed(2));
  return { hops, composite, tier: tierFor(composite) };
}

/** How many composite points one point of this node's risk is worth. */
export function nodeLeverage(node: GraphNode, nodes: GraphNode[]): number {
  const inHop = nodes.filter((n) => n.hop === node.hop).length || 1;
  return (HOP_WEIGHTS[node.hop] ?? 0) / inHop;
}

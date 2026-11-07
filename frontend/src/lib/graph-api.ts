"use client";

import { useCallback, useEffect, useState } from "react";
import type { GraphEdge, GraphNode } from "@/lib/graph-data";

export const GRAPH_SERVICE_URL = (
  process.env.NEXT_PUBLIC_GRAPH_SERVICE_URL || "http://localhost:4000"
).replace(/\/$/, "");

/** Response of graph-service GET /graph/:protocolId */
export interface GraphSnapshot {
  snapshotId: string;
  protocolId: string;
  compositeScore: number;
  riskTier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evaluatedAtBlock: number;
  fingerprint: string;
  swarmGraphRef: string;
  swarmEvidenceRef: string;
  nodeCount: number;
  hopScores: { hop0Avg: number; hop1Avg: number; hop2Avg: number };
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function fetchGraphSnapshot(
  protocolId: string,
  signal?: AbortSignal,
  refresh = false
): Promise<GraphSnapshot> {
  const res = await fetch(
    `${GRAPH_SERVICE_URL}/graph/${encodeURIComponent(protocolId)}${refresh ? "?refresh=1" : ""}`,
    { signal, cache: "no-store" }
  );
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.error || "";
    } catch {}
    throw new Error(detail || `graph-service responded ${res.status}`);
  }
  const data = (await res.json()) as GraphSnapshot;
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new Error("graph-service returned an unexpected payload");
  }
  return data;
}

// Per-tab memory cache: navigating graph <-> audit shows data instantly, then revalidates.
const snapshotMemo = new Map<string, GraphSnapshot>();

export function useGraphSnapshot(protocolId: string) {
  const [data, setData] = useState<GraphSnapshot | null>(() => snapshotMemo.get(protocolId) ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => !snapshotMemo.has(protocolId));
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchGraphSnapshot(protocolId, ctrl.signal, nonce > 0)
      .then((d) => {
        snapshotMemo.set(protocolId, d);
        setData(d);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        const msg = e instanceof Error ? e.message : String(e);
        setError(
          msg === "Failed to fetch"
            ? `Cannot reach graph-service at ${GRAPH_SERVICE_URL}`
            : msg
        );
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [protocolId, nonce]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setNonce((n) => n + 1);
  }, []);
  return { data, error, loading, reload };
}

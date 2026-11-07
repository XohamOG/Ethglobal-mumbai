"use client";

import React, { useCallback, useEffect, useState } from "react";
import { GRAPH_SERVICE_URL } from "@/lib/graph-api";
import { tierFor } from "@/lib/risk-model";
import { Zap, CheckCircle2, RefreshCw, Terminal, X, AlertTriangle } from "lucide-react";

interface DriftResponse {
  protocolId: string;
  liveFingerprint: string;
  storedFingerprint: string | null;
  snapshotId: string | null;
  evaluatedAtBlock: number | null;
  compositeScore: number | null;
  readsChecked: number;
  drift: boolean;
}

interface CreTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocolId: string;
  /** Called after a successful rebuild with the new composite score. */
  onComplete?: (updatedScore: number, isRebuilt: boolean) => void;
}

/**
 * Real drift check: asks graph-service to recompute the protocol fingerprint from live
 * mainnet state and compare it with the one stored in Arkiv (the same check the Chainlink
 * CRE workflow performs on a schedule). Rebuild calls POST /rebuild.
 * Nothing here is scripted or hardcoded.
 */
export function CreTriggerModal({ isOpen, onClose, protocolId, onComplete }: CreTriggerModalProps) {
  const [loading, setLoading] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [drift, setDrift] = useState<DriftResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rebuilt, setRebuilt] = useState<{ score: number; tier: string } | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRebuilt(null);
    try {
      const res = await fetch(`${GRAPH_SERVICE_URL}/drift/${encodeURIComponent(protocolId)}`, {
        cache: "no-store",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || `graph-service responded ${res.status}`);
      setDrift(body as DriftResponse);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg === "Failed to fetch" ? `Cannot reach graph-service at ${GRAPH_SERVICE_URL}` : msg);
    } finally {
      setLoading(false);
    }
  }, [protocolId]);

  useEffect(() => {
    if (isOpen) check();
  }, [isOpen, check]);

  const rebuild = async () => {
    setRebuilding(true);
    setError(null);
    try {
      const res = await fetch(`${GRAPH_SERVICE_URL}/rebuild`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocolId, triggeredBy: "manual" }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error("Rebuild is protected by CRE_API_KEY: only the Chainlink CRE workflow may trigger it.");
      }
      if (!res.ok || body.success === false) throw new Error(body?.error || `rebuild failed (${res.status})`);
      const score = Number(body.compositeScore);
      setRebuilt({ score, tier: String(body.riskTier ?? tierFor(score)) });
      onComplete?.(score, true);
      check();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRebuilding(false);
    }
  };

  if (!isOpen) return null;

  const short = (h: string | null) => (h ? `${h.slice(0, 10)}…${h.slice(-8)}` : "none");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-[12px] border border-[#474747] bg-[#080808] p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[14px] text-[#f3f3f3]">
            <Zap className="w-4 h-4 text-[#98ff38]" />
            Fingerprint Drift Check
          </div>
          <button onClick={onClose} className="text-[#9c9c9c] hover:text-[#f3f3f3] cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[12px] text-[#9c9c9c] mb-4 leading-relaxed">
          Recomputes the protocol fingerprint from live Ethereum state (finalized block) and compares it with the
          snapshot stored in Arkiv. The Chainlink CRE workflow runs this same check on a schedule.
        </p>

        <div className="rounded-[8px] border border-[#212121] bg-[#101010] p-3 font-mono text-[11px] space-y-2 min-h-[120px]">
          {loading && (
            <div className="flex items-center gap-2 text-[#9c9c9c]">
              <Terminal className="w-3.5 h-3.5" /> Reading on-chain pointers and Arkiv snapshot…
            </div>
          )}
          {!loading && drift && (
            <>
              <div className="flex justify-between text-[#9c9c9c]">
                <span>on-chain reads</span>
                <span className="text-[#f3f3f3]">{drift.readsChecked}</span>
              </div>
              <div className="flex justify-between text-[#9c9c9c]">
                <span>live fingerprint</span>
                <span className="text-[#f3f3f3]" title={drift.liveFingerprint}>{short(drift.liveFingerprint)}</span>
              </div>
              <div className="flex justify-between text-[#9c9c9c]">
                <span>stored (Arkiv)</span>
                <span className="text-[#f3f3f3]" title={drift.storedFingerprint ?? ""}>{short(drift.storedFingerprint)}</span>
              </div>
              <div className="flex justify-between text-[#9c9c9c]">
                <span>stored snapshot</span>
                <span className="text-[#f3f3f3]">
                  {drift.snapshotId ?? "none"}
                  {drift.compositeScore !== null && ` · score ${drift.compositeScore.toFixed(2)}`}
                </span>
              </div>
              <div
                className={`flex items-center gap-2 pt-2 border-t border-[#212121] ${
                  drift.drift ? "text-[#eab308]" : "text-[#98ff38]"
                }`}
              >
                {drift.drift ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {drift.drift
                  ? drift.storedFingerprint
                    ? "DRIFT: protocol state changed since the stored snapshot"
                    : "No stored snapshot yet"
                  : "NO DRIFT: stored snapshot is still accurate, nothing to rebuild"}
              </div>
            </>
          )}
          {rebuilt && (
            <div className="text-[#98ff38]">
              Rebuilt: score {rebuilt.score.toFixed(2)} ({rebuilt.tier})
            </div>
          )}
          {error && <div className="text-[#ef4444] break-words">{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={check}
            disabled={loading || rebuilding}
            className="px-3 py-1.5 rounded-[6px] border border-[#212121] hover:border-[#474747] text-[11px] uppercase tracking-wider text-[#9c9c9c] hover:text-[#f3f3f3] cursor-pointer disabled:opacity-50"
          >
            Re-check
          </button>
          <button
            onClick={rebuild}
            disabled={loading || rebuilding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#474747] hover:border-[#f3f3f3] text-[11px] uppercase tracking-wider text-[#f3f3f3] cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${rebuilding ? "animate-spin" : ""}`} />
            {rebuilding ? "Rebuilding…" : drift?.drift ? "Rebuild graph" : "Force rebuild"}
          </button>
        </div>
      </div>
    </div>
  );
}

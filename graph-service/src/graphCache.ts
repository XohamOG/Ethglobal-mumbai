import { ArkivStorageClient } from "../../storage/arkiv/client.js";
import { loadGraphFromArkiv, ArkivGraphPayload } from "./arkivGraph.js";

interface Entry {
  data: ArkivGraphPayload;
  at: number;
}

export interface CachedGraph {
  data: ArkivGraphPayload | null;
  /** true when served from memory without waiting for Arkiv */
  cached: boolean;
  ageMs: number;
}

/**
 * In-memory cache of the graph entities stored in Arkiv.
 *  - preload(): warm at startup so the first request is instant
 *  - get(): fresh -> memory; stale -> serve stale immediately + refresh in background
 *  - refresh(): re-read Arkiv (deduplicated); call it after /rebuild writes new entities
 * Nothing is persisted: Arkiv stays the source of truth.
 */
export class GraphCache {
  private entries = new Map<string, Entry>();
  private inflight = new Map<string, Promise<ArkivGraphPayload | null>>();

  constructor(
    private arkiv: ArkivStorageClient,
    private ttlMs: number = Number(process.env.GRAPH_CACHE_TTL_MS) || 5 * 60 * 1000
  ) {}

  /** Re-read from Arkiv and replace the cached entry (concurrent calls share one query). */
  refresh(protocolId: string): Promise<ArkivGraphPayload | null> {
    const running = this.inflight.get(protocolId);
    if (running) return running;

    const p = loadGraphFromArkiv(this.arkiv, protocolId)
      .then((data) => {
        if (data) this.entries.set(protocolId, { data, at: Date.now() });
        return data;
      })
      .finally(() => this.inflight.delete(protocolId));
    this.inflight.set(protocolId, p);
    return p;
  }

  async get(protocolId: string, force = false): Promise<CachedGraph> {
    const entry = this.entries.get(protocolId);
    if (entry && !force) {
      const ageMs = Date.now() - entry.at;
      if (ageMs > this.ttlMs) {
        // stale-while-revalidate
        this.refresh(protocolId).catch((e) =>
          console.warn(`[Cache] background refresh failed for ${protocolId}: ${e.message}`)
        );
      }
      return { data: entry.data, cached: true, ageMs };
    }
    const data = await this.refresh(protocolId);
    return { data, cached: false, ageMs: 0 };
  }

  async preload(protocolIds: string[]): Promise<void> {
    for (const id of protocolIds) {
      try {
        const t0 = Date.now();
        const data = await this.refresh(id);
        console.log(
          data
            ? `[Cache] Preloaded ${id}: ${data.nodeCount} nodes, snapshot ${data.snapshotId} (${Date.now() - t0}ms)`
            : `[Cache] No Arkiv snapshot for ${id} yet`
        );
      } catch (e: any) {
        console.warn(`[Cache] Preload failed for ${id}: ${e.message}`);
      }
    }
  }
}

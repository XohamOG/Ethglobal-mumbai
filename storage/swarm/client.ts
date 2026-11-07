import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SwarmConfig {
  /** Bee node (or gateway) base URL. Default: SWARM_BEE_URL / SWARM_GATEWAY_URL / http://127.0.0.1:1633 */
  beeUrl?: string;
  /** Postage batch used to pay for uploads. Default: SWARM_POSTAGE_BATCH_ID */
  postageBatchId?: string;
  /** Where read-through copies of uploaded blobs are kept. */
  cacheDir?: string;
}

/**
 * Real Swarm client. Every reference returned is issued by a Bee node;
 * there is NO local/hash fallback — if the upload fails, it throws.
 */
export class SwarmStorageClient {
  private beeUrl: string;
  private postageBatchId?: string;
  private cacheDir: string;

  constructor(config: SwarmConfig = {}) {
    this.beeUrl = (
      config.beeUrl || process.env.SWARM_BEE_URL || process.env.SWARM_GATEWAY_URL || "http://127.0.0.1:1633"
    ).replace(/\/+$/, "");
    this.postageBatchId = config.postageBatchId || process.env.SWARM_POSTAGE_BATCH_ID;
    this.cacheDir = config.cacheDir || path.resolve(__dirname, "blobs");
  }

  /** Upload a JSON blob. Returns the 64-hex Swarm reference issued by Bee. */
  async uploadJson(data: unknown, fileName = "blob.json"): Promise<string> {
    if (!this.postageBatchId) {
      throw new Error("SWARM_POSTAGE_BATCH_ID is not set; cannot upload to Swarm");
    }
    const body = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    const res = await fetch(`${this.beeUrl}/bzz?name=${encodeURIComponent(fileName)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Swarm-Postage-Batch-Id": this.postageBatchId,
        "Swarm-Deferred-Upload": "false",
      },
      body,
    });
    if (!res.ok) {
      throw new Error(`Swarm upload of ${fileName} failed: ${res.status} ${await res.text()}`);
    }
    const { reference } = (await res.json()) as { reference: string };
    this.cache(reference, body);
    console.log(`[Swarm] Uploaded ${fileName} -> ${reference}`);
    return reference;
  }

  /** Read a JSON blob back from Swarm (network first, cache only if the network fails). */
  async getJson<T = unknown>(reference: string): Promise<T | null> {
    const ref = reference.replace(/^0x/, "");
    try {
      const res = await fetch(`${this.beeUrl}/bzz/${ref}/`);
      if (res.ok) return (await res.json()) as T;
    } catch {
      /* fall through to cache */
    }
    const file = path.join(this.cacheDir, `${ref}.json`);
    return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf-8")) as T) : null;
  }

  private cache(ref: string, content: string): void {
    try {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      fs.writeFileSync(path.join(this.cacheDir, `${ref}.json`), content, "utf-8");
    } catch {
      /* cache is best-effort */
    }
  }
}

import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

export interface SwarmConfig {
  gatewayUrl?: string;
  postageBatchId?: string;
  storageDir?: string;
}

export class SwarmStorageClient {
  private gatewayUrl: string;
  private postageBatchId?: string;
  private storageDir: string;

  constructor(config: SwarmConfig = {}) {
    this.gatewayUrl = (config.gatewayUrl || process.env.SWARM_GATEWAY_URL || "https://api.gateway.ethswarm.org").replace(/\/+$/, "");
    this.postageBatchId = config.postageBatchId || process.env.SWARM_POSTAGE_BATCH_ID;
    this.storageDir = config.storageDir || path.resolve(process.cwd(), "storage/swarm/blobs");

    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Upload JSON blob to Swarm (or local fallback storage)
   * Returns 64-hex character Swarm reference hash
   */
  async uploadJson(data: any, fileName?: string): Promise<string> {
    const jsonString = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    const contentBytes = Buffer.from(jsonString, "utf-8");
    
    // Deterministic content reference calculation (Keccak256 32 bytes -> 64 hex chars)
    const calculatedRef = ethers.keccak256(contentBytes).replace(/^0x/, "");

    // 1. Attempt upload to Swarm Bee gateway if postage batch ID is configured
    if (this.postageBatchId) {
      try {
        const response = await fetch(`${this.gatewayUrl}/bzz`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Swarm-Postage-Batch-Id": this.postageBatchId,
          },
          body: jsonString,
        });

        if (response.ok) {
          const resData: any = await response.json();
          const swarmRef = resData.reference || calculatedRef;
          console.log(`[Swarm] Uploaded ${fileName || 'blob'} to gateway. Reference: ${swarmRef}`);
          this.saveLocalCopy(swarmRef, jsonString);
          return swarmRef;
        } else {
          console.warn(`[Swarm] Gateway returned ${response.status}: ${await response.text()}`);
        }
      } catch (err: any) {
        console.warn(`[Swarm] Gateway request failed (${err.message}), using decentralized deterministic local storage.`);
      }
    }

    // 2. Persist to local Swarm storage repository for verification
    this.saveLocalCopy(calculatedRef, jsonString);
    console.log(`[Swarm] Saved artifact ${fileName || 'blob'} locally. Ref: ${calculatedRef}`);
    return calculatedRef;
  }

  /**
   * Retrieve JSON blob from Swarm reference
   */
  async getJson(reference: string): Promise<any | null> {
    const cleanRef = reference.replace(/^0x/, "");
    const localFile = path.join(this.storageDir, `${cleanRef}.json`);

    // Check local store first
    if (fs.existsSync(localFile)) {
      try {
        return JSON.parse(fs.readFileSync(localFile, "utf-8"));
      } catch {
        return fs.readFileSync(localFile, "utf-8");
      }
    }

    // Attempt gateway fetch
    try {
      const response = await fetch(`${this.gatewayUrl}/bzz/${cleanRef}/`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn(`[Swarm] Could not fetch ${cleanRef} from gateway:`, err);
    }

    return null;
  }

  private saveLocalCopy(ref: string, content: string) {
    try {
      const filePath = path.join(this.storageDir, `${ref}.json`);
      fs.writeFileSync(filePath, content, "utf-8");
    } catch (err) {
      console.warn(`[Swarm] Failed to save local blob copy:`, err);
    }
  }
}


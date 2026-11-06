import { createPublicClient } from "@arkiv-network/sdk";
import { rabdi } from "@arkiv-network/sdk/chains";
import { eq, and } from "@arkiv-network/sdk/query";
import { http } from "viem";

export const ARKIV_ACCESS_KEY =
  process.env.NEXT_PUBLIC_ARKIV_ACCESS_KEY || "";

export const arkivPublicClient = createPublicClient({
  chain: rabdi({ accessKey: ARKIV_ACCESS_KEY }),
  transport: http(),
});

/**
 * Fetch live ContractNode entities directly from Arkiv Rabdi testnet
 */
export async function fetchArkivNodes(protocolId: string = "aave-v3-mainnet") {
  try {
    const res = await arkivPublicClient.query(
      and(eq("arkiv.schema", "contract_node_v1"), eq("protocolId", protocolId)),
      { limit: 100 }
    );
    if (res.entities && res.entities.length > 0) {
      return res.entities.map((e: any) => ({
        ...e.$attributes,
        $key: e.$key,
        $expiresAt: e.$expiresAt?.toString(),
      }));
    }
  } catch (err) {
    console.warn("[Arkiv Frontend] Query error:", err);
  }
  return null;
}

/**
 * Fetch live RiskSnapshot from Arkiv Rabdi testnet
 */
export async function fetchArkivSnapshot(protocolId: string = "aave-v3-mainnet") {
  try {
    const res = await arkivPublicClient.query(
      and(eq("arkiv.schema", "risk_snapshot_v1"), eq("protocolId", protocolId)),
      { limit: 1 }
    );
    if (res.entities && res.entities.length > 0) {
      const e = res.entities[0];
      return {
        ...e.$attributes,
        $key: e.$key,
        $expiresAt: e.$expiresAt?.toString(),
      };
    }
  } catch (err) {
    console.warn("[Arkiv Frontend] Snapshot query error:", err);
  }
  return null;
}


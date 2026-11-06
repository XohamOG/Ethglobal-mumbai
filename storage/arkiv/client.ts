import {
  createPublicClient,
  createWalletClient,
  ExpirationTime,
  Entity,
} from "@arkiv-network/sdk";
import { rabdi } from "@arkiv-network/sdk/chains";
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  ProtocolRegistry,
  ContractNode,
  RiskSnapshot,
} from "./schemas.js";

export interface ArkivConfig {
  accessKey?: string;
  privateKey?: `0x${string}`;
  rpcUrl?: string;
}

export class ArkivStorageClient {
  public publicClient: any;
  public walletClient: any;
  public isConnected: boolean = false;
  private localStore: Map<string, any[]> = new Map();

  constructor(config: ArkivConfig = {}) {
    const accessKey = config.accessKey || process.env.ARKIV_ACCESS_KEY || "";
    const privateKey = config.privateKey || (process.env.ARKIV_PRIVATE_KEY as `0x${string}`) || undefined;

    try {
      this.publicClient = createPublicClient({
        chain: rabdi({ accessKey }),
        transport: http(config.rpcUrl),
      });

      if (privateKey) {
        this.walletClient = createWalletClient({
          chain: rabdi({ accessKey }),
          transport: http(config.rpcUrl),
          account: privateKeyToAccount(privateKey),
        });
      }
      this.isConnected = true;
    } catch (err) {
      console.warn("[Arkiv] Public/Wallet client init notice:", err);
    }
  }

  /**
   * Save or update ProtocolRegistry macro entity
   */
  async saveProtocol(protocol: {
    protocolId: string;
    name: string;
    category: string;
    chainId: string;
    version: string;
    sourceRepo: string;
    swarmMetaRef: string;
    createdAt: bigint;
  }): Promise<string> {
    const record = { ...protocol };
    this.storeLocally("protocol_registry_v1", record, "protocolId");

    if (this.walletClient) {
      try {
        const { entityKey } = await this.walletClient.createEntity({
          schema: ProtocolRegistry,
          data: record,
          expiration: ExpirationTime.max(),
        });
        console.log(`[Arkiv] ProtocolRegistry saved on Rabdi. Key: ${entityKey}`);
        return entityKey;
      } catch (err) {
        console.warn(`[Arkiv] Could not write to Rabdi (falling back to memory):`, err);
      }
    }
    return `local-${protocol.protocolId}`;
  }

  /**
   * Save ContractNode micro entities with BTL lifetime (~50,000 blocks)
   */
  async saveContractNodes(nodes: Array<any>): Promise<string[]> {
    const keys: string[] = [];
    for (const node of nodes) {
      this.storeLocally("contract_node_v1", node, "contractAddress");

      if (this.walletClient) {
        try {
          const { entityKey } = await this.walletClient.createEntity({
            schema: ContractNode,
            data: node,
            expiration: ExpirationTime.fromBlocks(50_000),
          });
          keys.push(entityKey);
        } catch (err) {
          keys.push(`local-${node.contractAddress}`);
        }
      } else {
        keys.push(`local-${node.contractAddress}`);
      }
    }
    console.log(`[Arkiv] Saved ${nodes.length} ContractNodes (BTL 50,000 blocks).`);
    return keys;
  }

  /**
   * Save RiskSnapshot evaluation macro entity with BTL (~50,000 blocks)
   */
  async saveRiskSnapshot(snapshot: {
    snapshotId: string;
    protocolId: string;
    compositeScore: string | number;
    riskTier: string;
    evaluatedAt: bigint;
    fingerprint: string;
    swarmGraphRef: string;
    swarmEvidenceRef: string;
    triggeredBy: string;
    hop0AvgScore: string | number;
    hop1AvgScore: string | number;
    hop2AvgScore: string | number;
    nodeCount: bigint;
  }): Promise<string> {
    const record = {
      ...snapshot,
      compositeScore: String(snapshot.compositeScore),
      hop0AvgScore: String(snapshot.hop0AvgScore),
      hop1AvgScore: String(snapshot.hop1AvgScore),
      hop2AvgScore: String(snapshot.hop2AvgScore),
    };
    this.storeLocally("risk_snapshot_v1", record, "snapshotId");

    if (this.walletClient) {
      try {
        const { entityKey } = await this.walletClient.createEntity({
          schema: RiskSnapshot,
          data: record,
          expiration: ExpirationTime.fromBlocks(50_000),
        });
        console.log(`[Arkiv] RiskSnapshot saved on Rabdi. Key: ${entityKey}`);
        return entityKey;
      } catch (err) {
        console.warn(`[Arkiv] Could not write RiskSnapshot to Rabdi:`, err);
      }
    }
    return `local-${snapshot.snapshotId}`;
  }

  /**
   * Query nodes for a given protocol and snapshot
   */
  async getNodesByProtocol(protocolId: string): Promise<any[]> {
    const list = this.localStore.get("contract_node_v1") || [];
    return list.filter((n) => n.protocolId === protocolId);
  }

  /**
   * Query latest RiskSnapshot for a given protocol
   */
  async getLatestSnapshot(protocolId: string): Promise<any | null> {
    const list = this.localStore.get("risk_snapshot_v1") || [];
    const matching = list.filter((s) => s.protocolId === protocolId);
    if (matching.length === 0) return null;
    return matching[matching.length - 1];
  }

  private storeLocally(table: string, item: any, keyField: string) {
    if (!this.localStore.has(table)) {
      this.localStore.set(table, []);
    }
    const arr = this.localStore.get(table)!;
    const existingIndex = arr.findIndex((x) => x[keyField] === item[keyField]);
    if (existingIndex >= 0) {
      arr[existingIndex] = item;
    } else {
      arr.push(item);
    }
  }
}


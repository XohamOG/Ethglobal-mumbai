import {
  createPublicClient,
  createWalletClient,
  ExpirationTime,
  dec,
  u64,
  bytes,
} from "@arkiv-network/sdk";
import { rabdi } from "@arkiv-network/sdk/chains";
import { eq, and } from "@arkiv-network/sdk/query";
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
    const accessKey = config.accessKey || process.env.ARKIV_ACCESS_KEY;
    const privateKey =
      config.privateKey ||
      (process.env.ARKIV_PRIVATE_KEY as `0x${string}`);

    try {
      this.publicClient = createPublicClient({
        chain: rabdi({ accessKey: accessKey || "" }),
        transport: http(config.rpcUrl),
      });

      if (privateKey) {
        this.walletClient = createWalletClient({
          chain: rabdi({ accessKey: accessKey || "" }),
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
   * Save or update ProtocolRegistry macro entity on Arkiv Rabdi DB-Chain
   */
  async saveProtocol(protocol: {
    protocolId: string;
    name: string;
    category: string;
    chainId: string;
    version: string;
    sourceRepo: string;
    swarmMetaRef: string;
    createdAt: bigint | number;
  }): Promise<{ entityKey: string; txHash?: string }> {
    const createdAtNum = Number(protocol.createdAt);
    const values = {
      protocolId: protocol.protocolId,
      name: protocol.name,
      category: protocol.category,
      chainId: protocol.chainId,
      version: protocol.version,
      sourceRepo: protocol.sourceRepo,
      swarmMetaRef: protocol.swarmMetaRef,
      createdAt: u64(createdAtNum),
    };

    this.storeLocally("protocol_registry_v1", { ...protocol, createdAt: createdAtNum }, "protocolId");

    if (this.walletClient) {
      try {
        console.log(`[Arkiv] Broadcasting ProtocolRegistry for ${protocol.name} to Rabdi...`);
        const res = await this.walletClient.createEntity(
          ProtocolRegistry,
          values,
          { expiration: ExpirationTime.max() }
        );
        console.log(`[Arkiv] ProtocolRegistry confirmed on-chain! Tx: ${res.txHash} Key: ${res.entityKey}`);
        return { entityKey: res.entityKey, txHash: res.txHash };
      } catch (err: any) {
        console.warn(`[Arkiv] Error writing ProtocolRegistry on-chain:`, err.message || err);
      }
    }
    return { entityKey: `local-${protocol.protocolId}` };
  }

  /**
   * Save ContractNode micro entities with BTL lifetime (~50,000 blocks)
   */
  async saveContractNodes(nodes: Array<any>): Promise<Array<{ address: string; entityKey: string; txHash?: string }>> {
    const results: Array<{ address: string; entityKey: string; txHash?: string }> = [];

    for (const node of nodes) {
      const contractAddress = node.contractAddress;
      this.storeLocally("contract_node_v1", node, "contractAddress");

      const nodeValues = {
        contractAddress: node.contractAddress,
        protocolId: node.protocolId,
        snapshotId: node.snapshotId,
        hop: u64(Number(node.hop)),
        category: node.category,
        sourcifyStatus: node.sourcifyStatus,
        riskScore: dec(Number(node.riskScore).toFixed(2)),
        referencedProtocolId: node.referencedProtocolId || "",
        proxyType: node.proxyType,
        adminType: node.adminType,
        adminAddress: node.adminAddress || "",
        bytecodeHash: node.bytecodeHash || "",
        safeOwnerCount: u64(Number(node.safeOwnerCount || 0)),
        safeThreshold: u64(Number(node.safeThreshold || 0)),
        safeOwners: bytes(
          Buffer.isBuffer(node.safeOwners)
            ? node.safeOwners
            : Buffer.from(JSON.stringify(node.safeOwners || []))
        ),
        oracleStaleness: dec(Number(node.oracleStaleness || 0).toFixed(3)),
        oracleHeartbeat: u64(Number(node.oracleHeartbeat || 0)),
        contractAgeMonths: dec(Number(node.contractAgeMonths || 0).toFixed(1)),
        timelockDelayHours: dec(Number(node.timelockDelayHours || 0).toFixed(2)),
        contractName: node.contractName || "",
        swarmBytecodeRef: node.swarmBytecodeRef || "",
        updatedAt: u64(Number(node.updatedAt || 0)),
      };

      if (this.walletClient) {
        try {
          const res = await this.walletClient.createEntity(
            ContractNode,
            nodeValues,
            { expiration: ExpirationTime.fromBlocks(50_000) }
          );
          console.log(`[Arkiv] ContractNode on-chain: ${node.contractName || node.contractAddress} -> ${res.entityKey}`);
          results.push({ address: contractAddress, entityKey: res.entityKey, txHash: res.txHash });
        } catch (err: any) {
          console.warn(`[Arkiv] Could not write node ${contractAddress}:`, err.message || err);
          results.push({ address: contractAddress, entityKey: `local-${contractAddress}` });
        }
      } else {
        results.push({ address: contractAddress, entityKey: `local-${contractAddress}` });
      }
    }
    console.log(`[Arkiv] Successfully processed ${results.length} ContractNodes.`);
    return results;
  }

  /**
   * Save RiskSnapshot evaluation macro entity with BTL (~50,000 blocks)
   */
  async saveRiskSnapshot(snapshot: {
    snapshotId: string;
    protocolId: string;
    compositeScore: string | number;
    riskTier: string;
    evaluatedAt: bigint | number;
    fingerprint: string;
    swarmGraphRef: string;
    swarmEvidenceRef: string;
    triggeredBy: string;
    hop0AvgScore: string | number;
    hop1AvgScore: string | number;
    hop2AvgScore: string | number;
    nodeCount: bigint | number;
  }): Promise<{ entityKey: string; txHash?: string }> {
    const evaluatedAtNum = Number(snapshot.evaluatedAt);
    const nodeCountNum = Number(snapshot.nodeCount);
    const compScoreNum = Number(snapshot.compositeScore);
    const hop0Num = Number(snapshot.hop0AvgScore);
    const hop1Num = Number(snapshot.hop1AvgScore);
    const hop2Num = Number(snapshot.hop2AvgScore);

    const values = {
      snapshotId: snapshot.snapshotId,
      protocolId: snapshot.protocolId,
      compositeScore: dec(compScoreNum.toFixed(2)),
      riskTier: snapshot.riskTier,
      evaluatedAt: u64(evaluatedAtNum),
      fingerprint: snapshot.fingerprint,
      swarmGraphRef: snapshot.swarmGraphRef,
      swarmEvidenceRef: snapshot.swarmEvidenceRef,
      triggeredBy: snapshot.triggeredBy,
      hop0AvgScore: dec(hop0Num.toFixed(2)),
      hop1AvgScore: dec(hop1Num.toFixed(2)),
      hop2AvgScore: dec(hop2Num.toFixed(2)),
      nodeCount: u64(nodeCountNum),
    };

    this.storeLocally("risk_snapshot_v1", { ...snapshot, evaluatedAt: evaluatedAtNum }, "snapshotId");

    if (this.walletClient) {
      try {
        console.log(`[Arkiv] Broadcasting RiskSnapshot ${snapshot.snapshotId} to Rabdi...`);
        const res = await this.walletClient.createEntity(
          RiskSnapshot,
          values,
          { expiration: ExpirationTime.fromBlocks(50_000) }
        );
        console.log(`[Arkiv] RiskSnapshot confirmed on-chain! Tx: ${res.txHash} Key: ${res.entityKey}`);
        return { entityKey: res.entityKey, txHash: res.txHash };
      } catch (err: any) {
        console.warn(`[Arkiv] Could not write RiskSnapshot on-chain:`, err.message || err);
      }
    }
    return { entityKey: `local-${snapshot.snapshotId}` };
  }

  /**
   * Query contract nodes on Rabdi by protocolId
   */
  async getNodesByProtocol(protocolId: string): Promise<any[]> {
    if (this.publicClient) {
      try {
        const queryRes = await this.publicClient.query(
          and(eq("arkiv.schema", "contract_node_v1"), eq("protocolId", protocolId)),
          { limit: 100 }
        );
        if (queryRes.entities && queryRes.entities.length > 0) {
          return queryRes.entities.map((e: any) => ({
            ...e.$attributes,
            $key: e.$key,
            $expiresAt: e.$expiresAt,
          }));
        }
      } catch (err) {
        // Fallback to local memory store
      }
    }
    const list = this.localStore.get("contract_node_v1") || [];
    return list.filter((n) => n.protocolId === protocolId);
  }

  /**
   * Query latest RiskSnapshot on Rabdi
   */
  async getLatestSnapshot(protocolId: string): Promise<any | null> {
    if (this.publicClient) {
      try {
        const queryRes = await this.publicClient.query(
          and(eq("arkiv.schema", "risk_snapshot_v1"), eq("protocolId", protocolId)),
          { limit: 1 }
        );
        if (queryRes.entities && queryRes.entities.length > 0) {
          const e = queryRes.entities[0];
          return {
            ...e.$attributes,
            $key: e.$key,
            $expiresAt: e.$expiresAt,
          };
        }
      } catch (err) {
        // Fallback
      }
    }
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

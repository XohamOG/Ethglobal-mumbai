import { ethers } from "ethers";

export interface FingerprintInputs {
  implBytecodeHashes: string[];
  adminAddresses: string[];
  oracleFeedAddresses: string[];
  depAddresses: string[];
}

/**
 * Compute deterministic Keccak256 Protocol Fingerprint
 * Used by Chainlink CRE to detect on-chain drift without re-running heavy graph analytics
 */
export function computeProtocolFingerprint(inputs: FingerprintInputs): string {
  // Normalize and sort deterministically
  const normHashes = [...inputs.implBytecodeHashes]
    .map((h) => h.toLowerCase().trim())
    .sort()
    .join(":");

  const normAdmins = [...inputs.adminAddresses]
    .map((a) => ethers.getAddress(a).toLowerCase())
    .sort()
    .join(":");

  const normOracles = [...inputs.oracleFeedAddresses]
    .map((o) => ethers.getAddress(o).toLowerCase())
    .sort()
    .join(":");

  const normDeps = [...inputs.depAddresses]
    .map((d) => ethers.getAddress(d).toLowerCase())
    .sort()
    .join(":");

  // Concatenate parts: implBytecodeHashes || adminAddresses || oracleFeedAddresses || depAddresses
  const compositeString = `${normHashes}|${normAdmins}|${normOracles}|${normDeps}`;
  const utf8Bytes = ethers.toUtf8Bytes(compositeString);

  return ethers.keccak256(utf8Bytes);
}


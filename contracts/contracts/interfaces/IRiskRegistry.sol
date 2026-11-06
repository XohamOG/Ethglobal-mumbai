// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRiskRegistry
 * @notice Interface for the decentralized DeFi Provenance Risk Registry.
 * Tracks multi-hop composite risk scores verified and reported by Chainlink CRE.
 */
interface IRiskRegistry {
    struct RiskReport {
        uint256 compositeScore; // Scaled by 1e2 (e.g. 1030 = 10.30)
        string riskTier;        // "LOW", "MEDIUM", "HIGH", "CRITICAL"
        string snapshotId;      // Foreign key to Arkiv RiskSnapshot
        uint256 blockNumber;    // Evaluation block height
        uint256 reportedAt;     // Timestamp of on-chain attestation
    }

    event RiskReported(
        string indexed protocolId,
        uint256 compositeScore,
        string riskTier,
        string snapshotId,
        uint256 blockNumber
    );

    event ForwarderUpdated(
        address indexed previousForwarder,
        address indexed newForwarder
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    function reportRisk(
        string calldata protocolId,
        uint256 compositeScore,
        string calldata riskTier,
        string calldata snapshotId,
        uint256 blockNumber
    ) external;

    function getRisk(string calldata protocolId) external view returns (RiskReport memory);

    function creForwarder() external view returns (address);

    function owner() external view returns (address);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IRiskRegistry.sol";

/**
 * @title RiskRegistry
 * @notice Central on-chain registry for DeFi protocol provenance and composite dependency risk scores.
 * Authenticated write access is restricted to the Chainlink Runtime Environment (CRE) forwarder address.
 * Referenced by the Next.js frontend to monitor real-time verifiable attestations.
 */
contract RiskRegistry is IRiskRegistry {
    address public creForwarder;
    address public owner;

    mapping(string => RiskReport) public latestReports;

    error UnauthorizedForwarder();
    error UnauthorizedOwner();
    error InvalidAddress();

    modifier onlyForwarder() {
        if (msg.sender != creForwarder) revert UnauthorizedForwarder();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert UnauthorizedOwner();
        _;
    }

    /**
     * @param _creForwarder Initial authorized Chainlink CRE forwarder address.
     * If set to address(0), defaults to the deployer (owner) for convenient local simulation and testing.
     */
    constructor(address _creForwarder) {
        owner = msg.sender;
        creForwarder = _creForwarder != address(0) ? _creForwarder : msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
        emit ForwarderUpdated(address(0), creForwarder);
    }

    /**
     * @notice Records an attested risk snapshot report for a protocol.
     * @dev Restricted to the authorized Chainlink CRE forwarder.
     * @param protocolId Unique slug of the protocol (e.g., "aave-v3-mainnet").
     * @param compositeScore Two-hop propagated score scaled by 1e2 (e.g. 1030 for 10.30).
     * @param riskTier Textual risk tier ("LOW", "MEDIUM", "HIGH", "CRITICAL").
     * @param snapshotId Foreign key reference to the Arkiv RiskSnapshot entity.
     * @param blockNumber Block height at which the graph evaluation occurred.
     */
    function reportRisk(
        string calldata protocolId,
        uint256 compositeScore,
        string calldata riskTier,
        string calldata snapshotId,
        uint256 blockNumber
    ) external onlyForwarder {
        latestReports[protocolId] = RiskReport({
            compositeScore: compositeScore,
            riskTier: riskTier,
            snapshotId: snapshotId,
            blockNumber: blockNumber,
            reportedAt: block.timestamp
        });

        emit RiskReported(protocolId, compositeScore, riskTier, snapshotId, blockNumber);
    }

    /**
     * @notice Retrieves the most recently attested risk report for a protocol.
     * @param protocolId Unique slug of the protocol.
     * @return RiskReport struct containing composite score, tier, snapshot ID, and evaluation block.
     */
    function getRisk(string calldata protocolId) external view returns (RiskReport memory) {
        return latestReports[protocolId];
    }

    /**
     * @notice Updates the authorized Chainlink CRE forwarder address.
     * @dev Only callable by the contract owner.
     * @param _newForwarder The new authorized forwarder address.
     */
    function setCreForwarder(address _newForwarder) external onlyOwner {
        if (_newForwarder == address(0)) revert InvalidAddress();
        address oldForwarder = creForwarder;
        creForwarder = _newForwarder;
        emit ForwarderUpdated(oldForwarder, _newForwarder);
    }

    /**
     * @notice Transfers ownership of the registry.
     * @dev Only callable by the contract owner.
     * @param _newOwner The new owner address.
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert InvalidAddress();
        address oldOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(oldOwner, _newOwner);
    }
}

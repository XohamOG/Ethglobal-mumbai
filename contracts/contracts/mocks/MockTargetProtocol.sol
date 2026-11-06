// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockTargetProtocol
 * @notice Mock upgradeable contract used to test Chainlink CRE Log Triggers.
 * Emits standard EIP-1967 events: Upgraded and AdminChanged.
 */
contract MockTargetProtocol {
    address public implementation;
    address public admin;

    event Upgraded(address indexed implementation);
    event AdminChanged(address previousAdmin, address newAdmin);

    constructor(address _implementation, address _admin) {
        implementation = _implementation;
        admin = _admin;
    }

    function upgradeTo(address newImplementation) external {
        implementation = newImplementation;
        emit Upgraded(newImplementation);
    }

    function changeAdmin(address newAdmin) external {
        address prev = admin;
        admin = newAdmin;
        emit AdminChanged(prev, newAdmin);
    }
}

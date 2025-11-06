// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockMasterRegistry
 * @notice Mock registry for testing integration
 */
contract MockMasterRegistry {
    mapping(bytes32 => address) private contracts;

    function setContract(bytes32 name, address addr) external {
        contracts[name] = addr;
    }

    function getContract(bytes32 name) external view returns (address) {
        return contracts[name];
    }

    function getContract(string memory name) external view returns (address) {
        return contracts[keccak256(bytes(name))];
    }

    function hasContract(string memory name) external view returns (bool) {
        return contracts[keccak256(bytes(name))] != address(0);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IMasterRegistry
 * @notice Interface for the MasterRegistry contract in KEKTECH 3.0
 */
interface IMasterRegistry {
    /**
     * @notice Get a contract address from the registry
     * @param name Name of the contract
     * @return Address of the contract
     */
    function getContract(string memory name) external view returns (address);

    /**
     * @notice Set a contract address in the registry
     * @param name Name of the contract
     * @param addr Address of the contract
     */
    function setContract(string memory name, address addr) external;

    /**
     * @notice Check if a contract is registered
     * @param name Name of the contract
     * @return True if registered
     */
    function hasContract(string memory name) external view returns (bool);
}
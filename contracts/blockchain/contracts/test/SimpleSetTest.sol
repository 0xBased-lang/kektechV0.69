// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title SimpleSetTest
 * @notice Minimal contract to test if EnumerableSet.add() works in isolation
 * @dev Used for Days 21-22 debugging to isolate CurveRegistry bug
 */
contract SimpleSetTest {
    using EnumerableSet for EnumerableSet.AddressSet;

    // Just a simple address set
    EnumerableSet.AddressSet private addresses;

    /**
     * @notice Add an address to the set
     * @param addr Address to add
     */
    function addAddress(address addr) external {
        require(addr != address(0), "Invalid address");
        bool added = addresses.add(addr);
        require(added, "Address already exists");
    }

    /**
     * @notice Get all addresses in the set
     * @return Array of addresses
     */
    function getAllAddresses() external view returns (address[] memory) {
        uint256 length = addresses.length();
        address[] memory result = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            result[i] = addresses.at(i);
        }

        return result;
    }

    /**
     * @notice Check if address exists
     * @param addr Address to check
     * @return True if exists
     */
    function contains(address addr) external view returns (bool) {
        return addresses.contains(addr);
    }
}

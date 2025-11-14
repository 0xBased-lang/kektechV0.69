// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/**
 * @title MockERC1155Vouchers
 * @notice Mock ERC1155 contract for testing
 * @dev Simulates the vouchers contract for V3 testing
 */
contract MockERC1155Vouchers is ERC1155 {

    constructor() ERC1155("https://mock.uri/{id}.json") {}

    /**
     * @notice Mint tokens for testing
     * @param to Recipient address
     * @param id Token ID
     * @param amount Amount to mint
     * @param data Additional data
     */
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external {
        _mint(to, id, amount, data);
    }

    /**
     * @notice Batch mint tokens for testing
     * @param to Recipient address
     * @param ids Token IDs
     * @param amounts Amounts to mint
     * @param data Additional data
     */
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external {
        _mintBatch(to, ids, amounts, data);
    }

    /**
     * @notice Burn tokens for testing
     * @param from Address to burn from
     * @param id Token ID
     * @param amount Amount to burn
     */
    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) external {
        _burn(from, id, amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/**
 * @title MockERC1155
 * @dev Mock ERC-1155 contract for testing KEKTV Vouchers functionality
 */
contract MockERC1155 is ERC1155 {
    constructor() ERC1155("https://example.com/api/voucher/{id}.json") {}

    /**
     * @dev Mint tokens for testing
     * @param to Recipient address
     * @param id Token ID
     * @param amount Amount to mint
     */
    function mint(address to, uint256 id, uint256 amount) external {
        _mint(to, id, amount, "");
    }

    /**
     * @dev Batch mint tokens for testing
     * @param to Recipient address
     * @param ids Array of token IDs
     * @param amounts Array of amounts
     */
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts) external {
        _mintBatch(to, ids, amounts, "");
    }
}

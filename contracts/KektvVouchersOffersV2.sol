// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/**
 * @title KEKTV Vouchers Offers System V2 (BASED Payments)
 * @notice Decentralized offer system for KEKTV ERC-1155 vouchers using BASED (native token)
 * @dev Production-ready with essential security features
 *
 * Key Features:
 * - Make/accept/cancel/reject offers on vouchers
 * - Offers use BASED (native token) instead of ERC-20
 * - Escrow system (BASED held in contract)
 * - Supports voucher amounts/quantities
 * - Pausable for emergency situations
 * - Minimum offer values to prevent spam
 *
 * V2 Changes from V1:
 * - ✅ Uses BASED (native token) instead of TECH (ERC-20)
 * - ✅ No token approval needed
 * - ✅ Simpler UX (everyone has BASED by default)
 * - ✅ Lower gas costs (no ERC-20 transfers)
 * - ✅ Better for BasedAI ecosystem
 *
 * Voucher Types:
 * - 0: Genesis
 * - 1: Silver
 * - 2: Gold
 * - 3: Platinum
 */
contract KektvVouchersOffersV2 is Ownable, Pausable, ReentrancyGuard {

    // ============ State Variables ============

    /// @notice KEKTV Vouchers ERC-1155 contract
    IERC1155 public immutable vouchersContract;

    /// @notice Minimum offer value in BASED (wei)
    uint256 public minOfferValue;

    /// @notice Offer counter for unique IDs
    uint256 private _offerIdCounter;

    // ============ Structs ============

    struct Offer {
        uint256 offerId;
        address offerer;
        address voucherOwner;
        uint256 tokenId;
        uint256 amount;
        uint256 offerPrice; // Total BASED amount (not per voucher)
        uint256 createdAt;
        bool active;
    }

    // ============ Storage Mappings ============

    /// @notice All offers by offer ID
    mapping(uint256 => Offer) public offers;

    /// @notice Offers by tokenId (for querying)
    mapping(uint256 => uint256[]) public tokenOffers;

    /// @notice Offers made by user
    mapping(address => uint256[]) public userOffers;

    /// @notice Offers received by voucher owner
    mapping(address => uint256[]) public receivedOffers;

    // ============ Events ============

    event OfferMade(
        uint256 indexed offerId,
        address indexed offerer,
        address indexed voucherOwner,
        uint256 tokenId,
        uint256 amount,
        uint256 offerPrice
    );

    event OfferAccepted(
        uint256 indexed offerId,
        address indexed offerer,
        address indexed voucherOwner,
        uint256 tokenId,
        uint256 amount,
        uint256 offerPrice
    );

    event OfferCancelled(
        uint256 indexed offerId,
        address indexed offerer
    );

    event OfferRejected(
        uint256 indexed offerId,
        address indexed voucherOwner
    );

    event MinOfferValueUpdated(uint256 oldValue, uint256 newValue);

    // ============ Errors ============

    error InsufficientOfferValue(uint256 sent, uint256 required);
    error OfferNotActive();
    error OnlyOfferer();
    error OnlyVoucherOwner();
    error InsufficientVoucherBalance();
    error TransferFailed();
    error VoucherTransferFailed();

    // ============ Constructor ============

    constructor(
        address _vouchersContract,
        uint256 _minOfferValue
    ) Ownable(msg.sender) {
        vouchersContract = IERC1155(_vouchersContract);
        minOfferValue = _minOfferValue;
    }

    // ============ Core Functions ============

    /**
     * @notice Make an offer on a voucher (pays in BASED)
     * @param tokenId Voucher token ID
     * @param voucherAmount Number of vouchers to buy
     * @param voucherOwner Address that owns the vouchers
     */
    function makeOffer(
        uint256 tokenId,
        uint256 voucherAmount,
        address voucherOwner
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        // Validate offer value
        if (msg.value < minOfferValue) {
            revert InsufficientOfferValue(msg.value, minOfferValue);
        }

        // Create offer
        uint256 offerId = ++_offerIdCounter;

        offers[offerId] = Offer({
            offerId: offerId,
            offerer: msg.sender,
            voucherOwner: voucherOwner,
            tokenId: tokenId,
            amount: voucherAmount,
            offerPrice: msg.value, // Total BASED sent
            createdAt: block.timestamp,
            active: true
        });

        // Track offer
        tokenOffers[tokenId].push(offerId);
        userOffers[msg.sender].push(offerId);
        receivedOffers[voucherOwner].push(offerId);

        emit OfferMade(offerId, msg.sender, voucherOwner, tokenId, voucherAmount, msg.value);

        return offerId;
    }

    /**
     * @notice Accept an offer (seller receives BASED, buyer receives vouchers)
     * @param offerId The offer ID to accept
     */
    function acceptOffer(uint256 offerId) external whenNotPaused nonReentrant {
        Offer storage offer = offers[offerId];

        // Validate
        if (!offer.active) revert OfferNotActive();
        if (msg.sender != offer.voucherOwner) revert OnlyVoucherOwner();

        // Check voucher balance
        uint256 balance = vouchersContract.balanceOf(msg.sender, offer.tokenId);
        if (balance < offer.amount) revert InsufficientVoucherBalance();

        // Mark inactive
        offer.active = false;

        // Transfer vouchers to buyer
        try vouchersContract.safeTransferFrom(
            msg.sender,
            offer.offerer,
            offer.tokenId,
            offer.amount,
            ""
        ) {
            // Success - now transfer BASED to seller
            (bool success, ) = payable(msg.sender).call{value: offer.offerPrice}("");
            if (!success) revert TransferFailed();

            emit OfferAccepted(offerId, offer.offerer, msg.sender, offer.tokenId, offer.amount, offer.offerPrice);
        } catch {
            // Voucher transfer failed - revert everything
            offer.active = true; // Restore state
            revert VoucherTransferFailed();
        }
    }

    /**
     * @notice Cancel your own offer (get BASED back)
     * @param offerId The offer ID to cancel
     */
    function cancelOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];

        // Validate
        if (!offer.active) revert OfferNotActive();
        if (msg.sender != offer.offerer) revert OnlyOfferer();

        // Mark inactive
        offer.active = false;

        // Refund BASED to offerer
        (bool success, ) = payable(offer.offerer).call{value: offer.offerPrice}("");
        if (!success) revert TransferFailed();

        emit OfferCancelled(offerId, offer.offerer);
    }

    /**
     * @notice Reject an offer (seller rejects, buyer gets BASED back)
     * @param offerId The offer ID to reject
     */
    function rejectOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];

        // Validate
        if (!offer.active) revert OfferNotActive();
        if (msg.sender != offer.voucherOwner) revert OnlyVoucherOwner();

        // Mark inactive
        offer.active = false;

        // Refund BASED to offerer
        (bool success, ) = payable(offer.offerer).call{value: offer.offerPrice}("");
        if (!success) revert TransferFailed();

        emit OfferRejected(offerId, offer.voucherOwner);
    }

    // ============ View Functions ============

    /**
     * @notice Get all offers for a token
     */
    function getTokenOffers(uint256 tokenId) external view returns (uint256[] memory) {
        return tokenOffers[tokenId];
    }

    /**
     * @notice Get all offers made by a user
     */
    function getUserOffers(address user) external view returns (uint256[] memory) {
        return userOffers[user];
    }

    /**
     * @notice Get all offers received by a user
     */
    function getReceivedOffers(address user) external view returns (uint256[] memory) {
        return receivedOffers[user];
    }

    /**
     * @notice Get offer details
     */
    function getOffer(uint256 offerId) external view returns (Offer memory) {
        return offers[offerId];
    }

    /**
     * @notice Get total number of offers created
     */
    function getTotalOffers() external view returns (uint256) {
        return _offerIdCounter;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update minimum offer value
     */
    function updateMinOfferValue(uint256 newMinValue) external onlyOwner {
        uint256 oldValue = minOfferValue;
        minOfferValue = newMinValue;
        emit MinOfferValueUpdated(oldValue, newMinValue);
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Fallback ============

    /**
     * @notice Reject direct BASED transfers
     */
    receive() external payable {
        revert("Use makeOffer() to send BASED");
    }
}

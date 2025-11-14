// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title KEKTV Vouchers Offers System (HYBRID Version)
 * @notice Decentralized offer system for KEKTV ERC-1155 vouchers
 * @dev Production-ready with essential security features
 *
 * Key Features:
 * - Make/accept/cancel/reject offers on vouchers
 * - Offers use TECH token (ERC-20)
 * - Escrow system (offers held in contract)
 * - Supports voucher amounts/quantities
 * - Pausable for emergency situations
 * - Minimum offer values to prevent spam
 *
 * Voucher Types:
 * - 0: Genesis
 * - 1: Silver
 * - 2: Gold
 * - 3: Platinum
 */
contract KektvVouchersOffers is Ownable, Pausable, ReentrancyGuard {

    // ============ State Variables ============

    /// @notice KEKTV Vouchers ERC-1155 contract
    IERC1155 public immutable vouchersContract;

    /// @notice TECH token (ERC-20) used for offers
    IERC20 public immutable techToken;

    /// @notice Minimum offer value in TECH tokens (wei)
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
        uint256 offerPrice;
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

    error InvalidTokenId();
    error InvalidAmount();
    error InvalidOfferPrice();
    error OfferBelowMinimum();
    error InsufficientBalance();
    error InsufficientAllowance();
    error OfferNotActive();
    error Unauthorized();
    error TransferFailed();

    // ============ Constructor ============

    /**
     * @notice Initialize the offers contract
     * @param _vouchersContract KEKTV Vouchers ERC-1155 contract address
     * @param _techToken TECH token ERC-20 contract address
     * @param _minOfferValue Minimum offer value in TECH wei
     */
    constructor(
        address _vouchersContract,
        address _techToken,
        uint256 _minOfferValue
    ) Ownable(msg.sender) {
        require(_vouchersContract != address(0), "Invalid vouchers contract");
        require(_techToken != address(0), "Invalid TECH token");

        vouchersContract = IERC1155(_vouchersContract);
        techToken = IERC20(_techToken);
        minOfferValue = _minOfferValue;

        _offerIdCounter = 1; // Start at 1 (0 reserved for null)
    }

    // ============ Core Functions ============

    /**
     * @notice Make an offer on a voucher
     * @param tokenId Voucher token ID (0-3)
     * @param amount Number of vouchers to offer on
     * @param offerPrice Offer price in TECH tokens (per voucher)
     * @return offerId The created offer ID
     */
    function makeOffer(
        uint256 tokenId,
        uint256 amount,
        uint256 offerPrice
    ) external whenNotPaused nonReentrant returns (uint256) {
        // Validation
        if (tokenId > 3) revert InvalidTokenId(); // Only 4 voucher types (0-3)
        if (amount == 0) revert InvalidAmount();
        if (offerPrice == 0) revert InvalidOfferPrice();

        uint256 totalOfferPrice = offerPrice * amount;
        if (totalOfferPrice < minOfferValue) revert OfferBelowMinimum();

        // Check voucher owner has sufficient balance
        // Note: voucherOwner will be address(0) initially, set when owner accepts

        // Check offerer has sufficient TECH tokens
        if (techToken.balanceOf(msg.sender) < totalOfferPrice) {
            revert InsufficientBalance();
        }

        // Check offerer has approved this contract
        if (techToken.allowance(msg.sender, address(this)) < totalOfferPrice) {
            revert InsufficientAllowance();
        }

        // Transfer TECH tokens to escrow (this contract)
        bool success = techToken.transferFrom(msg.sender, address(this), totalOfferPrice);
        if (!success) revert TransferFailed();

        // Create offer
        uint256 offerId = _offerIdCounter++;

        offers[offerId] = Offer({
            offerId: offerId,
            offerer: msg.sender,
            voucherOwner: address(0), // Will be set when accepted
            tokenId: tokenId,
            amount: amount,
            offerPrice: offerPrice,
            createdAt: block.timestamp,
            active: true
        });

        // Track offer
        tokenOffers[tokenId].push(offerId);
        userOffers[msg.sender].push(offerId);

        emit OfferMade(offerId, msg.sender, address(0), tokenId, amount, offerPrice);

        return offerId;
    }

    /**
     * @notice Accept an offer (voucher owner)
     * @param offerId The offer ID to accept
     */
    function acceptOffer(uint256 offerId) external whenNotPaused nonReentrant {
        Offer storage offer = offers[offerId];

        // Validation
        if (!offer.active) revert OfferNotActive();

        // Check caller owns the vouchers
        uint256 balance = vouchersContract.balanceOf(msg.sender, offer.tokenId);
        if (balance < offer.amount) revert InsufficientBalance();

        // Check vouchers are approved for transfer
        if (!vouchersContract.isApprovedForAll(msg.sender, address(this))) {
            revert InsufficientAllowance();
        }

        // Mark offer as inactive
        offer.active = false;
        offer.voucherOwner = msg.sender;

        // Track received offer
        receivedOffers[msg.sender].push(offerId);

        // Calculate total price
        uint256 totalPrice = offer.offerPrice * offer.amount;

        // Transfer vouchers from owner to offerer
        vouchersContract.safeTransferFrom(
            msg.sender,
            offer.offerer,
            offer.tokenId,
            offer.amount,
            ""
        );

        // Transfer TECH tokens from escrow to voucher owner
        bool success = techToken.transfer(msg.sender, totalPrice);
        if (!success) revert TransferFailed();

        emit OfferAccepted(offerId, offer.offerer, msg.sender, offer.tokenId, offer.amount, offer.offerPrice);
    }

    /**
     * @notice Cancel an offer (offerer only)
     * @param offerId The offer ID to cancel
     */
    function cancelOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];

        // Validation
        if (offer.offerer != msg.sender) revert Unauthorized();
        if (!offer.active) revert OfferNotActive();

        // Mark offer as inactive
        offer.active = false;

        // Calculate total price
        uint256 totalPrice = offer.offerPrice * offer.amount;

        // Refund TECH tokens to offerer
        bool success = techToken.transfer(msg.sender, totalPrice);
        if (!success) revert TransferFailed();

        emit OfferCancelled(offerId, msg.sender);
    }

    /**
     * @notice Reject an offer (voucher owner)
     * @param offerId The offer ID to reject
     */
    function rejectOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];

        // Validation
        if (!offer.active) revert OfferNotActive();

        // Check caller owns the vouchers
        uint256 balance = vouchersContract.balanceOf(msg.sender, offer.tokenId);
        if (balance < offer.amount) revert Unauthorized();

        // Mark offer as inactive
        offer.active = false;
        offer.voucherOwner = msg.sender;

        // Calculate total price
        uint256 totalPrice = offer.offerPrice * offer.amount;

        // Refund TECH tokens to offerer
        bool success = techToken.transfer(offer.offerer, totalPrice);
        if (!success) revert TransferFailed();

        emit OfferRejected(offerId, msg.sender);
    }

    // ============ View Functions ============

    /**
     * @notice Get all offers for a token ID
     * @param tokenId The voucher token ID
     * @return Array of offer IDs
     */
    function getTokenOffers(uint256 tokenId) external view returns (uint256[] memory) {
        return tokenOffers[tokenId];
    }

    /**
     * @notice Get all offers made by a user
     * @param user The user address
     * @return Array of offer IDs
     */
    function getUserOffers(address user) external view returns (uint256[] memory) {
        return userOffers[user];
    }

    /**
     * @notice Get all offers received by a user
     * @param user The user address
     * @return Array of offer IDs
     */
    function getReceivedOffers(address user) external view returns (uint256[] memory) {
        return receivedOffers[user];
    }

    /**
     * @notice Get offer details
     * @param offerId The offer ID
     * @return Offer struct
     */
    function getOffer(uint256 offerId) external view returns (Offer memory) {
        return offers[offerId];
    }

    /**
     * @notice Get total number of offers created
     * @return Total offers count
     */
    function getTotalOffers() external view returns (uint256) {
        return _offerIdCounter - 1;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update minimum offer value
     * @param newMinValue New minimum offer value
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

    /**
     * @notice Emergency withdraw (owner only, when paused)
     * @dev Only callable when paused, for emergency situations
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        uint256 balance = techToken.balanceOf(address(this));
        if (balance > 0) {
            bool success = techToken.transfer(owner(), balance);
            require(success, "Emergency withdraw failed");
        }
    }
}

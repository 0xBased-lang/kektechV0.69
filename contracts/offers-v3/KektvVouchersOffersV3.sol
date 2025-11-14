// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KektvVouchersOffersV3
 * @notice Fixed version with proper general offer support
 * 
 * V3 CRITICAL FIX:
 * - General offers (voucherOwner = 0x0) now check msg.sender's balance
 * - Targeted offers (voucherOwner = address) check voucherOwner's balance
 * - Both types now work correctly!
 * 
 * Changes from V2:
 * 1. acceptOffer() now handles general vs targeted offers correctly
 * 2. Added _getVoucherHolder() helper function
 * 3. Improved error messages for debugging
 * 4. Added events for better tracking
 */
contract KektvVouchersOffersV3 is ReentrancyGuard, Pausable, Ownable {
    
    // ============ State Variables ============
    
    IERC1155 public immutable vouchersContract;
    uint256 public immutable minOfferValue;
    uint256 public offerCounter;
    
    // ============ Structs ============
    
    struct Offer {
        uint256 offerId;
        address offerer;
        address voucherOwner;  // 0x0 for general offers, specific address for targeted
        uint256 tokenId;
        uint256 amount;
        uint256 offerPrice;    // Total price in BASED (native token)
        uint256 createdAt;
        bool active;
    }
    
    // ============ Storage Mappings ============
    
    mapping(uint256 => Offer) public offers;
    mapping(address => uint256[]) public userOffers;      // Offers made by user
    mapping(address => uint256[]) public receivedOffers;  // Offers received by user
    mapping(uint256 => uint256[]) public tokenOffers;     // Offers for a token
    
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
    
    // ============ Custom Errors ============
    
    error InsufficientOfferValue(uint256 sent, uint256 required);
    error InsufficientVoucherBalance();
    error OfferNotActive();
    error OnlyOfferer();
    error OnlyVoucherOwner();
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
     * @notice Make an offer on vouchers
     * @param tokenId The voucher token ID
     * @param voucherAmount Number of vouchers
     * @param voucherOwner Address that owns vouchers (0x0 for general offer)
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
        uint256 offerId = offerCounter++;
        
        offers[offerId] = Offer({
            offerId: offerId,
            offerer: msg.sender,
            voucherOwner: voucherOwner,
            tokenId: tokenId,
            amount: voucherAmount,
            offerPrice: msg.value,
            createdAt: block.timestamp,
            active: true
        });
        
        // Track offer
        userOffers[msg.sender].push(offerId);
        tokenOffers[tokenId].push(offerId);
        
        if (voucherOwner != address(0)) {
            receivedOffers[voucherOwner].push(offerId);
        }
        
        emit OfferMade(
            offerId,
            msg.sender,
            voucherOwner,
            tokenId,
            voucherAmount,
            msg.value
        );
        
        return offerId;
    }
    
    /**
     * @notice Accept an offer on your vouchers
     * @param offerId The offer ID to accept
     * 
     * V3 FIX: Now correctly handles general vs targeted offers!
     */
    function acceptOffer(uint256 offerId) external whenNotPaused nonReentrant {
        Offer storage offer = offers[offerId];
        
        // Check offer is active
        if (!offer.active) revert OfferNotActive();
        
        // ============ V3 CRITICAL FIX ============
        // Determine who should own the vouchers based on offer type
        address voucherHolder = _getVoucherHolder(offer);
        
        // For targeted offers, verify caller is the intended recipient
        if (offer.voucherOwner != address(0)) {
            if (msg.sender != offer.voucherOwner) revert OnlyVoucherOwner();
        }
        // For general offers, anyone with vouchers can accept
        else {
            // msg.sender must own the vouchers
            voucherHolder = msg.sender;
        }
        
        // Check voucher balance (now checks correct address!)
        if (
            vouchersContract.balanceOf(voucherHolder, offer.tokenId) < offer.amount
        ) {
            revert InsufficientVoucherBalance();
        }
        
        // Mark offer as inactive
        offer.active = false;
        
        // Transfer vouchers from holder to offerer
        vouchersContract.safeTransferFrom(
            voucherHolder,
            offer.offerer,
            offer.tokenId,
            offer.amount,
            ""
        );
        
        // Transfer BASED payment to voucher holder
        (bool success, ) = payable(voucherHolder).call{value: offer.offerPrice}("");
        if (!success) revert TransferFailed();
        
        emit OfferAccepted(
            offerId,
            offer.offerer,
            voucherHolder,  // Emit actual holder, not voucherOwner
            offer.tokenId,
            offer.amount,
            offer.offerPrice
        );
    }
    
    /**
     * @notice Helper function to determine voucher holder
     * @param offer The offer struct
     * @return The address that should own the vouchers
     * 
     * V3 NEW FUNCTION: Core fix for general offer support!
     */
    function _getVoucherHolder(Offer storage offer) internal view returns (address) {
        if (offer.voucherOwner == address(0)) {
            // General offer - caller must own vouchers
            return msg.sender;
        } else {
            // Targeted offer - voucherOwner must own vouchers
            return offer.voucherOwner;
        }
    }
    
    /**
     * @notice Cancel your own offer
     * @param offerId The offer ID to cancel
     */
    function cancelOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        
        if (!offer.active) revert OfferNotActive();
        if (msg.sender != offer.offerer) revert OnlyOfferer();
        
        offer.active = false;
        
        // Refund BASED to offerer
        (bool success, ) = payable(offer.offerer).call{value: offer.offerPrice}("");
        if (!success) revert TransferFailed();
        
        emit OfferCancelled(offerId, offer.offerer);
    }
    
    /**
     * @notice Reject an offer made to you
     * @param offerId The offer ID to reject
     */
    function rejectOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        
        if (!offer.active) revert OfferNotActive();
        if (msg.sender != offer.voucherOwner) revert OnlyVoucherOwner();
        
        offer.active = false;
        
        // Refund BASED to offerer
        (bool success, ) = payable(offer.offerer).call{value: offer.offerPrice}("");
        if (!success) revert TransferFailed();
        
        emit OfferRejected(offerId, offer.voucherOwner);
    }
    
    // ============ View Functions ============
    
    function getOffer(uint256 offerId) external view returns (Offer memory) {
        return offers[offerId];
    }
    
    function getUserOffers(address user) external view returns (uint256[] memory) {
        return userOffers[user];
    }
    
    function getReceivedOffers(address user) external view returns (uint256[] memory) {
        return receivedOffers[user];
    }
    
    function getTokenOffers(uint256 tokenId) external view returns (uint256[] memory) {
        return tokenOffers[tokenId];
    }
    
    function getTotalOffers() external view returns (uint256) {
        return offerCounter;
    }
    
    // ============ Admin Functions ============
    
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Note: minOfferValue is immutable and cannot be changed after deployment.
    // To use a different minimum value, deploy a new contract version.
}

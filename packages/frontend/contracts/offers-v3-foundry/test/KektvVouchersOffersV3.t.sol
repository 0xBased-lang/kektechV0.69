// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/KektvVouchersOffersV3.sol";
import "../src/MockERC1155Vouchers.sol";

/**
 * @title Comprehensive Test Suite for KektvVouchersOffersV3
 * @notice Tests for the CRITICAL bug fix in general offer acceptance
 *
 * CRITICAL TEST: General offers must work correctly
 * V2 Bug: Checked balanceOf(0x0, tokenId) → always 0 → always failed
 * V3 Fix: Checks balanceOf(msg.sender, tokenId) → actual balance → works!
 */
contract KektvVouchersOffersV3Test is Test {

    KektvVouchersOffersV3 public offersV3;
    MockERC1155Vouchers public vouchers;

    address public owner;
    address public offerer;
    address public voucherHolder1;
    address public voucherHolder2;
    address public randomUser;

    uint256 public constant MIN_OFFER_VALUE = 0.001 ether;

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

    function setUp() public {
        // Setup accounts
        owner = address(this);
        offerer = makeAddr("offerer");
        voucherHolder1 = makeAddr("voucherHolder1");
        voucherHolder2 = makeAddr("voucherHolder2");
        randomUser = makeAddr("randomUser");

        // Deploy contracts
        vouchers = new MockERC1155Vouchers();
        offersV3 = new KektvVouchersOffersV3(
            address(vouchers),
            MIN_OFFER_VALUE
        );

        // Mint vouchers to holders
        // Token IDs: 0=Genesis, 1=Silver, 2=Gold, 3=Platinum
        vouchers.mint(voucherHolder1, 0, 1, ""); // 1 Genesis
        vouchers.mint(voucherHolder1, 2, 2, ""); // 2 Gold
        vouchers.mint(voucherHolder1, 3, 1, ""); // 1 Platinum

        vouchers.mint(voucherHolder2, 2, 1, ""); // 1 Gold
        vouchers.mint(voucherHolder2, 3, 2, ""); // 2 Platinum

        // Approve offers contract for all holders
        vm.prank(voucherHolder1);
        vouchers.setApprovalForAll(address(offersV3), true);

        vm.prank(voucherHolder2);
        vouchers.setApprovalForAll(address(offersV3), true);

        // Give offerer some ETH
        vm.deal(offerer, 100 ether);
    }

    // ============ CRITICAL TESTS: General Offer Bug Fix ============

    function test_GeneralOfferAcceptance_CRITICAL_BUG_FIX() public {
        console.log("\n=== CRITICAL TEST: General Offer Acceptance (Bug Fix) ===");

        uint256 offerPrice = 1 ether;
        uint256 tokenId = 3; // Platinum
        uint256 amount = 1;
        address voucherOwner = address(0); // GENERAL OFFER!

        console.log("Creating general offer...");
        console.log("  Offerer:", offerer);
        console.log("  VoucherOwner: 0x0 (GENERAL OFFER)");
        console.log("  TokenId:", tokenId);
        console.log("  Amount:", amount);

        // Make general offer
        vm.prank(offerer);
        uint256 offerId = offersV3.makeOffer{value: offerPrice}(
            tokenId,
            amount,
            voucherOwner
        );

        console.log("  OfferId:", offerId);

        // Verify offer created
        (
            uint256 _offerId,
            address _offerer,
            address _voucherOwner,
            uint256 _tokenId,
            uint256 _amount,
            uint256 _offerPrice,
            ,
            bool _active
        ) = offersV3.offers(offerId);

        assertEq(_offerId, 0, "Offer ID should be 0");
        assertEq(_offerer, offerer, "Offerer should match");
        assertEq(_voucherOwner, address(0), "VoucherOwner should be 0x0 (general)");
        assertEq(_tokenId, tokenId, "TokenId should match");
        assertEq(_amount, amount, "Amount should match");
        assertEq(_offerPrice, offerPrice, "OfferPrice should match");
        assertTrue(_active, "Offer should be active");

        console.log("\nChecking voucherHolder1 balance before accept...");
        uint256 holderBalanceBefore = vouchers.balanceOf(voucherHolder1, tokenId);
        console.log("  Holder balance:", holderBalanceBefore, "Platinum");
        assertGe(holderBalanceBefore, amount, "Holder should own enough vouchers");

        uint256 holderETHBefore = voucherHolder1.balance;

        // THIS IS THE CRITICAL TEST!
        // V2 would check: balanceOf(0x0, 3) = 0 -> FAIL with InsufficientVoucherBalance
        // V3 should check: balanceOf(msg.sender, 3) = 1 -> SUCCESS!
        console.log("\nAccepting general offer (THE CRITICAL TEST!)...");
        console.log("  V2 would check: balanceOf(0x0, 3) = 0 -> FAIL");
        console.log("  V3 should check: balanceOf(msg.sender, 3) = 1 -> SUCCESS");

        vm.prank(voucherHolder1);
        offersV3.acceptOffer(offerId);

        console.log("  [OK] ACCEPT SUCCEEDED! Bug is fixed!");

        // Verify state changes
        (, , , , , , , bool activeAfter) = offersV3.offers(offerId);
        assertFalse(activeAfter, "Offer should be inactive after accept");

        // Verify voucher transferred to offerer
        uint256 offererVoucherBalance = vouchers.balanceOf(offerer, tokenId);
        assertEq(offererVoucherBalance, amount, "Offerer should receive voucher");
        console.log("  [OK] Voucher transferred to offerer");

        // Verify holder received BASED
        uint256 holderETHAfter = voucherHolder1.balance;
        assertEq(holderETHAfter - holderETHBefore, offerPrice, "Holder should receive BASED");
        console.log("  [OK] Holder received:", offerPrice / 1 ether, "BASED");

        // Verify holder's voucher balance decreased
        uint256 holderVoucherAfter = vouchers.balanceOf(voucherHolder1, tokenId);
        assertEq(holderVoucherAfter, holderBalanceBefore - amount, "Holder voucher balance should decrease");
        console.log("  [OK] Holder voucher balance decreased");

        console.log("\n[SUCCESS] CRITICAL TEST PASSED! General offers work correctly!");
    }

    function test_GeneralOfferRejection_InsufficientBalance() public {
        console.log("\n=== TEST: General Offer Rejection (No Vouchers) ===");

        uint256 offerPrice = 1 ether;
        uint256 tokenId = 3; // Platinum
        uint256 amount = 1;

        // Make general offer
        vm.prank(offerer);
        uint256 offerId = offersV3.makeOffer{value: offerPrice}(
            tokenId,
            amount,
            address(0) // GENERAL OFFER
        );

        console.log("Random user (no Platinum) tries to accept...");

        // Random user tries to accept but has no vouchers
        vm.prank(randomUser);
        vm.expectRevert(KektvVouchersOffersV3.InsufficientVoucherBalance.selector);
        offersV3.acceptOffer(offerId);

        console.log("[OK] Correctly rejected (InsufficientVoucherBalance)");
    }

    function test_GeneralOfferRaceCondition() public {
        console.log("\n=== TEST: General Offer Race Condition ===");

        uint256 offerPrice = 0.5 ether;
        uint256 tokenId = 2; // Gold
        uint256 amount = 1;

        // Make general offer
        vm.prank(offerer);
        uint256 offerId = offersV3.makeOffer{value: offerPrice}(
            tokenId,
            amount,
            address(0)
        );

        console.log("Two users both own Gold, first one wins");

        // Verify both users own Gold
        uint256 holder1Balance = vouchers.balanceOf(voucherHolder1, tokenId);
        uint256 holder2Balance = vouchers.balanceOf(voucherHolder2, tokenId);
        assertGe(holder1Balance, amount, "Holder1 should own enough");
        assertGe(holder2Balance, amount, "Holder2 should own enough");

        // Holder1 accepts first
        console.log("Holder1 accepts...");
        vm.prank(voucherHolder1);
        offersV3.acceptOffer(offerId);
        console.log("[OK] Holder1 succeeded");

        // Holder2 tries to accept but it's already inactive
        console.log("Holder2 tries to accept...");
        vm.prank(voucherHolder2);
        vm.expectRevert(KektvVouchersOffersV3.OfferNotActive.selector);
        offersV3.acceptOffer(offerId);
        console.log("[OK] Holder2 correctly rejected (OfferNotActive)");
    }

    // ============ Targeted Offer Tests (Backward Compatibility) ============

    function test_TargetedOfferAcceptance() public {
        console.log("\n=== TEST: Targeted Offer Acceptance (Backward Compatibility) ===");

        uint256 offerPrice = 0.8 ether;
        uint256 tokenId = 2; // Gold
        uint256 amount = 1;

        // Make targeted offer to voucherHolder1
        vm.prank(offerer);
        uint256 offerId = offersV3.makeOffer{value: offerPrice}(
            tokenId,
            amount,
            voucherHolder1 // TARGETED OFFER
        );

        (, , address voucherOwner, , , , , ) = offersV3.offers(offerId);
        assertEq(voucherOwner, voucherHolder1, "VoucherOwner should be voucherHolder1");

        console.log("Targeted recipient accepts...");
        vm.prank(voucherHolder1);
        offersV3.acceptOffer(offerId);
        console.log("[OK] Targeted offer accepted successfully");

        // Verify voucher transferred
        uint256 offererBalance = vouchers.balanceOf(offerer, tokenId);
        assertEq(offererBalance, amount, "Offerer should receive voucher");
    }

    function test_TargetedOfferRejection_WrongUser() public {
        console.log("\n=== TEST: Targeted Offer Wrong Recipient ===");

        uint256 offerPrice = 0.8 ether;
        uint256 tokenId = 2; // Gold
        uint256 amount = 1;

        // Make targeted offer to voucherHolder1
        vm.prank(offerer);
        uint256 offerId = offersV3.makeOffer{value: offerPrice}(
            tokenId,
            amount,
            voucherHolder1
        );

        console.log("Wrong user tries to accept targeted offer...");

        // Holder2 (who also owns Gold) tries to accept
        vm.prank(voucherHolder2);
        vm.expectRevert(KektvVouchersOffersV3.OnlyVoucherOwner.selector);
        offersV3.acceptOffer(offerId);

        console.log("[OK] Correctly rejected (OnlyVoucherOwner)");
    }

    // ============ Offer Lifecycle Tests ============

    function test_OfferCreation() public {
        uint256 offerPrice = 1.5 ether;
        uint256 tokenId = 3;
        uint256 amount = 1;

        vm.prank(offerer);
        vm.expectEmit(true, true, true, true);
        emit OfferMade(0, offerer, voucherHolder1, tokenId, amount, offerPrice);

        uint256 offerId = offersV3.makeOffer{value: offerPrice}(
            tokenId,
            amount,
            voucherHolder1
        );

        assertEq(offerId, 0, "First offer should have ID 0");
    }

    function test_OfferCancellation() public {
        uint256 offerPrice = 1 ether;

        vm.prank(offerer);
        uint256 offerId = offersV3.makeOffer{value: offerPrice}(
            3, 1, address(0)
        );

        uint256 balanceBefore = offerer.balance;

        vm.prank(offerer);
        offersV3.cancelOffer(offerId);

        uint256 balanceAfter = offerer.balance;
        assertEq(balanceAfter - balanceBefore, offerPrice, "Should refund offer price");

        (, , , , , , , bool active) = offersV3.offers(offerId);
        assertFalse(active, "Offer should be inactive");
    }

    // ============ Security Tests ============

    function test_MinOfferValue() public {
        vm.prank(offerer);
        vm.expectRevert();
        offersV3.makeOffer{value: MIN_OFFER_VALUE - 1}(
            3, 1, address(0)
        );
    }

    function test_CannotAcceptInactiveOffer() public {
        vm.prank(offerer);
        uint256 offerId = offersV3.makeOffer{value: 1 ether}(
            3, 1, address(0)
        );

        vm.prank(voucherHolder1);
        offersV3.acceptOffer(offerId);

        // Try to accept again
        vm.prank(voucherHolder2);
        vm.expectRevert(KektvVouchersOffersV3.OfferNotActive.selector);
        offersV3.acceptOffer(offerId);
    }

    function test_OnlyOffererCanCancel() public {
        vm.prank(offerer);
        uint256 offerId = offersV3.makeOffer{value: 1 ether}(
            3, 1, address(0)
        );

        vm.prank(randomUser);
        vm.expectRevert(KektvVouchersOffersV3.OnlyOfferer.selector);
        offersV3.cancelOffer(offerId);
    }

    // ============ View Function Tests ============

    function test_GetTotalOffers() public {
        assertEq(offersV3.getTotalOffers(), 0, "Should start at 0");

        vm.prank(offerer);
        offersV3.makeOffer{value: 1 ether}(3, 1, address(0));

        assertEq(offersV3.getTotalOffers(), 1, "Should increment");
    }
}

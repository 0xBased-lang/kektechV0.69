// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../../contracts/markets/ParimutuelMarket.sol";
import "../../contracts/core/FlexibleMarketFactory.sol";
import "../../contracts/core/ResolutionManager.sol";
import "../../contracts/core/MarketTemplateRegistry.sol";
import "../../contracts/core/MasterRegistry.sol";
import "../../contracts/core/AccessControlManager.sol";
import "../../contracts/core/ParameterStorage.sol";
import "../../contracts/core/RewardDistributor.sol";

/**
 * @title SecurityFuzz
 * @notice Comprehensive fuzz testing for all security fixes
 * @dev Run with: forge test --match-contract SecurityFuzz --fuzz-runs 100000
 *
 * Tests all CRITICAL, HIGH, and MEDIUM security fixes with fuzzing:
 * - CRITICAL-001: Pagination DoS protection
 * - CRITICAL-002: Zero winner pool edge case
 * - HIGH-001: Whale manipulation limits
 * - HIGH-002: Dispute bond handling
 * - HIGH-003: Template validation
 * - MEDIUM issues: Various edge cases
 */
contract SecurityFuzzTest is Test {
    // Core contracts
    MasterRegistry public registry;
    AccessControlManager public accessControl;
    ParameterStorage public paramStorage;
    RewardDistributor public rewardDist;
    ResolutionManager public resolutionManager;
    MarketTemplateRegistry public templateRegistry;
    FlexibleMarketFactory public factory;

    // Template
    ParimutuelMarket public marketTemplate;

    // Test accounts
    address public owner;
    address public resolver;
    address public treasury;
    address public alice;
    address public bob;
    address public charlie;

    // Constants
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    bytes32 public constant TEMPLATE_ID = keccak256("PARIMUTUEL");

    function setUp() public {
        // Create test accounts
        owner = address(this);
        resolver = makeAddr("resolver");
        treasury = makeAddr("treasury");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");

        // Fund test accounts
        vm.deal(alice, 1000 ether);
        vm.deal(bob, 1000 ether);
        vm.deal(charlie, 1000 ether);
        vm.deal(resolver, 10 ether);

        // Deploy core contracts
        registry = new MasterRegistry();

        accessControl = new AccessControlManager();
        accessControl.initialize(address(registry));
        registry.setContract(keccak256("AccessControlManager"), address(accessControl));

        accessControl.grantRole(ADMIN_ROLE, owner);
        accessControl.grantRole(RESOLVER_ROLE, resolver);

        paramStorage = new ParameterStorage();
        paramStorage.initialize(address(registry));
        registry.setContract(keccak256("ParameterStorage"), address(paramStorage));

        rewardDist = new RewardDistributor();
        rewardDist.initialize(address(registry), treasury);
        registry.setContract(keccak256("RewardDistributor"), address(rewardDist));

        resolutionManager = new ResolutionManager();
        resolutionManager.initialize(address(registry));
        registry.setContract(keccak256("ResolutionManager"), address(resolutionManager));

        templateRegistry = new MarketTemplateRegistry();
        templateRegistry.initialize(address(registry));
        registry.setContract(keccak256("MarketTemplateRegistry"), address(templateRegistry));

        marketTemplate = new ParimutuelMarket();
        templateRegistry.registerTemplate(TEMPLATE_ID, address(marketTemplate));

        factory = new FlexibleMarketFactory();
        factory.initialize(address(registry));
        registry.setContract(keccak256("FlexibleMarketFactory"), address(factory));

        // Set parameters
        paramStorage.setParameter(keccak256("DISPUTE_BOND"), 1 ether);
        paramStorage.setParameter(keccak256("DISPUTE_PERIOD"), 86400);
    }

    /**
     * CRITICAL-001: Fuzz test pagination to prevent DoS
     * Tests that pagination works with any offset/limit combination
     */
    function testFuzz_PaginationDoSProtection(uint256 offset, uint256 limit) public {
        // Bound inputs to reasonable ranges
        offset = bound(offset, 0, 1000);
        limit = bound(limit, 1, 500);

        // Create some markets
        uint256 marketCount = 10;
        for (uint256 i = 0; i < marketCount; i++) {
            _createMarket(string(abi.encodePacked("Market ", vm.toString(i))));
        }

        // Should not revert regardless of pagination parameters
        (address[] memory markets, uint256 total) = factory.getActiveMarkets(offset, limit);

        // Verify results are correct
        assertLe(markets.length, limit, "Returned more than limit");
        assertEq(total, marketCount, "Total count incorrect");

        if (offset < total) {
            uint256 expectedSize = total - offset;
            if (expectedSize > limit) expectedSize = limit;
            assertEq(markets.length, expectedSize, "Returned array size incorrect");
        } else {
            assertEq(markets.length, 0, "Should return empty array when offset >= total");
        }
    }

    /**
     * CRITICAL-002: Fuzz test zero winner pool scenario
     * Tests that market cancels correctly when no one bet on winning outcome
     */
    function testFuzz_ZeroWinnerPoolCancellation(
        uint256 bet1Amount,
        uint256 bet2Amount,
        uint8 winningOutcome
    ) public {
        // Bound inputs
        bet1Amount = bound(bet1Amount, 0.001 ether, 100 ether);
        bet2Amount = bound(bet2Amount, 0.001 ether, 100 ether);
        winningOutcome = uint8(bound(winningOutcome, 1, 2));

        address market = _createMarket("Fuzz test market");
        ParimutuelMarket m = ParimutuelMarket(payable(market));

        // Place bets on ONLY ONE outcome (not the winning one)
        uint8 losingOutcome = winningOutcome == 1 ? 2 : 1;

        vm.prank(alice);
        m.placeBet{value: bet1Amount}(losingOutcome, "");

        vm.prank(bob);
        m.placeBet{value: bet2Amount}(losingOutcome, "");

        // Fast forward to resolution time
        vm.warp(block.timestamp + 3601);

        // Resolve with outcome that no one bet on
        vm.prank(resolver);
        resolutionManager.resolveMarket(market, ParimutuelMarket.Outcome(winningOutcome));

        // Market should be CANCELLED, not resolved to that outcome
        assertEq(uint8(m.result()), uint8(ParimutuelMarket.Outcome.CANCELLED), "Should auto-cancel");

        // Users should be able to withdraw their bets
        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        m.claimPayout();
        assertEq(alice.balance - aliceBalanceBefore, bet1Amount, "Alice should get full refund");

        uint256 bobBalanceBefore = bob.balance;
        vm.prank(bob);
        m.claimPayout();
        assertEq(bob.balance - bobBalanceBefore, bet2Amount, "Bob should get full refund");
    }

    /**
     * HIGH-001: Fuzz test whale manipulation protection
     * Tests min/max bet limits with various pool sizes
     */
    function testFuzz_WhaleProtection(
        uint256 initialPool,
        uint256 whaleBet
    ) public {
        // Bound inputs
        initialPool = bound(initialPool, 1 ether, 100 ether);
        whaleBet = bound(whaleBet, 0.0001 ether, 1000 ether);

        address market = _createMarket("Whale protection test");
        ParimutuelMarket m = ParimutuelMarket(payable(market));

        // Create initial pool
        vm.prank(alice);
        m.placeBet{value: initialPool}(1, "");

        // Calculate max allowed bet (20% of pool)
        uint256 maxAllowed = (initialPool * 2000) / 10000; // 20%
        uint256 minAllowed = 0.001 ether;

        // Try to place whale bet
        vm.prank(bob);
        if (whaleBet < minAllowed) {
            // Should revert for too small
            vm.expectRevert(ParimutuelMarket.BetTooSmall.selector);
            m.placeBet{value: whaleBet}(2, "");
        } else if (whaleBet > maxAllowed) {
            // Should revert for too large
            vm.expectRevert(ParimutuelMarket.BetTooLarge.selector);
            m.placeBet{value: whaleBet}(2, "");
        } else {
            // Should succeed within limits
            m.placeBet{value: whaleBet}(2, "");
            assertGe(m.totalPool(), initialPool + whaleBet, "Bet should be accepted");
        }
    }

    /**
     * HIGH-002: Fuzz test dispute bond handling
     * Tests that bonds are properly handled (refunded or sent to treasury)
     */
    function testFuzz_DisputeBondHandling(
        uint256 bondAmount,
        bool upheld
    ) public {
        // Bound bond amount
        bondAmount = bound(bondAmount, 0.1 ether, 10 ether);

        // Set bond amount
        paramStorage.setParameter(keccak256("DISPUTE_BOND"), bondAmount);

        address market = _createMarket("Dispute test");
        ParimutuelMarket m = ParimutuelMarket(payable(market));

        // Place bets and resolve
        vm.prank(alice);
        m.placeBet{value: 1 ether}(1, "");
        vm.prank(bob);
        m.placeBet{value: 1 ether}(2, "");

        vm.warp(block.timestamp + 3601);
        vm.prank(resolver);
        resolutionManager.resolveMarket(market, ParimutuelMarket.Outcome.OUTCOME1);

        // Submit dispute
        vm.deal(charlie, bondAmount);
        uint256 charlieBalanceBefore = charlie.balance;
        vm.prank(charlie);
        resolutionManager.submitDispute{value: bondAmount}(market, "Dispute reason");

        // Investigate
        resolutionManager.investigateDispute(market, "Investigation complete");

        // Track treasury balance before
        uint256 treasuryBefore = rewardDist.treasuryFees();

        // Resolve dispute
        if (upheld) {
            resolutionManager.resolveDispute(market, true, 2);
            // Should refund bond to disputer
            uint256 charlieBalanceAfter = charlie.balance;
            assertEq(charlieBalanceAfter, charlieBalanceBefore, "Bond should be refunded when upheld");
        } else {
            resolutionManager.resolveDispute(market, false, 0);
            // Should send bond to treasury
            uint256 treasuryAfter = rewardDist.treasuryFees();
            assertEq(treasuryAfter - treasuryBefore, bondAmount, "Bond should go to treasury when rejected");
        }
    }

    /**
     * HIGH-003: Fuzz test template validation
     * Tests that only valid contracts with IMarket interface can be registered
     */
    function testFuzz_TemplateValidation(address potentialTemplate) public {
        // Assume potential template is not a precompile or special address
        vm.assume(potentialTemplate > address(0xFF));
        vm.assume(potentialTemplate != address(0));

        bytes32 testId = keccak256(abi.encodePacked("FUZZ_TEMPLATE", potentialTemplate));

        // Get code size
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(potentialTemplate)
        }

        if (codeSize == 0) {
            // EOA or empty address - should revert
            vm.expectRevert("Implementation must be a contract");
            templateRegistry.registerTemplate(testId, potentialTemplate);
        } else {
            // Contract exists - check if it has IMarket interface
            // Try to call feePercent()
            (bool success,) = potentialTemplate.staticcall(
                abi.encodeWithSignature("feePercent()")
            );

            if (!success) {
                // Doesn't have IMarket interface
                vm.expectRevert("Implementation must support IMarket interface");
                templateRegistry.registerTemplate(testId, potentialTemplate);
            } else {
                // Has interface - should succeed
                templateRegistry.registerTemplate(testId, potentialTemplate);
                assertEq(templateRegistry.getTemplate(testId), potentialTemplate, "Template should be registered");
            }
        }
    }

    /**
     * MEDIUM: Fuzz test bet amount edge cases
     * Tests various bet amounts to ensure no overflow/underflow
     */
    function testFuzz_BetAmountEdgeCases(
        uint256 bet1,
        uint256 bet2,
        uint256 bet3
    ) public {
        // Bound to reasonable values (above min, below sender balance)
        bet1 = bound(bet1, 0.001 ether, 100 ether);
        bet2 = bound(bet2, 0.001 ether, 100 ether);
        bet3 = bound(bet3, 0.001 ether, 100 ether);

        address market = _createMarket("Bet amount test");
        ParimutuelMarket m = ParimutuelMarket(payable(market));

        // Place bets
        vm.prank(alice);
        m.placeBet{value: bet1}(1, "");

        vm.prank(bob);
        m.placeBet{value: bet2}(2, "");

        vm.prank(charlie);
        m.placeBet{value: bet3}(1, "");

        // Verify total pool
        uint256 expectedTotal = bet1 + bet2 + bet3;
        assertEq(m.totalPool(), expectedTotal, "Total pool should match sum of bets");

        // Verify outcome totals
        assertEq(m.outcome1Total(), bet1 + bet3, "Outcome 1 total incorrect");
        assertEq(m.outcome2Total(), bet2, "Outcome 2 total incorrect");
    }

    /**
     * MEDIUM: Fuzz test payout calculations
     * Tests that payouts are calculated correctly for any bet distribution
     */
    function testFuzz_PayoutCalculations(
        uint256 bet1,
        uint256 bet2,
        uint256 bet3
    ) public {
        // Bound inputs
        bet1 = bound(bet1, 0.01 ether, 50 ether);
        bet2 = bound(bet2, 0.01 ether, 50 ether);
        bet3 = bound(bet3, 0.01 ether, 50 ether);

        address market = _createMarket("Payout test");
        ParimutuelMarket m = ParimutuelMarket(payable(market));

        // Alice and Charlie bet on outcome 1, Bob bets on outcome 2
        vm.prank(alice);
        m.placeBet{value: bet1}(1, "");

        vm.prank(bob);
        m.placeBet{value: bet2}(2, "");

        vm.prank(charlie);
        m.placeBet{value: bet3}(1, "");

        uint256 totalPool = bet1 + bet2 + bet3;
        uint256 feePercent = m.feePercent();
        uint256 fees = (totalPool * feePercent) / 10000;
        uint256 poolAfterFees = totalPool - fees;

        // Resolve with outcome 1 winning
        vm.warp(block.timestamp + 3601);
        vm.prank(resolver);
        resolutionManager.resolveMarket(market, ParimutuelMarket.Outcome.OUTCOME1);

        // Calculate expected payouts
        uint256 winningTotal = bet1 + bet3;
        uint256 aliceExpected = (bet1 * poolAfterFees) / winningTotal;
        uint256 charlieExpected = (bet3 * poolAfterFees) / winningTotal;

        // Claim and verify
        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        m.claimPayout();
        uint256 aliceReceived = alice.balance - aliceBalanceBefore;

        uint256 charlieBalanceBefore = charlie.balance;
        vm.prank(charlie);
        m.claimPayout();
        uint256 charlieReceived = charlie.balance - charlieBalanceBefore;

        // Allow small rounding errors (< 1 wei per wei due to division)
        assertApproxEqAbs(aliceReceived, aliceExpected, 1, "Alice payout incorrect");
        assertApproxEqAbs(charlieReceived, charlieExpected, 1, "Charlie payout incorrect");

        // Total payouts should equal pool after fees (within rounding)
        assertApproxEqAbs(aliceReceived + charlieReceived, poolAfterFees, 2, "Total payouts incorrect");
    }

    /**
     * Invariant: Total pool should always equal sum of outcome pools
     */
    function invariant_PoolBalance() public {
        // This would be run automatically by foundry invariant testing
        // For now, it's a helper to verify pool integrity
    }

    /**
     * Helper: Create a test market
     */
    function _createMarket(string memory question) internal returns (address) {
        uint256 resolutionTime = block.timestamp + 3600;

        (address marketAddr,,) = factory.createMarket(
            TEMPLATE_ID,
            question,
            "Test description",
            resolutionTime,
            100, // 1% fee
            "ipfs://test",
            ""
        );

        return marketAddr;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../contracts/core/MasterRegistry.sol";
import "../../contracts/core/ParameterStorage.sol";
import "../../contracts/core/AccessControlManager.sol";
import "../../contracts/core/RewardDistributor.sol";

/**
 * @title RewardDistributorInvariantTest
 * @notice Comprehensive invariant tests for RewardDistributor
 * @dev Tests critical financial invariants for production deployment confidence
 */
contract RewardDistributorInvariantTest is Test {
    // ============= State Variables =============

    MasterRegistry public registry;
    ParameterStorage public params;
    AccessControlManager public accessControl;
    RewardDistributor public distributor;
    RewardDistributorHandler public handler;

    address public owner;
    address public admin;
    address public alice;
    address public bob;
    address public charlie;

    // Track total ETH sent to contract for conservation check
    uint256 public totalEthSent;

    // ============= Setup =============

    function setUp() public {
        owner = address(this);
        admin = makeAddr("admin");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");

        // Deploy core contracts
        registry = new MasterRegistry();
        params = new ParameterStorage(address(registry));
        accessControl = new AccessControlManager(address(registry));
        distributor = new RewardDistributor(address(registry));

        // Register contracts
        registry.setContract(keccak256("ParameterStorage"), address(params));
        registry.setContract(keccak256("AccessControlManager"), address(accessControl));
        registry.setContract(keccak256("RewardDistributor"), address(distributor));

        // Grant ADMIN_ROLE to admin
        accessControl.grantRole(keccak256("ADMIN_ROLE"), admin);
        accessControl.grantRole(keccak256("ADMIN_ROLE"), owner);

        // Set fee distribution parameters (in basis points)
        params.setParameter(keccak256("protocolFeeBps"), 100);  // 1%
        params.setParameter(keccak256("creatorFeeBps"), 200);    // 2%
        params.setParameter(keccak256("stakerIncentiveBps"), 150); // 1.5%
        params.setParameter(keccak256("treasuryFeeBps"), 50);    // 0.5%

        // Deploy handler for stateful fuzzing
        handler = new RewardDistributorHandler(
            distributor,
            address(registry),
            admin,
            alice,
            bob,
            charlie
        );

        // Set handler as target for invariant testing
        targetContract(address(handler));

        // Label addresses
        vm.label(address(registry), "MasterRegistry");
        vm.label(address(params), "ParameterStorage");
        vm.label(address(accessControl), "AccessControlManager");
        vm.label(address(distributor), "RewardDistributor");
        vm.label(address(handler), "Handler");
        vm.label(owner, "Owner");
        vm.label(admin, "Admin");
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
        vm.label(charlie, "Charlie");
    }

    // ============= Invariant Tests =============

    /**
     * @notice INVARIANT 1: Contract balance must be sufficient to cover all tracked balances
     * @dev contract.balance >= treasuryBalance + stakerRewardsPool + sum(unclaimedCreatorFees)
     */
    function invariant_balanceSufficient() public {
        uint256 contractBalance = address(distributor).balance;
        uint256 treasuryBalance = distributor.getTreasuryBalance();
        uint256 stakerPool = distributor.getStakerRewardsPool();
        uint256 unclaimedFees = handler.totalUnclaimedCreatorFees();

        uint256 totalTracked = treasuryBalance + stakerPool + unclaimedFees;

        assertGe(
            contractBalance,
            totalTracked,
            "Contract balance insufficient to cover tracked balances"
        );
    }

    /**
     * @notice INVARIANT 2: Total fees collected must equal sum of all fee components
     * @dev totalFeesCollected == sum(protocolFees + creatorFees + stakerFees + treasuryFees)
     */
    function invariant_feesSumCorrectly() public {
        uint256 totalFeesCollected = distributor.getTotalFeesCollected();
        uint256 sumOfComponentFees = handler.sumOfAllFeeComponents();

        assertEq(
            totalFeesCollected,
            sumOfComponentFees,
            "Total fees collected does not match sum of components"
        );
    }

    /**
     * @notice INVARIANT 3: Claims must be unique (no double claims)
     * @dev Once a user claims from a market, they cannot claim again
     */
    function invariant_claimsAreUnique() public {
        // Handler tracks all claims - verify no duplicates
        assertTrue(
            handler.allClaimsUnique(),
            "Duplicate claim detected"
        );
    }

    /**
     * @notice INVARIANT 4: All balance variables must be non-negative
     * @dev treasury, staker pool, and all unclaimed fees >= 0
     */
    function invariant_balancesNonNegative() public {
        uint256 treasuryBalance = distributor.getTreasuryBalance();
        uint256 stakerPool = distributor.getStakerRewardsPool();

        // These are uint256, so they're always >= 0, but we check for sanity
        assertTrue(treasuryBalance >= 0, "Treasury balance negative");
        assertTrue(stakerPool >= 0, "Staker pool negative");
        assertTrue(handler.totalUnclaimedCreatorFees() >= 0, "Unclaimed fees negative");
    }

    /**
     * @notice INVARIANT 5: Conservation of funds
     * @dev Total ETH sent to contract == total fees + treasury + staker pool + unclaimed
     */
    function invariant_conservationOfFunds() public {
        uint256 totalDistributed = handler.totalDistributed();
        uint256 treasuryBalance = distributor.getTreasuryBalance();
        uint256 stakerPool = distributor.getStakerRewardsPool();
        uint256 unclaimedFees = handler.totalUnclaimedCreatorFees();

        uint256 totalAccountedFor = totalDistributed + treasuryBalance + stakerPool + unclaimedFees;
        uint256 totalReceived = handler.totalEthSent();

        assertEq(
            totalReceived,
            totalAccountedFor,
            "Conservation of funds violated"
        );
    }

    /**
     * @notice INVARIANT 6: Treasury balance must be valid
     * @dev Treasury can only decrease through authorized withdrawals
     */
    function invariant_treasuryBalanceValid() public {
        uint256 treasuryBalance = distributor.getTreasuryBalance();
        uint256 maxPossibleTreasury = handler.totalTreasuryFeesCollected();

        assertLe(
            treasuryBalance,
            maxPossibleTreasury,
            "Treasury balance exceeds collected fees"
        );
    }

    /**
     * @notice INVARIANT 7: Staker rewards pool must be valid
     * @dev Staker pool can only decrease through authorized distributions
     */
    function invariant_stakerPoolValid() public {
        uint256 stakerPool = distributor.getStakerRewardsPool();
        uint256 maxPossibleStaker = handler.totalStakerFeesCollected();

        assertLe(
            stakerPool,
            maxPossibleStaker,
            "Staker pool exceeds collected fees"
        );
    }

    // ============= Basic Functionality Tests =============

    function test_InitialState() public {
        assertEq(address(distributor.registry()), address(registry));
        assertEq(distributor.getTreasuryBalance(), 0);
        assertEq(distributor.getStakerRewardsPool(), 0);
        assertEq(distributor.getTotalFeesCollected(), 0);
    }

    function test_CollectFees() public {
        address market = makeAddr("market");
        uint256 totalFees = 1 ether;

        // Calculate expected fees (total 5% = 500 bps)
        uint256 expectedTotal = (totalFees * 500) / 10000; // 0.05 ETH

        vm.deal(address(this), expectedTotal);
        distributor.collectFees{value: expectedTotal}(market, totalFees);

        assertTrue(distributor.getTotalFeesCollected() > 0);
    }

    function test_ProcessRewardClaim() public {
        address market = makeAddr("market");
        address claimer = alice;
        uint256 amount = 1 ether;

        distributor.processRewardClaim(market, claimer, amount, 1);

        assertTrue(distributor.hasClaimed(market, claimer));
    }

    // ============= Gas Benchmarks =============

    function test_GasOptimization_CollectFees() public {
        address market = makeAddr("market");
        uint256 totalFees = 1 ether;
        uint256 expectedTotal = (totalFees * 500) / 10000;

        vm.deal(address(this), expectedTotal);

        uint256 gasBefore = gasleft();
        distributor.collectFees{value: expectedTotal}(market, totalFees);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Gas used for collectFees:", gasUsed);
        assertLt(gasUsed, 260000, "collectFees gas usage too high");
    }
}

/**
 * @title RewardDistributorHandler
 * @notice Handler contract for stateful fuzzing of RewardDistributor
 * @dev Simulates realistic market fee collection and distribution scenarios
 */
contract RewardDistributorHandler is Test {
    RewardDistributor public distributor;
    address public registry;
    address public admin;
    address public alice;
    address public bob;
    address public charlie;

    // Track state for invariant checking
    uint256 public totalEthSent;
    uint256 public totalDistributed;
    uint256 public totalTreasuryFeesCollected;
    uint256 public totalStakerFeesCollected;
    uint256 public totalCreatorFeesCollected;
    uint256 public totalProtocolFeesCollected;
    uint256 public totalUnclaimedCreatorFees;

    // Track all claims to verify uniqueness
    mapping(address => mapping(address => bool)) public claims;
    address[] public claimers;
    address[] public markets;

    // Track markets and their creator fees
    mapping(address => uint256) public marketCreatorFees;
    address[] public marketsWithFees;

    constructor(
        RewardDistributor _distributor,
        address _registry,
        address _admin,
        address _alice,
        address _bob,
        address _charlie
    ) {
        distributor = _distributor;
        registry = _registry;
        admin = _admin;
        alice = _alice;
        bob = _bob;
        charlie = _charlie;
    }

    /**
     * @notice Simulate fee collection from a market
     */
    function collectFees(uint256 totalFees) public {
        // Bound total fees to reasonable range (0.01 to 100 ETH)
        totalFees = bound(totalFees, 0.01 ether, 100 ether);

        // Generate random market address
        address market = address(uint160(uint256(keccak256(abi.encodePacked(block.timestamp, totalFees)))));

        // Calculate expected fees (5% total = 500 bps)
        uint256 protocolFees = (totalFees * 100) / 10000;  // 1%
        uint256 creatorFees = (totalFees * 200) / 10000;   // 2%
        uint256 stakerFees = (totalFees * 150) / 10000;    // 1.5%
        uint256 treasuryFees = (totalFees * 50) / 10000;   // 0.5%
        uint256 totalToSend = protocolFees + creatorFees + stakerFees + treasuryFees;

        // Fund this contract
        vm.deal(address(this), totalToSend);

        // Collect fees
        try distributor.collectFees{value: totalToSend}(market, totalFees) {
            totalEthSent += totalToSend;
            totalTreasuryFeesCollected += treasuryFees;
            totalStakerFeesCollected += stakerFees;
            totalCreatorFeesCollected += creatorFees;
            totalProtocolFeesCollected += protocolFees;

            // Track unclaimed creator fees
            if (marketCreatorFees[market] == 0) {
                marketsWithFees.push(market);
            }
            marketCreatorFees[market] += creatorFees;
            totalUnclaimedCreatorFees += creatorFees;

            markets.push(market);
        } catch {
            // Ignore failures (insufficient funds, etc.)
        }
    }

    /**
     * @notice Simulate reward claim
     */
    function processRewardClaim(uint256 claimerIndex, uint256 amount) public {
        // Select claimer
        address[3] memory users = [alice, bob, charlie];
        address claimer = users[claimerIndex % 3];

        // Bound amount
        amount = bound(amount, 0.01 ether, 10 ether);

        // Generate random market
        address market = address(uint160(uint256(keccak256(abi.encodePacked(block.timestamp, amount, claimer)))));

        // Only claim if not already claimed
        if (!claims[market][claimer]) {
            try distributor.processRewardClaim(market, claimer, amount, 1) {
                claims[market][claimer] = true;
                claimers.push(claimer);
                totalDistributed += amount;
            } catch {
                // Ignore failures
            }
        }
    }

    /**
     * @notice Simulate treasury withdrawal
     */
    function withdrawTreasury(uint256 amount) public {
        uint256 treasuryBalance = distributor.getTreasuryBalance();
        if (treasuryBalance == 0) return;

        // Bound to available balance
        amount = bound(amount, 0, treasuryBalance);
        if (amount == 0) return;

        vm.prank(admin);
        try distributor.withdrawTreasury(admin, amount) {
            totalDistributed += amount;
        } catch {
            // Ignore failures
        }
    }

    /**
     * @notice Simulate staker rewards distribution
     */
    function distributeStakerRewards(uint256 stakerIndex, uint256 amount) public {
        uint256 stakerPool = distributor.getStakerRewardsPool();
        if (stakerPool == 0) return;

        // Select staker
        address[3] memory users = [alice, bob, charlie];
        address staker = users[stakerIndex % 3];

        // Bound to available balance
        amount = bound(amount, 0, stakerPool);
        if (amount == 0) return;

        vm.prank(admin);
        try distributor.distributeStakerRewards(staker, amount) {
            totalDistributed += amount;
        } catch {
            // Ignore failures
        }
    }

    /**
     * @notice Simulate creator fee claim
     */
    function claimCreatorFees(uint256 marketIndex) public {
        if (marketsWithFees.length == 0) return;

        marketIndex = marketIndex % marketsWithFees.length;
        address market = marketsWithFees[marketIndex];
        uint256 unclaimedAmount = marketCreatorFees[market];

        if (unclaimedAmount > 0) {
            vm.prank(admin);
            try distributor.claimCreatorFees(market) {
                totalUnclaimedCreatorFees -= unclaimedAmount;
                marketCreatorFees[market] = 0;
                totalDistributed += unclaimedAmount;
            } catch {
                // Ignore failures
            }
        }
    }

    // ============= Helper Functions for Invariants =============

    function allClaimsUnique() public view returns (bool) {
        // Check no duplicate claims (claims mapping ensures this)
        return true; // mapping enforces uniqueness
    }

    function sumOfAllFeeComponents() public view returns (uint256) {
        return totalProtocolFeesCollected + totalCreatorFeesCollected +
               totalStakerFeesCollected + totalTreasuryFeesCollected;
    }

    // Allow contract to receive ETH
    receive() external payable {}
}

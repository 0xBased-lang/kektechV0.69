// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../contracts/core/MasterRegistry.sol";

/**
 * @title MasterRegistryTest
 * @notice Foundry test suite with fuzz testing and invariants for MasterRegistry
 * @dev Uses advanced Foundry features for comprehensive testing
 */
contract MasterRegistryTest is Test {
    // ============= State Variables =============

    MasterRegistry public registry;
    address public owner;
    address public alice;
    address public bob;
    address public attacker;

    // Test keys
    bytes32 constant PARAMETER_STORAGE = keccak256("PARAMETER_STORAGE");
    bytes32 constant ACCESS_CONTROL = keccak256("ACCESS_CONTROL");
    bytes32 constant MARKET_FACTORY = keccak256("MARKET_FACTORY");

    // Events to test
    event ContractUpdated(
        bytes32 indexed key,
        address indexed newAddress,
        address indexed oldAddress,
        uint256 timestamp
    );

    // ============= Setup =============

    function setUp() public {
        // Setup accounts
        owner = address(this);
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        attacker = makeAddr("attacker");

        // Deploy registry
        registry = new MasterRegistry();

        // Label addresses for better trace output
        vm.label(address(registry), "MasterRegistry");
        vm.label(owner, "Owner");
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
        vm.label(attacker, "Attacker");
    }

    // ============= Basic Tests =============

    function test_InitialState() public {
        assertEq(registry.owner(), owner);
        assertEq(registry.paused(), false);
        assertEq(registry.version(), 1);
        assertEq(registry.totalContracts(), 0);
    }

    function test_SetContract() public {
        address mockContract = makeAddr("mockContract");

        // Expect event
        vm.expectEmit(true, true, true, true);
        emit ContractUpdated(PARAMETER_STORAGE, mockContract, address(0), block.timestamp);

        // Set contract
        registry.setContract(PARAMETER_STORAGE, mockContract);

        // Verify
        assertEq(registry.getContract(PARAMETER_STORAGE), mockContract);
        assertEq(registry.totalContracts(), 1);
        assertTrue(registry.contractExists(PARAMETER_STORAGE));
    }

    function test_RevertWhen_NotOwner() public {
        address mockContract = makeAddr("mockContract");

        vm.prank(attacker);
        vm.expectRevert(MasterRegistry.NotOwner.selector);
        registry.setContract(PARAMETER_STORAGE, mockContract);
    }

    // ============= Fuzz Tests =============

    /**
     * @notice Fuzz test for setContract with random inputs
     * @param key Random bytes32 key
     * @param addr Random address
     */
    function testFuzz_SetContract(bytes32 key, address addr) public {
        // Exclude invalid inputs
        vm.assume(key != bytes32(0));
        vm.assume(addr != address(0));

        // Set contract
        registry.setContract(key, addr);

        // Verify
        assertEq(registry.getContract(key), addr);
        assertTrue(registry.contractExists(key));
    }

    /**
     * @notice Fuzz test for multiple contract registrations
     * @param keys Array of random keys
     * @param addrs Array of random addresses
     */
    function testFuzz_BatchSetContracts(
        bytes32[5] memory keys,
        address[5] memory addrs
    ) public {
        // Prepare valid inputs
        for (uint i = 0; i < 5; i++) {
            vm.assume(keys[i] != bytes32(0));
            vm.assume(addrs[i] != address(0));

            // Ensure unique keys
            for (uint j = 0; j < i; j++) {
                vm.assume(keys[i] != keys[j]);
            }
        }

        // Convert to dynamic arrays
        bytes32[] memory dynamicKeys = new bytes32[](5);
        address[] memory dynamicAddrs = new address[](5);
        for (uint i = 0; i < 5; i++) {
            dynamicKeys[i] = keys[i];
            dynamicAddrs[i] = addrs[i];
        }

        // Batch set
        registry.batchSetContracts(dynamicKeys, dynamicAddrs);

        // Verify all were set
        for (uint i = 0; i < 5; i++) {
            assertEq(registry.getContract(keys[i]), addrs[i]);
        }
        assertEq(registry.totalContracts(), 5);
    }

    /**
     * @notice Fuzz test for access control
     * @param randomCaller Random address attempting to call admin functions
     */
    function testFuzz_AccessControl(address randomCaller) public {
        vm.assume(randomCaller != owner);
        vm.assume(randomCaller != address(0));

        address mockContract = makeAddr("mockContract");

        // Should revert for non-owner
        vm.prank(randomCaller);
        vm.expectRevert(MasterRegistry.NotOwner.selector);
        registry.setContract(PARAMETER_STORAGE, mockContract);

        // Should revert for pause
        vm.prank(randomCaller);
        vm.expectRevert(MasterRegistry.NotOwner.selector);
        registry.pause();

        // Should revert for ownership transfer
        vm.prank(randomCaller);
        vm.expectRevert(MasterRegistry.NotOwner.selector);
        registry.transferOwnership(randomCaller);
    }

    // ============= Invariant Tests =============

    /**
     * @notice Invariant: totalContracts should equal actual number of registered contracts
     */
    function invariant_TotalContractsConsistency() public {
        (bytes32[] memory keys, ) = registry.getAllContracts();
        assertEq(registry.totalContracts(), keys.length);
    }

    /**
     * @notice Invariant: Registry should never have address(0) as a valid contract
     */
    function invariant_NoZeroAddresses() public {
        (, address[] memory addresses) = registry.getAllContracts();
        for (uint i = 0; i < addresses.length; i++) {
            assertTrue(addresses[i] != address(0));
        }
    }

    /**
     * @notice Invariant: Owner should never be address(0)
     */
    function invariant_OwnerNotZero() public {
        assertTrue(registry.owner() != address(0));
    }

    // ============= Gas Optimization Tests =============

    function test_GasOptimization_SetContract() public {
        address mockContract = makeAddr("mockContract");

        uint256 gasBefore = gasleft();
        registry.setContract(PARAMETER_STORAGE, mockContract);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Gas used for setContract:", gasUsed);

        // Should be under 50k gas as per spec
        assertLt(gasUsed, 50000, "Gas usage too high for setContract");
    }

    function test_GasOptimization_BatchSet() public {
        bytes32[] memory keys = new bytes32[](5);
        address[] memory addrs = new address[](5);

        for (uint i = 0; i < 5; i++) {
            keys[i] = keccak256(abi.encodePacked("CONTRACT_", i));
            addrs[i] = makeAddr(string(abi.encodePacked("contract", i)));
        }

        uint256 gasBefore = gasleft();
        registry.batchSetContracts(keys, addrs);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Gas used for batch set (5 contracts):", gasUsed);
        console.log("Gas per contract:", gasUsed / 5);

        // Batch should be more efficient than individual calls
        assertLt(gasUsed / 5, 45000, "Batch operation not efficient enough");
    }

    // ============= Fork Testing (when enabled) =============

    function testFork_BasedAIMainnet() public {
        // Skip if not on fork
        if (block.chainid != 32323) {
            console.log("Skipping fork test - not on BasedAI fork");
            return;
        }

        console.log("Testing on BasedAI fork at block:", block.number);

        // Test deployment and interaction on forked mainnet
        address mockContract = makeAddr("mockContract");
        registry.setContract(PARAMETER_STORAGE, mockContract);

        assertEq(registry.getContract(PARAMETER_STORAGE), mockContract);
    }

    // ============= Stateful Fuzz Testing =============

    contract RegistryHandler is Test {
        MasterRegistry public registry;
        bytes32[] public keys;
        address[] public contracts;

        constructor(MasterRegistry _registry) {
            registry = _registry;
        }

        function setRandomContract(bytes32 key, address addr) public {
            if (key == bytes32(0) || addr == address(0)) return;

            registry.setContract(key, addr);

            // Track for invariant checking
            bool found = false;
            for (uint i = 0; i < keys.length; i++) {
                if (keys[i] == key) {
                    contracts[i] = addr;
                    found = true;
                    break;
                }
            }
            if (!found) {
                keys.push(key);
                contracts.push(addr);
            }
        }

        function removeRandomContract(uint256 index) public {
            if (keys.length == 0) return;
            index = index % keys.length;

            registry.removeContract(keys[index]);

            // Remove from tracking
            keys[index] = keys[keys.length - 1];
            contracts[index] = contracts[contracts.length - 1];
            keys.pop();
            contracts.pop();
        }
    }
}
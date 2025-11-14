// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../contracts/core/MasterRegistry.sol";
import "../../contracts/core/ParameterStorage.sol";

/**
 * @title ParameterStorageTest
 * @notice Foundry fuzz tests for ParameterStorage
 */
contract ParameterStorageTest is Test {
    // ============= State Variables =============

    MasterRegistry public registry;
    ParameterStorage public params;

    address public owner;
    address public alice;
    address public bob;
    address public attacker;

    // Test parameter keys
    bytes32 constant PROTOCOL_FEE_BPS = keccak256("PROTOCOL_FEE_BPS");
    bytes32 constant CREATOR_FEE_BPS = keccak256("CREATOR_FEE_BPS");
    bytes32 constant RESOLUTION_WINDOW = keccak256("RESOLUTION_WINDOW");
    bytes32 constant MARKET_CREATION_ACTIVE = keccak256("MARKET_CREATION_ACTIVE");

    // Events to test
    event ParameterUpdated(
        bytes32 indexed key,
        uint256 newValue,
        uint256 oldValue,
        uint256 timestamp
    );

    event GuardrailUpdated(
        bytes32 indexed key,
        uint256 newMin,
        uint256 newMax
    );

    // ============= Setup =============

    function setUp() public {
        owner = address(this);
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        attacker = makeAddr("attacker");

        // Deploy contracts
        registry = new MasterRegistry();
        params = new ParameterStorage(address(registry));

        // Register ParameterStorage
        bytes32 PARAM_KEY = keccak256("PARAMETER_STORAGE");
        registry.setContract(PARAM_KEY, address(params));

        // Label addresses for better trace output
        vm.label(address(registry), "MasterRegistry");
        vm.label(address(params), "ParameterStorage");
        vm.label(owner, "Owner");
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
        vm.label(attacker, "Attacker");
    }

    // ============= Basic Tests =============

    function test_InitialState() public {
        assertEq(address(params.registry()), address(registry));
        assertEq(params.experimentalMode(), false);
        assertEq(params.getParameterCount(), 0);
    }

    function test_SetParameter() public {
        params.setParameter(PROTOCOL_FEE_BPS, 250);
        assertEq(params.getParameter(PROTOCOL_FEE_BPS), 250);
        assertTrue(params.parameterExists(PROTOCOL_FEE_BPS));
    }

    function test_RevertWhen_UnauthorizedSetParameter() public {
        vm.prank(attacker);
        vm.expectRevert(ParameterStorage.NotAuthorized.selector);
        params.setParameter(PROTOCOL_FEE_BPS, 250);
    }

    // ============= Fuzz Tests =============

    /**
     * @notice Fuzz test for setting random parameter values
     */
    function testFuzz_SetParameter(bytes32 key, uint256 value) public {
        // Exclude zero key
        vm.assume(key != bytes32(0));

        // Set parameter
        params.setParameter(key, value);

        // Verify
        assertEq(params.getParameter(key), value);
        assertTrue(params.parameterExists(key));
    }

    /**
     * @notice Fuzz test for guardrails
     */
    function testFuzz_Guardrails(uint256 min, uint256 max, uint256 value) public {
        // Ensure valid guardrails
        vm.assume(min <= max);
        vm.assume(min < type(uint256).max);
        vm.assume(max < type(uint256).max);

        // Set guardrails
        params.setGuardrails(PROTOCOL_FEE_BPS, min, max);

        // Test values within range
        if (value >= min && value <= max) {
            params.setParameter(PROTOCOL_FEE_BPS, value);
            assertEq(params.getParameter(PROTOCOL_FEE_BPS), value);
        }
        // Test values below minimum
        else if (value < min) {
            vm.expectRevert(
                abi.encodeWithSelector(
                    ParameterStorage.ValueBelowMinimum.selector,
                    value,
                    min
                )
            );
            params.setParameter(PROTOCOL_FEE_BPS, value);
        }
        // Test values above maximum
        else if (value > max) {
            vm.expectRevert(
                abi.encodeWithSelector(
                    ParameterStorage.ValueAboveMaximum.selector,
                    value,
                    max
                )
            );
            params.setParameter(PROTOCOL_FEE_BPS, value);
        }
    }

    /**
     * @notice Fuzz test for experimental mode bypass
     */
    function testFuzz_ExperimentalModeBypass(uint256 min, uint256 max, uint256 value) public {
        // Setup guardrails
        vm.assume(min < max);
        params.setGuardrails(PROTOCOL_FEE_BPS, min, max);

        // Enable experimental mode
        params.setExperimentalMode(true);

        // Should allow ANY value
        params.setParameter(PROTOCOL_FEE_BPS, value);
        assertEq(params.getParameter(PROTOCOL_FEE_BPS), value);
    }

    /**
     * @notice Fuzz test for batch operations
     */
    function testFuzz_BatchSetParameters(uint8 count) public {
        // Limit count to reasonable number
        vm.assume(count > 0 && count <= 10);

        // Create arrays
        bytes32[] memory keys = new bytes32[](count);
        uint256[] memory values = new uint256[](count);

        // Fill arrays
        for (uint8 i = 0; i < count; i++) {
            keys[i] = keccak256(abi.encodePacked("PARAM_", i));
            values[i] = uint256(i) * 100;
        }

        // Batch set
        params.batchSetParameters(keys, values);

        // Verify all
        for (uint8 i = 0; i < count; i++) {
            assertEq(params.getParameter(keys[i]), values[i]);
        }

        assertEq(params.getParameterCount(), count);
    }

    /**
     * @notice Fuzz test for boolean parameters
     */
    function testFuzz_BoolParameter(bytes32 key, bool value) public {
        vm.assume(key != bytes32(0));

        params.setBoolParameter(key, value);
        assertEq(params.getBoolParameter(key), value);
    }

    /**
     * @notice Fuzz test for address parameters
     */
    function testFuzz_AddressParameter(bytes32 key, address value) public {
        vm.assume(key != bytes32(0));
        vm.assume(value != address(0));

        params.setAddressParameter(key, value);
        assertEq(params.getAddressParameter(key), value);
    }

    // ============= Invariant Tests =============

    /**
     * @notice Invariant: Parameter count should equal actual number of parameters
     */
    function invariant_ParameterCountAccuracy() public {
        (bytes32[] memory keys,) = params.getAllParameters();
        assertEq(params.getParameterCount(), keys.length);
    }

    /**
     * @notice Invariant: Guardrails min should always be <= max
     */
    function invariant_GuardrailsConsistency() public {
        // Check known guardrails
        (uint256 min, uint256 max) = params.getGuardrails(PROTOCOL_FEE_BPS);
        assertTrue(min <= max || (min == 0 && max == 0)); // No guardrails or valid guardrails
    }

    // ============= Gas Benchmarking =============

    function test_GasBenchmark_SetParameter() public {
        uint256 gasBefore = gasleft();
        params.setParameter(PROTOCOL_FEE_BPS, 250);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Gas used for setParameter (new):", gasUsed);
        assertTrue(gasUsed < 100000, "Set parameter gas too high");
    }

    function test_GasBenchmark_GetParameter() public {
        params.setParameter(PROTOCOL_FEE_BPS, 250);

        uint256 gasBefore = gasleft();
        uint256 value = params.getParameter(PROTOCOL_FEE_BPS);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Gas used for getParameter:", gasUsed);
        assertEq(value, 250);
        // View functions are very cheap
        assertTrue(gasUsed < 30000, "Get parameter gas too high");
    }

    function test_GasBenchmark_BatchSet() public {
        bytes32[] memory keys = new bytes32[](5);
        uint256[] memory values = new uint256[](5);

        for (uint256 i = 0; i < 5; i++) {
            keys[i] = keccak256(abi.encodePacked("PARAM_", i));
            values[i] = i * 100;
        }

        uint256 gasBefore = gasleft();
        params.batchSetParameters(keys, values);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Gas used for batch set (5 params):", gasUsed);
        console.log("Gas per parameter:", gasUsed / 5);

        // Batch should be efficient
        assertTrue(gasUsed / 5 < 80000, "Batch operation not efficient enough");
    }

    // ============= Edge Cases =============

    function test_MaxUint256Value() public {
        // Enable experimental mode
        params.setExperimentalMode(true);

        // Set max value
        params.setParameter(PROTOCOL_FEE_BPS, type(uint256).max);
        assertEq(params.getParameter(PROTOCOL_FEE_BPS), type(uint256).max);
    }

    function test_ZeroValue() public {
        params.setParameter(PROTOCOL_FEE_BPS, 0);
        assertEq(params.getParameter(PROTOCOL_FEE_BPS), 0);
    }

    function test_RevertWhen_NonExistentParameter() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                ParameterStorage.ParameterNotFound.selector,
                PROTOCOL_FEE_BPS
            )
        );
        params.getParameter(PROTOCOL_FEE_BPS);
    }
}
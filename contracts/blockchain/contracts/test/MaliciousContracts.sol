// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MaliciousContracts
 * @notice Test helper contracts for security testing
 * @dev These contracts simulate various attack scenarios
 */

/**
 * @title MaliciousRewardDistributor
 * @notice Mock RewardDistributor that always reverts
 */
contract MaliciousRewardDistributor {
    error AlwaysReverts();

    function collectFees(address, uint256) external payable {
        revert AlwaysReverts();
    }

    function getTreasuryBalance() external pure returns (uint256) {
        return 0;
    }
}

/**
 * @title GasWastingRecipient
 * @notice Contract that wastes all available gas
 */
contract GasWastingRecipient {
    uint256 private counter;

    receive() external payable {
        // Waste gas in an infinite loop
        while (gasleft() > 100) {
            counter++;
        }
    }

    fallback() external payable {
        // Waste gas in an infinite loop
        while (gasleft() > 100) {
            counter++;
        }
    }
}

/**
 * @title RevertingRecipient
 * @notice Contract that always reverts on receiving ETH
 */
contract RevertingRecipient {
    error NoAcceptingETH();

    receive() external payable {
        revert NoAcceptingETH();
    }

    fallback() external payable {
        revert NoAcceptingETH();
    }
}

/**
 * @title GasLimitChecker
 * @notice Contract that checks if gas limit is properly enforced
 */
contract GasLimitChecker {
    uint256 public lastGasReceived;
    bool public shouldRevert;

    constructor(bool _shouldRevert) {
        shouldRevert = _shouldRevert;
    }

    receive() external payable {
        lastGasReceived = gasleft();

        if (shouldRevert) {
            revert("Intentional revert");
        }
    }

    function getLastGasReceived() external view returns (uint256) {
        return lastGasReceived;
    }
}

/**
 * @title ReentrancyAttacker
 * @notice Contract that attempts reentrancy attacks
 */
contract ReentrancyAttacker {
    address public target;
    uint256 public attackCount;

    constructor(address _target) {
        target = _target;
    }

    receive() external payable {
        if (attackCount < 3 && address(target).balance > 0) {
            attackCount++;
            // Try to reenter
            (bool success,) = target.call(
                abi.encodeWithSignature("claimWinnings()")
            );
            require(success, "Reentrancy failed");
        }
    }

    function attack() external payable {
        attackCount = 0;
        (bool success,) = target.call{value: msg.value}(
            abi.encodeWithSignature("claimWinnings()")
        );
        require(success, "Initial call failed");
    }
}

/**
 * @title FrontRunningBot
 * @notice Simulates front-running MEV bot behavior
 */
contract FrontRunningBot {
    address public market;

    constructor(address _market) {
        market = _market;
    }

    function frontRun(uint8 outcome) external payable {
        // Place large bet to manipulate odds
        (bool success,) = market.call{value: msg.value}(
            abi.encodeWithSignature(
                "placeBet(uint8,bytes,uint256,uint256)",
                outcome,
                "",
                0,
                0
            )
        );
        require(success, "Front-run failed");
    }

    function sandwichAttack(
        uint8 outcome1,
        uint256 amount1,
        uint8 outcome2,
        uint256 amount2
    ) external payable {
        // Front-run
        (bool success1,) = market.call{value: amount1}(
            abi.encodeWithSignature(
                "placeBet(uint8,bytes,uint256,uint256)",
                outcome1,
                "",
                0,
                0
            )
        );
        require(success1, "Front-run failed");

        // Wait for victim transaction (simulated)

        // Back-run
        (bool success2,) = market.call{value: amount2}(
            abi.encodeWithSignature(
                "placeBet(uint8,bytes,uint256,uint256)",
                outcome2,
                "",
                0,
                0
            )
        );
        require(success2, "Back-run failed");
    }
}

/**
 * @title ConditionalReverter
 * @notice Reverts based on configured conditions
 */
contract ConditionalReverter {
    uint256 public revertAfterCalls;
    uint256 public callCount;

    constructor(uint256 _revertAfterCalls) {
        revertAfterCalls = _revertAfterCalls;
    }

    function collectFees(address, uint256) external payable {
        callCount++;
        if (callCount >= revertAfterCalls) {
            revert("Configured to revert");
        }
    }
}

/**
 * @title SlowRecipient
 * @notice Contract that uses up gas slowly
 */
contract SlowRecipient {
    mapping(uint256 => uint256) public data;
    uint256 public writeCount;

    receive() external payable {
        // Use gas by writing to storage
        for (uint256 i = 0; i < 1000 && gasleft() > 10000; i++) {
            data[writeCount++] = block.timestamp;
        }
    }
}

/**
 * @title OddManipulator
 * @notice Contract that tries to manipulate market odds
 */
contract OddManipulator {
    address public market;

    constructor(address _market) {
        market = _market;
    }

    function manipulateOdds(
        uint8 outcome,
        uint256 largeAmount,
        uint256 victimAmount
    ) external payable {
        // Place large bet to skew odds
        (bool success,) = market.call{value: largeAmount}(
            abi.encodeWithSignature(
                "placeBet(uint8,bytes,uint256,uint256)",
                outcome,
                "",
                0,
                0
            )
        );
        require(success, "Manipulation failed");

        // Small bet to profit from skewed odds
        (bool success2,) = market.call{value: victimAmount}(
            abi.encodeWithSignature(
                "placeBet(uint8,bytes,uint256,uint256)",
                outcome == 1 ? 2 : 1,
                "",
                0,
                0
            )
        );
        require(success2, "Victim bet failed");
    }
}

/**
 * @title MockRewardDistributor
 * @notice Configurable mock for testing
 */
contract MockRewardDistributor {
    bool public shouldRevert;
    uint256 public collectFeesCallCount;

    function setShouldRevert(bool _shouldRevert) external {
        shouldRevert = _shouldRevert;
    }

    function collectFees(address, uint256) external payable {
        collectFeesCallCount++;
        if (shouldRevert) {
            revert("Configured to fail");
        }
    }

    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}

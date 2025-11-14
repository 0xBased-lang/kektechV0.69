// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRewardDistributorLike {
    function collectFees(address market, uint256 amount) external payable;
}

contract RewardDistributorToggleMock is IRewardDistributorLike {
    bool public alwaysRevert;

    event CollectCalled(address market, uint256 amount);

    constructor(bool _alwaysRevert) {
        alwaysRevert = _alwaysRevert;
    }

    function setAlwaysRevert(bool v) external {
        alwaysRevert = v;
    }

    function collectFees(address market, uint256 amount) external payable override {
        if (alwaysRevert) {
            revert("mock: revert collect");
        }
        emit CollectCalled(market, amount);
    }
}



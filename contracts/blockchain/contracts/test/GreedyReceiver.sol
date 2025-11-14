// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IParimutuelMarketLike {
    function claimWinnings() external;
}

contract GreedyReceiver {
    address public lastSender;
    uint256 public timesReceived;
    bool public doRevert;

    constructor(bool _doRevert) {
        doRevert = _doRevert;
    }

    receive() external payable {
        timesReceived++;
        lastSender = msg.sender;
        if (doRevert) {
            revert("greedy: revert receive");
        }
        // else consume some gas to simulate heavy recipient
        uint256 s = 0;
        for (uint256 i = 0; i < 2000; i++) {
            s += i;
        }
        if (s == 42) {}
    }

    function claim(address market) external {
        IParimutuelMarketLike(market).claimWinnings();
    }
}



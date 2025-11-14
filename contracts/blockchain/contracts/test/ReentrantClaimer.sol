// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPariMarket {
    function claimWinnings() external;
}

contract ReentrantClaimer {
    address public market;
    bool public tryReenter;
    uint256 public received;

    constructor(address _market, bool _tryReenter) {
        market = _market;
        tryReenter = _tryReenter;
    }

    receive() external payable {
        received += msg.value;
        if (tryReenter) {
            // Attempt reentrancy: call claim again
            try IPariMarket(market).claimWinnings() {
            } catch {}
        }
    }
}

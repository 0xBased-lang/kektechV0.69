// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IParimutuelLike {
    function placeBet(uint8 outcome, bytes calldata betData, uint256 minAcceptableOdds, uint256 deadline) external payable;
    function claimWinnings() external;
    function withdrawUnclaimed() external;
}

contract TogglePlayer {
    bool public revertOnReceive;

    constructor(bool _revert) {
        revertOnReceive = _revert;
    }

    function setRevert(bool v) external {
        revertOnReceive = v;
    }

    function bet(address market, uint8 outcome) external payable {
        IParimutuelLike(market).placeBet{value: msg.value}(outcome, hex"", 0, 0);
    }

    function claim(address market) external {
        IParimutuelLike(market).claimWinnings();
    }

    function withdraw(address market) external {
        IParimutuelLike(market).withdrawUnclaimed();
    }

    receive() external payable {
        if (revertOnReceive) {
            revert("toggle: revert receive");
        }
    }
}

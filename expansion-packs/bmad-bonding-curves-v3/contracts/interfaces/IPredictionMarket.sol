// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPredictionMarket
 * @notice Interface for binary outcome prediction markets in KEKTECH 3.0
 * @dev AMM-based market with constant product formula
 */
interface IPredictionMarket {
    // ============= Enums =============

    enum Outcome { UNRESOLVED, OUTCOME1, OUTCOME2, CANCELLED }

    // ============= Structs =============

    struct MarketInfo {
        string question;
        string outcome1Name;
        string outcome2Name;
        address creator;
        uint256 createdAt;
        uint256 resolutionTime;
        Outcome result;
        uint256 totalBets;
        uint256 totalVolume;
        bool isResolved;
    }

    struct BetInfo {
        uint256 amount;
        Outcome outcome;
        uint256 timestamp;
        bool claimed;
        uint256 payout;
    }

    // ============= Events =============

    event BetPlaced(
        address indexed bettor,
        Outcome indexed outcome,
        uint256 amount,
        uint256 shares,
        uint256 timestamp
    );

    event MarketResolved(
        Outcome indexed result,
        address indexed resolver,
        uint256 timestamp
    );

    event WinningsClaimed(
        address indexed bettor,
        uint256 amount,
        uint256 timestamp
    );

    event LiquidityUpdated(
        uint256 pool1,
        uint256 pool2,
        uint256 timestamp
    );

    // ============= Errors =============

    error UnauthorizedResolver();
    error MarketNotResolved();
    error MarketAlreadyResolved();
    error InvalidOutcome();
    error InvalidBetAmount();
    error BetTooSmall();
    error BetTooLarge();
    error ResolutionTimeNotReached();
    error BettingClosed();
    error NoBetFound();
    error AlreadyClaimed();
    error NotAWinner();
    error TransferFailed();
    error InsufficientLiquidity();

    // ============= Core Functions =============

    function initialize(
        address _registry,
        string calldata _question,
        string calldata _outcome1,
        string calldata _outcome2,
        address _creator,
        uint256 _resolutionTime
    ) external;

    function placeBet(uint8 outcome, uint256 minExpectedOdds) external payable;

    function resolveMarket(Outcome result) external;

    function claimWinnings() external;

    // ============= View Functions =============

    function getMarketInfo() external view returns (MarketInfo memory);

    function getBetInfo(address bettor) external view returns (BetInfo memory);

    function getOdds() external view returns (uint256 odds1, uint256 odds2);

    function calculatePayout(address bettor) external view returns (uint256);

    function getLiquidity() external view returns (uint256 pool1, uint256 pool2);

    function canResolve() external view returns (bool);

    function hasWinnings(address bettor) external view returns (bool);

    // ============= State Variables =============

    function registry() external view returns (address);
    function creator() external view returns (address);
    function resolutionTime() external view returns (uint256);
    function result() external view returns (Outcome);
    function isResolved() external view returns (bool);
    function totalBets() external view returns (uint256);
    function totalVolume() external view returns (uint256);
}

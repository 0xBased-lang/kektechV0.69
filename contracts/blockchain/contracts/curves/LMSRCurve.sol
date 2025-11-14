// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IBondingCurve.sol";
import "../libraries/LMSRMath.sol";

/**
 * @title LMSRCurve
 * @notice LMSR (Logarithmic Market Scoring Rule) bonding curve implementation
 * @dev Wraps LMSRMath library to implement IBondingCurve interface
 *
 * LMSR Overview:
 * - Logarithmic Market Scoring Rule for prediction markets
 * - Single parameter 'b' controls market liquidity/depth
 * - Prices naturally bounded between 0 and 1
 * - Handles one-sided markets gracefully
 * - Mathematically proven market maker properties
 *
 * Parameter Format:
 * - params: Just the liquidity parameter 'b' (uint256, not packed)
 * - Typical values: 10-1000 BASED depending on market size
 * - Higher b = more liquidity, slower price movement
 *
 * Gas Costs:
 * - calculateCost: ~50-80k gas (depends on share amount)
 * - getPrices: ~30-40k gas
 *
 * Safety:
 * - Overflow protection via LMSRMath.safeExp()
 * - Maximum b value prevents unrealistic liquidity
 * - Validated via IBondingCurve interface
 */
contract LMSRCurve is IBondingCurve {
    // ============= Constants =============

    /// @notice Curve name identifier
    string public constant override curveName = "LMSRCurve";

    /// @notice Maximum liquidity parameter to prevent unrealistic markets
    /// @dev Corresponds to ~1000 BASED, reasonable upper limit
    uint256 public constant MAX_B = 1000 * 1e18;

    /// @notice Minimum liquidity parameter for viable markets
    /// @dev Below this, price movements become too volatile
    uint256 public constant MIN_B = 1 * 1e18;

    // ============= Errors =============

    error InvalidLiquidityParameter();
    error ShareAmountZero();

    // ============= Core Functions =============

    /**
     * @notice Calculate cost for buying shares using LMSR formula
     * @param params Liquidity parameter 'b' (not packed, just uint256)
     * @param currentYes Current YES shares in circulation
     * @param currentNo Current NO shares in circulation
     * @param outcome true for YES, false for NO
     * @param shares Number of shares to buy
     * @return cost Cost in wei
     * @dev Uses LMSRMath.calculateBuyCost() which implements C(q+Δq) - C(q)
     */
    function calculateCost(
        uint256 params,
        uint256 currentYes,
        uint256 currentNo,
        bool outcome,
        uint256 shares
    ) external pure override returns (uint256) {
        // Validate parameters
        if (shares == 0) revert ShareAmountZero();
        if (params < MIN_B || params > MAX_B) revert InvalidLiquidityParameter();

        // For LMSR, params is just 'b' (no packing needed)
        uint256 b = params;

        // Use LMSRMath to calculate buy cost
        // This implements: cost = C(q_yes + Δq_yes, q_no + Δq_no) - C(q_yes, q_no)
        // where C(q_yes, q_no) = b * ln(e^(q_yes/b) + e^(q_no/b))
        return LMSRMath.calculateBuyCost(b, currentYes, currentNo, outcome, shares);
    }

    /**
     * @notice Calculate refund for selling shares using LMSR formula
     * @param params Liquidity parameter 'b'
     * @param currentYes Current YES shares in circulation
     * @param currentNo Current NO shares in circulation
     * @param outcome true for YES, false for NO
     * @param shares Number of shares to sell
     * @return refund Refund amount in wei
     * @dev Uses LMSRMath.calculateSellRefund() which implements C(q) - C(q-Δq)
     */
    function calculateRefund(
        uint256 params,
        uint256 currentYes,
        uint256 currentNo,
        bool outcome,
        uint256 shares
    ) external pure override returns (uint256) {
        // Validate parameters
        if (shares == 0) revert ShareAmountZero();
        if (params < MIN_B || params > MAX_B) revert InvalidLiquidityParameter();

        // For LMSR, params is just 'b'
        uint256 b = params;

        // Use LMSRMath to calculate sell refund
        // This implements: refund = C(q_yes, q_no) - C(q_yes - Δq_yes, q_no - Δq_no)
        return LMSRMath.calculateSellRefund(b, currentYes, currentNo, outcome, shares);
    }

    /**
     * @notice Get current prices for both outcomes using LMSR formula
     * @param params Liquidity parameter 'b'
     * @param yesSupply Current YES shares
     * @param noSupply Current NO shares
     * @return yesPrice Price of YES share in basis points (0-10000, i.e., 0-100%)
     * @return noPrice Price of NO share in basis points (0-10000, i.e., 0-100%)
     * @dev Prices calculated as: p_yes = e^(q_yes/b) / (e^(q_yes/b) + e^(q_no/b))
     * @dev Prices always sum to 10000 (100%) within rounding
     * @dev Returns basis points to comply with IBondingCurve interface
     */
    function getPrices(
        uint256 params,
        uint256 yesSupply,
        uint256 noSupply
    ) external pure override returns (uint256 yesPrice, uint256 noPrice) {
        // Validate parameters
        if (params < MIN_B || params > MAX_B) revert InvalidLiquidityParameter();

        // For LMSR, params is just 'b'
        uint256 b = params;

        // Use LMSRMath to get prices (returns basis points)
        // IBondingCurve interface requires basis points (10000 = 100%)
        return LMSRMath.getPrices(b, yesSupply, noSupply);
    }

    // ============= Helper Functions =============

    /**
     * @notice Validate LMSR parameters
     * @param curveParams Liquidity parameter 'b'
     * @return valid True if parameters are valid
     * @return reason Error message if invalid
     * @dev Required by IBondingCurve interface
     */
    function validateParams(uint256 curveParams)
        external
        pure
        override
        returns (bool valid, string memory reason)
    {
        if (curveParams < MIN_B) {
            return (false, "Liquidity parameter b too small (min 1 BASED)");
        }
        if (curveParams > MAX_B) {
            return (false, "Liquidity parameter b too large (max 1000 BASED)");
        }
        return (true, "");
    }

    /**
     * @notice Get parameter encoding info
     * @return description Human-readable description
     * @dev Helper for UI/documentation
     */
    function getParamDescription() external pure returns (string memory description) {
        return "Single parameter 'b': Liquidity depth (1-1000 BASED). Higher b = more liquidity, slower price movement.";
    }

    /**
     * @notice Encode LMSR parameters (trivial for single param)
     * @param b Liquidity parameter
     * @return params Encoded parameters (just returns b)
     * @dev Included for API consistency with other curves
     */
    function encodeParams(uint256 b) external pure returns (uint256 params) {
        if (b < MIN_B || b > MAX_B) revert InvalidLiquidityParameter();
        return b;
    }

    /**
     * @notice Decode LMSR parameters (trivial for single param)
     * @param params Encoded parameters
     * @return b Liquidity parameter
     * @dev Included for API consistency with other curves
     */
    function decodeParams(uint256 params) external pure returns (uint256 b) {
        if (params < MIN_B || params > MAX_B) revert InvalidLiquidityParameter();
        return params;
    }
}

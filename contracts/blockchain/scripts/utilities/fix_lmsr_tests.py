#!/usr/bin/env python3
"""
LMSR Test Suite Fixer
Systematically fixes parameter order and function names to match IBondingCurve interface
"""

import re
import sys

def fix_test_file(input_path, output_path):
    """Fix LMSR test file to match IBondingCurve interface"""

    with open(input_path, 'r') as f:
        content = f.read()

    print("🔧 Starting systematic fix...")

    # Fix 1: name() → curveName()
    print("  ✅ Fixing name() → curveName()")
    content = content.replace('lmsr.name()', 'lmsr.curveName()')

    # Fix 2: getPrice() → getPrices() with destructuring
    # Pattern: const price = await lmsr.getPrice(yesShares, noShares, true/false, LIQUIDITY_PARAM);
    # Should be: const [yesPrice, noPrice] = await lmsr.getPrices(LIQUIDITY_PARAM, yesShares, noShares);
    print("  ✅ Fixing getPrice() → getPrices() patterns")

    # Match: await lmsr.getPrice(arg1, arg2, true/false, arg4)
    # This is complex because we need to handle both YES and NO price requests

    # For YES price requests (third param is true)
    yes_price_pattern = r'const\s+(\w+)\s*=\s*await\s+lmsr\.getPrice\(\s*([^,]+),\s*([^,]+),\s*true\s*,\s*([^)]+)\s*\)'
    def replace_yes_price(match):
        var_name = match.group(1)  # e.g., "price" or "yesPrice"
        arg1 = match.group(2).strip()  # yesShares
        arg2 = match.group(3).strip()  # noShares
        arg4 = match.group(4).strip()  # LIQUIDITY_PARAM

        # Generate destructuring with proper variable names
        return f'const [yesPrice, noPrice] = await lmsr.getPrices({arg4}, {arg1}, {arg2});\n            const {var_name} = yesPrice'

    content = re.sub(yes_price_pattern, replace_yes_price, content)

    # For NO price requests (third param is false)
    no_price_pattern = r'const\s+(\w+)\s*=\s*await\s+lmsr\.getPrice\(\s*([^,]+),\s*([^,]+),\s*false\s*,\s*([^)]+)\s*\)'
    def replace_no_price(match):
        var_name = match.group(1)  # e.g., "price" or "noPrice"
        arg1 = match.group(2).strip()  # yesShares
        arg2 = match.group(3).strip()  # noShares
        arg4 = match.group(4).strip()  # LIQUIDITY_PARAM

        return f'const [yesPrice_temp, noPrice] = await lmsr.getPrices({arg4}, {arg1}, {arg2});\n            const {var_name} = noPrice'

    content = re.sub(no_price_pattern, replace_no_price, content)

    # Fix 3: calculateCost() parameter reordering
    # OLD ORDER: (currentYes, currentNo, shares, isYes, curveParams)
    # NEW ORDER: (curveParams, currentYes, currentNo, isYes, shares)
    print("  ✅ Fixing calculateCost() parameter order")

    # This is complex - need to match multi-line function calls
    # Pattern: await lmsr.calculateCost(\n    arg1,\n    arg2,\n    arg3,\n    arg4,\n    arg5\n)

    # Simpler approach: Find all calculateCost calls and manually inspect positions
    # The pattern in the file is:
    # await lmsr.calculateCost(
    #     0,                 // position 0: currentYes (should be 1)
    #     0,                 // position 1: currentNo (should be 2)
    #     ONE_ETHER,         // position 2: shares (should be 4)
    #     true,              // position 3: isYes (should be 3)
    #     LIQUIDITY_PARAM    // position 4: curveParams (should be 0)
    # )

    # Match calculateCost with 5 parameters across multiple lines
    calculate_cost_pattern = r'lmsr\.calculateCost\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\s*\)'

    def reorder_calculate_cost(match):
        # Original order: arg1=currentYes, arg2=currentNo, arg3=shares, arg4=isYes, arg5=curveParams
        # New order: curveParams, currentYes, currentNo, isYes, shares
        arg1 = match.group(1).strip()  # currentYes → position 1
        arg2 = match.group(2).strip()  # currentNo → position 2
        arg3 = match.group(3).strip()  # shares → position 4
        arg4 = match.group(4).strip()  # isYes → position 3
        arg5 = match.group(5).strip()  # curveParams → position 0

        # New order: curveParams, currentYes, currentNo, isYes, shares
        return f'lmsr.calculateCost({arg5}, {arg1}, {arg2}, {arg4}, {arg3})'

    content = re.sub(calculate_cost_pattern, reorder_calculate_cost, content, flags=re.DOTALL)

    # Fix 4: Handle calculateRefund similarly (if present)
    calculate_refund_pattern = r'lmsr\.calculateRefund\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\s*\)'
    content = re.sub(calculate_refund_pattern, reorder_calculate_cost, content, flags=re.DOTALL)

    # Fix 5: Update expectations for getPrices (returns basis points 0-10000, not ETH)
    # This is a semantic change - prices are in basis points (5000 = 50%), not wei (0.5 ether)
    print("  ⚠️  Note: getPrices() returns basis points (0-10000), not ETH amounts")
    print("      Test expectations may need adjustment if they expect ETH values")

    # Write fixed content
    with open(output_path, 'w') as f:
        f.write(content)

    print(f"\n✅ Fixed test file written to: {output_path}")
    print("\n📋 Changes made:")
    print("  - name() → curveName()")
    print("  - getPrice() → getPrices() with destructuring")
    print("  - calculateCost() parameters reordered to match interface")
    print("  - calculateRefund() parameters reordered to match interface")

    return True

if __name__ == "__main__":
    input_file = "expansion-packs/bmad-blockchain-dev/test/bonding-curves/LMSRBondingCurve.test.js"
    output_file = "expansion-packs/bmad-blockchain-dev/test/bonding-curves/LMSRBondingCurve.test.js.fixed"

    print("🚀 LMSR Test Suite Fixer")
    print("=" * 60)

    try:
        fix_test_file(input_file, output_file)
        print("\n✅ SUCCESS! Review the fixed file and replace the original if correct.")
        print(f"\nNext steps:")
        print(f"  1. Review: {output_file}")
        print(f"  2. If correct: mv {output_file} {input_file}")
        print(f"  3. Run tests: npm test -- test/bonding-curves/LMSRBondingCurve.test.js")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        sys.exit(1)

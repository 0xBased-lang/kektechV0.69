# Manual Odds Display Validation Guide

## Quick Start

```bash
# From packages/frontend directory
npm run dev

# Open browser
http://localhost:3000/markets
```

---

## What to Validate

### 1. Empty Market Odds Display ⭐ CRITICAL

**Navigate to**: Any market with 0 bets placed

**Expected Display**:
```
YES: 2.00x (50%)
NO:  2.00x (50%)
```

**What to Check**:
- ✅ Both sides show "2.00x" multiplier
- ✅ Both sides show "(50%)" probability
- ✅ Visual bars are equal (50%/50%)
- ✅ NO "undefined" or error messages
- ✅ NO "NaN" values

**Why This Matters**:
- Empty market = 100 virtual shares per side
- Should show 2.0x odds (from VirtualLiquidity)
- If it shows anything else → BUG!

---

### 2. Market with Bets (Optional)

**Navigate to**: Market with existing bets

**Expected Display**:
```
YES: [dynamic]x ([probability]%)
NO:  [dynamic]x ([probability]%)
```

**What to Check**:
- ✅ Odds are NOT equal (unless perfectly balanced)
- ✅ Side with more bets has LOWER multiplier
- ✅ Side with fewer bets has HIGHER multiplier
- ✅ Probabilities roughly inverse of odds
- ✅ Visual bars match probabilities

**Example**:
```
If market has:
- YES: 100 shares
- NO:  50 shares

Then approximately:
- YES: 1.67x (60% probability) ← Lower odds (more bets)
- NO:  2.50x (40% probability) ← Higher odds (fewer bets)
```

---

### 3. Real-Time Updates (Advanced)

**Test Flow**:
1. Open market detail page
2. Place a bet on YES
3. Wait for transaction to confirm
4. Observe odds update

**Expected Behavior**:
- ✅ Odds update automatically after bet
- ✅ YES odds DECREASE (more bets = lower multiplier)
- ✅ NO odds INCREASE (relatively fewer bets)
- ✅ No page refresh needed (watch mode)

---

## Test Scenarios

### Scenario A: New Market (Best Case)

**Setup**: Create a brand new market

**Steps**:
1. Go to `/markets/create`
2. Create test market
3. Navigate to market detail page
4. Check odds display

**Expected**:
- YES: 2.00x (50%)
- NO:  2.00x (50%)
- Equal visual bars

**Pass Criteria**: Exactly 2.00x on both sides

---

### Scenario B: One-Sided Market

**Setup**: Market with bets only on YES

**Expected**:
- YES odds < 2.00x (e.g., 1.50x)
- NO odds > 2.00x (e.g., 2.80x)
- NO probability bar smaller than YES

**Pass Criteria**: Odds properly reflect imbalance

---

### Scenario C: Balanced Market

**Setup**: Market with equal YES and NO bets

**Expected**:
- YES: ~2.00x (~50%)
- NO:  ~2.00x (~50%)
- Visual bars roughly equal

**Pass Criteria**: Odds close to 2.0x when balanced

---

## Visual Validation Checklist

### Layout Check
- [ ] Odds displayed prominently
- [ ] Multiplier format (2.00x) is bold and large
- [ ] Probability format (50%) is smaller and gray
- [ ] Green color for YES
- [ ] Red color for NO

### Data Accuracy
- [ ] Multiplier values make sense (1.0x to 10.0x range)
- [ ] Probabilities sum to ~100% (allow small variance)
- [ ] Visual bars match probability percentages
- [ ] No negative values
- [ ] No infinity or NaN values

### Performance
- [ ] Odds load quickly (<1 second)
- [ ] No flickering or loading states
- [ ] Smooth updates when bets placed
- [ ] No console errors

---

## Common Issues & Solutions

### Issue: Shows "50% / 50%" instead of "2.00x"

**Cause**: Old code still being used
**Solution**:
```bash
# Clear Next.js cache
rm -rf .next
npm run build
npm run dev
```

### Issue: Shows "undefined" or "NaN"

**Cause**: Contract not responding or wrong address
**Solution**:
- Check `.env.local` has correct contract addresses
- Verify RPC connection: `npm run test-rpc`
- Check browser console for errors

### Issue: Odds don't update after bet

**Cause**: Watch mode not enabled
**Solution**: Already fixed - `watch: true` in hook

### Issue: Build errors

**Cause**: TypeScript compilation issues
**Solution**: Already validated - 0 errors ✅

---

## Browser Console Validation

Open Developer Tools (F12) and check:

### No Errors ✅
```javascript
// Should see NO red errors
// Contract reads should succeed
useMarketOdds: Reading getOdds() from [address]
```

### Expected Network Requests ✅
```javascript
// Should see RPC calls to:
eth_call → getOdds()
eth_call → question()
eth_call → state()
```

### Watch for Warnings ⚠️
```javascript
// Acceptable warnings:
console.log statements (linting warnings)

// NOT acceptable:
"Contract not found"
"Invalid address"
"Failed to fetch"
```

---

## Quick Validation Script

For command-line validation (optional):

```javascript
// In browser console on market page
const market = document.querySelector('[data-market-address]');
const odds = document.querySelectorAll('.text-lg.font-bold');

console.log('YES odds:', odds[0]?.textContent);
console.log('NO odds:', odds[1]?.textContent);

// Should output:
// YES odds: 2.00x
// NO odds: 2.00x
```

---

## Success Criteria Summary

### ✅ PASS if:
1. Empty market shows "2.00x (50%)" for both sides
2. No errors in browser console
3. Odds update after placing bets
4. Visual bars match probabilities
5. Multiplier format is clear and prominent

### ❌ FAIL if:
1. Empty market shows "50%" only (missing multiplier)
2. Shows "undefined", "NaN", or errors
3. Odds don't match contract values
4. Visual display is broken or unclear
5. Performance issues (slow loading, flickering)

---

## Next Steps After Validation

### If PASS ✅:
1. Document validation results
2. Take screenshot for records
3. Proceed to Vercel preview deployment
4. Continue with deployment plan

### If FAIL ❌:
1. Document exact error message
2. Check browser console logs
3. Verify contract addresses in .env.local
4. Run `npm run test-rpc` to verify RPC connection
5. Report issue for debugging

---

## Contact & Support

If you encounter issues:
1. Check `.env.local` configuration
2. Verify RPC endpoint is responding
3. Clear Next.js cache and rebuild
4. Check contract addresses match mainnet deployment

---

**Ready to validate?**

```bash
npm run dev
# Open http://localhost:3000/markets
# Follow validation checklist above
```

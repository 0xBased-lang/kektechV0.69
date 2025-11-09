# Market Operations Guide

## 🎯 Overview

This guide covers day-to-day operations for managing prediction markets on the LIVE KEKTECH system.

**Network**: BasedAI Mainnet (32323)
**Status**: Operational since November 6, 2025

---

## Creating Markets

### Quick Market Creation

```bash
# Using the live script
cd packages/blockchain
node scripts/live/create-test-market-mainnet.js

# Or via CLI with custom parameters
node scripts/live/create-market.js \
  --title "Will BTC hit $100k in 2024?" \
  --outcomes "Yes,No" \
  --duration 2592000 \  # 30 days in seconds
  --bond 0.01           # Creator bond in ETH
```

### Testing vs Production Parameters

**For Testing** (Use short durations):
```javascript
{
  marketDuration: 3600,      // 1 hour
  resolutionTime: now + 3600 + 1800,  // +30 min after close
  disputeWindow: 900         // 15 minutes
}
```

**For Production** (Use normal durations):
```javascript
{
  marketDuration: 2592000,   // 30 days
  resolutionTime: now + 2592000 + 86400,  // +24h after close
  disputeWindow: 172800      // 48 hours
}
```

### Market Creation Checklist

- [ ] Title is clear and unambiguous
- [ ] Outcomes are mutually exclusive
- [ ] Resolution time is after market close
- [ ] Creator bond paid (0.01 ETH default)
- [ ] Market appears in PROPOSED state
- [ ] Admin approves market (if required)
- [ ] Market transitions to ACTIVE

---

## Market Approval Process

### Step 1: Check Pending Markets

```bash
node scripts/live/check-markets.js --state PROPOSED
```

### Step 2: Review Market Details

```javascript
const market = await factory.getMarketInfo(marketAddress);
console.log("Creator:", market.creator);
console.log("Created:", new Date(market.createdAt * 1000));
console.log("State:", market.state);
```

### Step 3: Approve (Admin Only)

```bash
node scripts/live/admin-approve.js [marketAddress]
```

Or programmatically:
```javascript
await factory.connect(admin).adminApproveMarket(marketAddress);
```

### Step 4: Activate Market

```bash
node scripts/live/activate-market.js [marketAddress]
```

Or:
```javascript
await factory.activateMarket(marketAddress);
```

---

## Monitoring Active Markets

### Real-Time Monitoring

```bash
# Start continuous monitoring
node scripts/live/monitor-mainnet.js --interval 60

# Monitor specific market
node scripts/live/monitor-market.js [marketAddress]
```

### Key Metrics to Track

| Metric | Check Command | Alert Threshold |
|--------|---------------|-----------------|
| Total volume | `check-volume.js` | >0 |
| Active bettors | `check-bettors.js [market]` | >2 |
| Price deviation | `check-prices.js [market]` | >50% change |
| Time to close | `check-expiry.js [market]` | <24h warning |

### Market Health Indicators

**Healthy Market**:
- ✅ Multiple active bettors (>5)
- ✅ Balanced outcome probabilities (30-70%)
- ✅ Regular betting activity
- ✅ Creator bond present
- ✅ Clear resolution criteria

**Warning Signs**:
- ⚠️ One-sided betting (>90% one outcome)
- ⚠️ No activity for >24h
- ⚠️ Ambiguous resolution criteria
- ⚠️ Approaching expiry with no bets

---

## Resolution Process

### Resolution Timeline

```
Market CLOSED (expiry time reached)
    ↓
Wait for resolution buffer (24h default)
    ↓
Resolver proposes outcome
    ↓
48h dispute period begins
    ↓
If disputed → Admin investigates
If not disputed → Auto-finalize after 48h
    ↓
Market FINALIZED
    ↓
Winners can claim
```

### Step 1: Check Markets Ready for Resolution

```bash
node scripts/live/check-resolutions.js --pending
```

### Step 2: Propose Outcome (Resolver Role Required)

```bash
node scripts/live/resolve-market.js [marketAddress] [outcome]
```

Or programmatically:
```javascript
await resolutionManager.connect(resolver).proposeOutcome(
  marketAddress,
  0 // outcome index
);
```

### Step 3: Monitor Dispute Period

```bash
# Check if disputed
node scripts/live/check-disputes.js [marketAddress]

# Get time remaining in dispute period
node scripts/live/dispute-timer.js [marketAddress]
```

### Step 4: Finalize (After 48h if no dispute)

```bash
node scripts/live/finalize-market.js [marketAddress]
```

Or auto-finalize in batch:
```javascript
const pending = await resolutionManager.getPendingResolutions();
await resolutionManager.batchFinalizeResolutions(pending);
```

---

## Handling Disputes

### When a Dispute Occurs

1. **Notification**: Listen for `DisputeRaised` event
2. **Investigation**: Review market terms and actual outcome
3. **Evidence**: Gather proof of correct outcome
4. **Decision**: Admin resolves dispute

### Dispute Resolution Process

```bash
# Check disputed markets
node scripts/live/check-disputes.js --list

# Get dispute details
node scripts/live/dispute-details.js [marketAddress]

# Resolve dispute (Admin only)
node scripts/live/admin-resolve-dispute.js [marketAddress] --uphold
# or
node scripts/live/admin-resolve-dispute.js [marketAddress] --reject
```

### Dispute Decision Criteria

**Uphold Dispute** (Change outcome):
- Clear evidence resolver was wrong
- Community consensus disagrees
- External verifiable proof available

**Reject Dispute** (Keep original outcome):
- Original resolution was correct
- Challenger has no valid evidence
- Frivolous challenge

---

## Market Cancellation

### When to Cancel

- Market has fundamental flaw
- Resolution impossible to determine
- Legal/compliance issues
- Creator requests (pre-activation only)

### Cancellation Process (Admin Only)

```bash
node scripts/live/admin-cancel-market.js [marketAddress]
```

**Note**: Cancellation returns all funds to bettors. Creator bond may be forfeited depending on reason.

---

## Batch Operations

### Batch Resolution

For efficiency when resolving multiple markets:

```javascript
const markets = [market1, market2, market3];
const outcomes = [0, 1, 0];

await resolutionManager.batchProposeOutcomes(markets, outcomes);
```

### Batch Finalization

```javascript
const pendingMarkets = await resolutionManager.getPendingResolutions();
await resolutionManager.batchFinalizeResolutions(pendingMarkets);
```

**Gas Savings**: 30-50% compared to individual operations

---

## Emergency Procedures

### Emergency: Market Stuck in ACTIVE

**Symptoms**: Market should be CLOSED but still accepting bets

**Diagnosis**:
```bash
node scripts/live/diagnose-market.js [marketAddress]
```

**Solution**: Check block timestamp vs resolution time, may need admin intervention

### Emergency: Resolution Stalled

**Symptoms**: Market in RESOLVING for >48h without finalization

**Diagnosis**:
```bash
node scripts/live/check-resolution-status.js [marketAddress]
```

**Solution**: Call finalize manually or investigate dispute

### Emergency: Incorrect Resolution

**Symptoms**: Market finalized with wrong outcome

**Solution**:
- If within dispute period: Challenge resolution
- If past dispute period: Cannot change (by design)
- Learn from incident, improve resolution criteria for future markets

---

## Best Practices

### Market Creation
1. **Clear Titles**: Unambiguous, specific
2. **Binary Outcomes**: Easier to resolve (Yes/No)
3. **Verifiable**: Outcome can be objectively determined
4. **Time-Bound**: Specific end date/time
5. **Test First**: Create test market with short duration

### Resolution
1. **Wait for Buffer**: Don't rush resolution
2. **Verify Evidence**: Check multiple sources
3. **Document Decision**: Note resolution rationale
4. **Batch When Possible**: Save gas
5. **Monitor Disputes**: Respond within 24h

### Operations
1. **Regular Monitoring**: Check system daily
2. **Automate Routine**: Use scripts for common tasks
3. **Keep Records**: Log all admin actions
4. **Test Changes**: Use testnet for new procedures
5. **Backup Data**: Regular state backups

---

## Operational Scripts Reference

| Task | Script | Location |
|------|--------|----------|
| Create market | `create-market.js` | `packages/blockchain/scripts/live/` |
| Check markets | `check-markets.js` | `packages/blockchain/scripts/live/` |
| Monitor system | `monitor-mainnet.js` | `packages/blockchain/scripts/live/` |
| Resolve market | `resolve-market.js` | `packages/blockchain/scripts/live/` |
| Check balances | `check-balance.js` | `packages/blockchain/scripts/live/` |
| Admin approve | `admin-approve.js` | `packages/blockchain/scripts/live/` |

---

## Troubleshooting

### Issue: Market Creation Fails

**Check**:
- Creator bond sufficient? (0.01 ETH)
- Network connection stable?
- Gas price reasonable?
- All parameters valid?

### Issue: Cannot Activate Market

**Check**:
- Market approved by admin?
- Caller has correct role?
- Market in APPROVED state?

### Issue: Resolution Not Finalizing

**Check**:
- 48h dispute period passed?
- No active disputes?
- Market in RESOLVING state?

---

## Related Documentation

- [CONTRACTS.md](CONTRACTS.md) - Contract addresses and ABIs
- [API.md](API.md) - API reference for frontend integration
- [GETTING_STARTED.md](../GETTING_STARTED.md) - Setup and development guide
- [CURRENT_STATUS.md](../../CURRENT_STATUS.md) - Current system status

---

**Last Updated**: November 9, 2025
**System Status**: LIVE
**Network**: BasedAI Mainnet (Chain ID: 32323)

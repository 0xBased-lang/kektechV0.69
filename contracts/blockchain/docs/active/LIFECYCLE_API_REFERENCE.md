# 🔌 Lifecycle API Reference

**Version**: 1.0.0
**Last Updated**: Day 25 (Phase 5.2 Complete)
**Contract**: PredictionMarket.sol
**Interface**: IPredictionMarket.sol

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [State Queries](#state-queries)
3. [Lifecycle Transitions](#lifecycle-transitions)
4. [State-Gated Operations](#state-gated-operations)
5. [Events](#events)
6. [Errors](#errors)
7. [Usage Examples](#usage-examples)

---

## 🎯 Overview

This document provides a complete API reference for the market lifecycle system implemented in Phase 5. All functions, events, and errors are documented with their signatures, parameters, return values, and usage examples.

**Base Contract**: `PredictionMarket.sol`
**Interface**: `IPredictionMarket.sol`
**Version**: Phase 5.2 (with partial Phase 5 completion)

---

## 📊 State Queries

### `getMarketState()`

**Signature**:
```solidity
function getMarketState() external view returns (MarketState)
```

**Description**: Returns the current lifecycle state of the market.

**Parameters**: None

**Returns**:
- `MarketState` - Current market state enum value (0-5)

**State Values**:
| Value | State | Description |
|-------|-------|-------------|
| 0 | PROPOSED | Market created, awaiting approval |
| 1 | APPROVED | Approved, ready to activate |
| 2 | ACTIVE | Trading active |
| 3 | RESOLVING | Trading ended, awaiting resolution |
| 4 | DISPUTED | Outcome disputed |
| 5 | FINALIZED | Outcome final |

**Gas Cost**: ~2,100 gas (view function)

**Usage Example**:
```javascript
const state = await market.getMarketState();
console.log(`Market state: ${state}`); // 0-5

// Convert to human-readable
const stateNames = ['PROPOSED', 'APPROVED', 'ACTIVE', 'RESOLVING', 'DISPUTED', 'FINALIZED'];
console.log(`Market is ${stateNames[state]}`);
```

**Solidity Example**:
```solidity
MarketState currentState = market.getMarketState();
require(currentState == MarketState.ACTIVE, "Market not active");
```

---

### `currentState`

**Signature**:
```solidity
MarketState public currentState
```

**Description**: Public state variable storing current market state.

**Type**: `MarketState` enum (uint8 internally)

**Access**: Public read access (automatically generates getter)

**Usage Example**:
```javascript
const state = await market.currentState();
// Same as getMarketState(), but direct variable access
```

**Note**: `getMarketState()` and `currentState` return identical values. Use whichever is more convenient.

---

## 🔄 Lifecycle Transitions

### `approve()`

**Signature**:
```solidity
function approve() external onlyFactory
```

**Description**: Approves the market and transitions from PROPOSED → APPROVED.

**Access Control**: `onlyFactory` modifier (only callable by factory/deployer)

**State Requirements**:
- Current state MUST be PROPOSED
- Market MUST NOT be finalized

**State Changes**:
- Sets `currentState` to APPROVED (1)
- Records approval timestamp

**Events Emitted**:
```solidity
emit MarketApproved(uint256 timestamp);
emit MarketStateChanged(MarketState.APPROVED, uint256 timestamp);
```

**Errors**:
- `OnlyFactory()` - If caller is not factory
- `InvalidStateTransition(current, requested)` - If not in PROPOSED state

**Gas Cost**: ~45,000 gas

**Usage Example**:
```javascript
// Factory approval workflow
const tx = await market.connect(factory).approve();
await tx.wait();

// Verify state changed
const newState = await market.getMarketState();
assert(newState === 1); // APPROVED
```

**Factory Integration**:
```solidity
// Called by FlexibleMarketFactoryUnified
function approveMarket(address marketAddress) external onlyAdmin {
    IPredictionMarket(marketAddress).approve();
    // Market transitioned to APPROVED
}
```

---

### `activate()`

**Signature**:
```solidity
function activate() external onlyFactory
```

**Description**: Activates the market and transitions from APPROVED → ACTIVE, opening trading.

**Access Control**: `onlyFactory` modifier

**State Requirements**:
- Current state MUST be APPROVED
- Market MUST NOT be finalized

**State Changes**:
- Sets `currentState` to ACTIVE (2)
- Records `activatedAt` timestamp
- Enables trading operations

**Events Emitted**:
```solidity
emit MarketActivated(uint256 timestamp);
emit MarketStateChanged(MarketState.ACTIVE, uint256 timestamp);
```

**Errors**:
- `OnlyFactory()` - If caller is not factory
- `InvalidStateTransition(current, requested)` - If not in APPROVED state

**Gas Cost**: ~47,000 gas

**Usage Example**:
```javascript
// Factory activation workflow
const tx = await market.connect(factory).activate();
await tx.wait();

// Verify state changed and trading enabled
const newState = await market.getMarketState();
assert(newState === 2); // ACTIVE

// Now users can trade
await market.connect(user).placeBet(1, 0, { value: ethers.parseEther("1") });
```

**Factory Integration**:
```solidity
// Called by FlexibleMarketFactoryUnified
function activateMarket(address marketAddress) external onlyAdmin {
    IPredictionMarket(marketAddress).activate();
    // Market transitioned to ACTIVE, trading enabled
}
```

---

### `reject(string reason)`

**Signature**:
```solidity
function reject(string calldata reason) external onlyFactory
```

**Description**: Rejects the market and transitions to FINALIZED.

**Access Control**: `onlyFactory` modifier

**Parameters**:
- `reason` (string) - Human-readable rejection reason

**State Requirements**:
- Current state MUST be PROPOSED or APPROVED
- Market MUST NOT already be finalized

**State Changes**:
- Sets `currentState` to FINALIZED (5)
- Records rejection reason (in event)
- Market becomes terminal (no further transitions)

**Events Emitted**:
```solidity
emit MarketRejected(string reason);
emit MarketStateChanged(MarketState.FINALIZED, uint256 timestamp);
```

**Errors**:
- `OnlyFactory()` - If caller is not factory
- `InvalidStateTransition(current, requested)` - If not in PROPOSED/APPROVED state

**Gas Cost**: ~50,000 gas (varies with reason string length)

**Usage Example**:
```javascript
// Factory rejection workflow
const tx = await market.connect(factory).reject("Duplicate market question");
await tx.wait();

// Verify state changed
const newState = await market.getMarketState();
assert(newState === 5); // FINALIZED

// No further transitions possible
```

**Factory Integration**:
```solidity
// Called by FlexibleMarketFactoryUnified
function rejectMarket(address marketAddress, string calldata reason)
    external
    onlyAdmin
{
    IPredictionMarket(marketAddress).reject(reason);
    // Market transitioned to FINALIZED (rejected)
}
```

---

## 🛡️ State-Gated Operations

### `placeBet(uint8 outcome, uint256 minExpectedOdds)`

**Signature**:
```solidity
function placeBet(uint8 _outcome, uint256 _minExpectedOdds)
    external
    payable
    nonReentrant
    onlyWhenActive
```

**Description**: Place a bet on market outcome (only available when ACTIVE).

**Access Control**: `onlyWhenActive` modifier

**State Requirements**:
- Market MUST be in ACTIVE state
- Current time MUST be < endTime

**Parameters**:
- `_outcome` (uint8) - Outcome to bet on (1 = OUTCOME1, 2 = OUTCOME2)
- `_minExpectedOdds` (uint256) - Minimum acceptable odds (slippage protection)

**Payment**: Requires ETH sent with transaction (`msg.value`)

**Errors**:
- `MarketNotActive()` - If market is not in ACTIVE state
- `InvalidOutcome()` - If outcome is not 1 or 2
- `MarketEnded()` - If current time >= endTime
- Various betting-specific errors (insufficient funds, etc.)

**Gas Cost**: ~150,000-200,000 gas (varies with bonding curve calculations)

**Usage Example**:
```javascript
// Check market is active first
const state = await market.getMarketState();
if (state !== 2) throw new Error("Market not active");

// Place bet on OUTCOME1 (1)
const tx = await market.connect(user).placeBet(
    1,                              // outcome (OUTCOME1)
    0,                              // minExpectedOdds (0 = no slippage protection)
    { value: ethers.parseEther("1") } // 1 ETH bet
);
await tx.wait();
```

**State Enforcement**:
```solidity
modifier onlyWhenActive() {
    if (currentState != MarketState.ACTIVE) {
        revert MarketNotActive();
    }
    _;
}
```

---

### `claimWinnings()`

**Signature**:
```solidity
function claimWinnings()
    external
    nonReentrant
    onlyWhenFinalized
```

**Description**: Claim winnings after market finalization (only available when FINALIZED).

**Access Control**: `onlyWhenFinalized` modifier

**State Requirements**:
- Market MUST be in FINALIZED state
- Caller must have winning position
- Winnings not already claimed

**Errors**:
- `MarketNotFinalized()` - If market is not in FINALIZED state
- `NoWinnings()` - If caller has no winnings to claim
- `AlreadyClaimed()` - If winnings already claimed

**Gas Cost**: ~80,000-120,000 gas (varies with payout calculation)

**Usage Example**:
```javascript
// Check market is finalized first
const state = await market.getMarketState();
if (state !== 5) throw new Error("Market not finalized");

// Check if user has winnings
const payout = await market.calculatePayout(user.address);
if (payout.eq(0)) throw new Error("No winnings to claim");

// Claim winnings
const tx = await market.connect(user).claimWinnings();
await tx.wait();

console.log(`Claimed ${ethers.formatEther(payout)} ETH`);
```

**State Enforcement**:
```solidity
modifier onlyWhenFinalized() {
    if (currentState != MarketState.FINALIZED) {
        revert MarketNotFinalized();
    }
    _;
}
```

---

## 📡 Events

### MarketStateChanged

```solidity
event MarketStateChanged(
    MarketState indexed newState,
    uint256 timestamp
);
```

**Description**: Emitted on every state transition.

**Parameters**:
- `newState` (MarketState, indexed) - New market state
- `timestamp` (uint256) - Block timestamp of transition

**Use Cases**:
- Real-time UI updates
- State change history tracking
- Analytics and monitoring

**Listening Example**:
```javascript
// Listen for all state changes
market.on("MarketStateChanged", (newState, timestamp, event) => {
    console.log(`State changed to ${newState} at ${timestamp}`);

    // Update UI based on new state
    updateMarketUI(newState);

    // Log event for analytics
    trackStateChange(event);
});

// Filter for specific state
const filter = market.filters.MarketStateChanged(2); // ACTIVE only
market.on(filter, (newState, timestamp) => {
    console.log("Market activated!");
    enableTrading();
});
```

---

### MarketApproved

```solidity
event MarketApproved(uint256 timestamp);
```

**Description**: Emitted when market is approved (PROPOSED → APPROVED).

**Parameters**:
- `timestamp` (uint256) - Approval timestamp

**Usage**:
```javascript
market.on("MarketApproved", (timestamp) => {
    console.log(`Market approved at ${new Date(timestamp * 1000)}`);
    showApprovedBadge();
});
```

---

### MarketActivated

```solidity
event MarketActivated(uint256 timestamp);
```

**Description**: Emitted when market is activated (APPROVED → ACTIVE).

**Parameters**:
- `timestamp` (uint256) - Activation timestamp

**Usage**:
```javascript
market.on("MarketActivated", (timestamp) => {
    console.log("Trading now live!");
    enableTradingInterface();
    startCountdown();
});
```

---

### MarketRejected

```solidity
event MarketRejected(string reason);
```

**Description**: Emitted when market is rejected (→ FINALIZED).

**Parameters**:
- `reason` (string) - Human-readable rejection reason

**Usage**:
```javascript
market.on("MarketRejected", (reason) => {
    console.log(`Market rejected: ${reason}`);
    showRejectionNotice(reason);
    disableMarket();
});
```

---

## ❌ Errors

### InvalidStateTransition

```solidity
error InvalidStateTransition(MarketState current, MarketState requested);
```

**Description**: Thrown when an invalid state transition is attempted.

**Parameters**:
- `current` (MarketState) - Current market state
- `requested` (MarketState) - Requested target state

**Common Causes**:
- Trying to activate from PROPOSED (must approve first)
- Trying to transition from FINALIZED (terminal state)
- Attempting backwards transitions

**Handling Example**:
```javascript
try {
    await market.activate();
} catch (error) {
    if (error.errorName === "InvalidStateTransition") {
        const [current, requested] = error.errorArgs;
        console.error(`Cannot transition from ${current} to ${requested}`);

        // Show user helpful message
        if (current === 0) { // PROPOSED
            alert("Market must be approved before activation");
        }
    }
}
```

---

### MarketNotActive

```solidity
error MarketNotActive();
```

**Description**: Thrown when attempting trading operations on non-ACTIVE market.

**Common Causes**:
- placeBet() called before activation
- placeBet() called after market ended
- sellShares() called on finalized market

**Handling Example**:
```javascript
try {
    await market.placeBet(1, 0, { value: ethers.parseEther("1") });
} catch (error) {
    if (error.errorName === "MarketNotActive") {
        const state = await market.getMarketState();

        if (state < 2) {
            alert("Market not yet active");
        } else if (state > 2) {
            alert("Trading has ended");
        }
    }
}
```

---

### OnlyFactory

```solidity
error OnlyFactory();
```

**Description**: Thrown when non-factory attempts to call factory-only functions.

**Applies To**:
- `approve()`
- `activate()`
- `reject()`

**Handling Example**:
```javascript
try {
    await market.connect(user).approve();
} catch (error) {
    if (error.errorName === "OnlyFactory") {
        alert("Only factory can approve markets");
    }
}
```

---

## 💻 Usage Examples

### Complete Market Lifecycle Example

```javascript
// 1. Create market (via factory)
const tx1 = await factory.createMarket(config, { value: creatorBond });
const receipt1 = await tx1.wait();
const marketAddress = getMarketAddressFromEvent(receipt1);

const market = await ethers.getContractAt("PredictionMarket", marketAddress);

// 2. Check initial state
let state = await market.getMarketState();
assert(state === 0); // PROPOSED

// 3. Approve market
const tx2 = await market.connect(factory).approve();
await tx2.wait();

state = await market.getMarketState();
assert(state === 1); // APPROVED

// 4. Activate market
const tx3 = await market.connect(factory).activate();
await tx3.wait();

state = await market.getMarketState();
assert(state === 2); // ACTIVE

// 5. Users place bets
await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1") });
await market.connect(user2).placeBet(2, 0, { value: ethers.parseEther("2") });

// 6. Wait for end time...

// 7. Resolve market (NOT YET IMPLEMENTED)
// await market.proposeOutcome(true); // OUTCOME1 wins
// await waitForDisputeWindow();
// await market.finalize();

// 8. Claim winnings
// await market.connect(user1).claimWinnings();
```

---

### State-Based UI Rendering

```javascript
async function renderMarket(marketAddress) {
    const market = await ethers.getContractAt("PredictionMarket", marketAddress);
    const state = await market.getMarketState();

    switch(state) {
        case 0: // PROPOSED
            return (
                <div className="market-proposed">
                    <Badge color="yellow">Pending Approval</Badge>
                    <p>This market is awaiting admin approval</p>
                </div>
            );

        case 1: // APPROVED
            return (
                <div className="market-approved">
                    <Badge color="blue">Approved</Badge>
                    <p>Market approved, awaiting activation</p>
                </div>
            );

        case 2: // ACTIVE
            const endTime = await market.endTime();
            return (
                <div className="market-active">
                    <Badge color="green">Live Trading</Badge>
                    <Countdown endTime={endTime} />
                    <TradingInterface market={market} />
                </div>
            );

        case 3: // RESOLVING
            return (
                <div className="market-resolving">
                    <Badge color="orange">Resolving</Badge>
                    <p>Trading ended, awaiting outcome</p>
                    <DisputeInterface market={market} />
                </div>
            );

        case 4: // DISPUTED
            return (
                <div className="market-disputed">
                    <Badge color="red">Under Review</Badge>
                    <p>Outcome disputed, admin reviewing</p>
                </div>
            );

        case 5: // FINALIZED
            return (
                <div className="market-finalized">
                    <Badge color="gray">Finalized</Badge>
                    <FinalOutcome market={market} />
                    <ClaimInterface market={market} />
                </div>
            );
    }
}
```

---

### Real-Time Event Monitoring

```javascript
// Set up event listeners for all lifecycle events
function setupLifecycleMonitoring(market) {
    // All state changes
    market.on("MarketStateChanged", (newState, timestamp) => {
        logStateChange(newState, timestamp);
        updateUI(newState);
    });

    // Specific events
    market.on("MarketApproved", (timestamp) => {
        notifyUser("Market approved!", "success");
    });

    market.on("MarketActivated", (timestamp) => {
        notifyUser("Trading is now live!", "success");
        enableTradingUI();
    });

    market.on("MarketRejected", (reason) => {
        notifyUser(`Market rejected: ${reason}`, "error");
        disableMarket();
    });
}
```

---

## 📚 See Also

- [MARKET_LIFECYCLE.md](./MARKET_LIFECYCLE.md) - Comprehensive lifecycle documentation
- [MARKET_LIFECYCLE_DIAGRAM.md](./MARKET_LIFECYCLE_DIAGRAM.md) - Visual state diagrams
- `contracts/core/PredictionMarket.sol` - Implementation
- `contracts/interfaces/IPredictionMarket.sol` - Interface definition
- `test/hardhat/PredictionMarketLifecycle.test.js` - Test suite

---

**API Version**: 1.0.0
**Last Updated**: Day 25 (Phase 5.2 Complete)
**Status**: ✅ Production Ready (implemented transitions)

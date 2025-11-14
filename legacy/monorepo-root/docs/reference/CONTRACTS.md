# Live Contract Reference

## 🟢 Deployed Contracts - BasedAI Mainnet

**Deployment Date**: November 6, 2025
**Network**: BasedAI (Chain ID: 32323)
**Status**: LIVE AND OPERATIONAL

### Core Contracts

| Contract | Address | Purpose | Gas Cost |
|----------|---------|---------|----------|
| VersionedRegistry | [See contracts.json] | Version management, contract registry | <50k per operation |
| FlexibleMarketFactoryUnified | [See contracts.json] | Market creation via EIP-1167 clones | 687k per market |
| PredictionMarket (Template) | [See contracts.json] | Market logic template | N/A (template) |
| ParameterStorage | [See contracts.json] | Global configuration parameters | <30k per update |
| AccessControlManager | [See contracts.json] | Role-based access control | <40k per operation |
| ResolutionManager | [See contracts.json] | Market resolution and disputes | ~150k per resolution |
| RewardDistributor | [See contracts.json] | Fee distribution logic | <80k per claim |
| LMSRCurve | [See contracts.json] | LMSR bonding curve implementation | View only |

**Note**: Exact addresses are in `/deployments/basedai-mainnet/contracts.json`

---

## Contract Interactions

### 1. VersionedRegistry

**Purpose**: Central registry for all contract addresses and versions

**Key Functions**:
```solidity
// Get current contract address
function getContract(bytes32 key) public view returns (address)

// Set/upgrade contract (ADMIN only)
function setContract(bytes32 key, address contractAddress, uint256 version) public

// Get specific version
function getContractVersion(bytes32 key, uint256 version) public view returns (address)
```

**Common Keys**:
- `keccak256("FlexibleMarketFactoryUnified")`
- `keccak256("PredictionMarketTemplate")`
- `keccak256("ParameterStorage")`
- `keccak256("AccessControlManager")`
- `keccak256("ResolutionManager")`
- `keccak256("RewardDistributor")`

### 2. FlexibleMarketFactoryUnified

**Purpose**: Create new prediction markets using EIP-1167 minimal proxy pattern

**Key Functions**:
```solidity
// Create a new market
function createMarket(
    string memory title,
    string memory description,
    string memory imageUrl,
    string[] memory outcomes,
    string memory category,
    string memory additionalInfo,
    uint256 resolutionTime
) external payable returns (address)

// Admin functions
function adminApproveMarket(address market) external
function activateMarket(address market) external
function setDefaultCurve(address curve) external
```

**Market Creation Flow**:
1. Call `createMarket()` with bond (0.01 ETH default)
2. Market created in PROPOSED state
3. Admin calls `adminApproveMarket()`
4. Factory calls `activateMarket()` → ACTIVE state
5. Users can now place bets

### 3. PredictionMarket

**Purpose**: Individual market logic (deployed as clones)

**Key Functions**:
```solidity
// Place a bet
function placeBet(uint256 outcome, uint256 minShares) external payable

// Get current price
function getCurrentPrice(uint256 outcome) external view returns (uint256)

// Claim winnings (after resolution)
function claimWinnings() external

// View functions
function getMarketState() external view returns (MarketState)
function getTotalShares(uint256 outcome) external view returns (uint256)
```

**Market States**:
- `PROPOSED`: Just created, awaiting approval
- `APPROVED`: Approved but not active
- `ACTIVE`: Open for betting
- `CLOSED`: Betting closed, awaiting resolution
- `RESOLVING`: Resolution proposed
- `RESOLVED`: Outcome determined
- `FINALIZED`: Rewards distributed
- `DISPUTED`: Under dispute
- `CANCELLED`: Market cancelled

### 4. ParameterStorage

**Purpose**: Store global system parameters

**Key Parameters**:
```solidity
MIN_MARKET_DURATION = 1 hours
MAX_MARKET_DURATION = 180 days
RESOLUTION_BUFFER_TIME = 24 hours
DISPUTE_PERIOD = 48 hours
MIN_CREATOR_BOND = 0.01 ether
PROTOCOL_FEE_PERCENTAGE = 200 (2%)
CREATOR_FEE_PERCENTAGE = 100 (1%)
RESOLVER_FEE_PERCENTAGE = 50 (0.5%)
MIN_BET_AMOUNT = 0.001 ether
```

### 5. AccessControlManager

**Purpose**: Manage roles and permissions

**Roles**:
- `DEFAULT_ADMIN_ROLE`: Full control
- `MARKET_ADMIN_ROLE`: Approve/reject markets
- `PARAMETER_ADMIN_ROLE`: Update parameters
- `RESOLVER_ROLE`: Resolve markets
- `EMERGENCY_ROLE`: Emergency functions

**Key Functions**:
```solidity
function grantRole(bytes32 role, address account) external
function revokeRole(bytes32 role, address account) external
function hasRole(bytes32 role, address account) public view returns (bool)
```

### 6. ResolutionManager

**Purpose**: Handle market resolution and disputes

**Key Functions**:
```solidity
// Propose outcome
function proposeOutcome(address market, uint256 outcome) external

// Challenge resolution
function challengeResolution(address market) external payable

// Finalize (after dispute period)
function finalizeResolution(address market) external

// Batch operations
function batchProposeOutcomes(address[] memory markets, uint256[] memory outcomes) external
function batchFinalizeResolutions(address[] memory markets) external
```

### 7. RewardDistributor

**Purpose**: Distribute fees and rewards

**Key Functions**:
```solidity
// Claim rewards
function claimResolverRewards() external
function claimProtocolFees() external

// View balances
function getResolverBalance(address resolver) external view returns (uint256)
function getProtocolFeeBalance() external view returns (uint256)
```

### 8. LMSRCurve

**Purpose**: LMSR (Logarithmic Market Scoring Rule) pricing

**Key Functions**:
```solidity
// Calculate bet cost
function calculateCost(
    uint256[] memory currentShares,
    uint256 outcomeIndex,
    uint256 shares,
    bytes memory params
) external pure returns (uint256)

// Get current price
function getPrice(
    uint256[] memory currentShares,
    uint256 outcomeIndex,
    bytes memory params
) external pure returns (uint256)
```

---

## Common Integration Patterns

### Creating a Market (JavaScript/ethers.js)

```javascript
const factory = new ethers.Contract(factoryAddress, factoryABI, signer);

const tx = await factory.createMarket(
    "Will BTC hit $100k in 2024?",
    "A prediction on Bitcoin price",
    "https://example.com/image.png",
    ["Yes", "No"],
    "Crypto",
    "{}",
    Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    { value: ethers.parseEther("0.01") } // Bond
);

const receipt = await tx.wait();
const marketAddress = receipt.logs[0].args.marketAddress;
```

### Placing a Bet

```javascript
const market = new ethers.Contract(marketAddress, marketABI, signer);

// Bet 0.1 ETH on outcome 0 (Yes)
await market.placeBet(
    0, // outcome index
    0, // minimum shares (0 = any amount)
    { value: ethers.parseEther("0.1") }
);
```

### Claiming Winnings

```javascript
// After market is FINALIZED
await market.claimWinnings();
```

---

## Gas Optimization Tips

1. **Batch Operations**: Use batch functions when possible
2. **Minimize State Changes**: Group related operations
3. **Use Events**: Listen to events instead of polling
4. **Cache Registry Lookups**: Contract addresses don't change often

---

## Security Considerations

1. **All markets are immutable**: Once created, market logic cannot be changed
2. **Time-based transitions**: State changes depend on block timestamps
3. **Reentrancy protection**: All payment functions are protected
4. **Access control**: Admin functions require specific roles

---

## Contract Verification

All contracts are verified on BasedAI Explorer:
- Explorer: https://explorer.basedai.com
- Verification status: [deployments/basedai-mainnet/verification.json]

---

## ABIs and Interfaces

Find contract ABIs in:
- `/packages/frontend/lib/contracts/abis/`
- `/packages/blockchain/artifacts/contracts/`

---

**Last Updated**: November 8, 2025
**Network Status**: LIVE
**Test Coverage**: 100% (320/320 tests passing)
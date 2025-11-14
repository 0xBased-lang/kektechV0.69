# KEKTECH API Reference

## 🔗 Live System API

**Network**: BasedAI Mainnet (Chain ID: 32323)
**RPC**: https://rpc.basedai.com
**Explorer**: https://explorer.basedai.com

**Contract Addresses**: [deployments/basedai-mainnet/contracts.json](/deployments/basedai-mainnet/contracts.json)

---

## Quick Start

### Setup

```javascript
import { ethers } from 'ethers';

// Connect to BasedAI
const provider = new ethers.JsonRpcProvider('https://rpc.basedai.com');
const signer = new ethers.Wallet(privateKey, provider);

// Load contract addresses
const addresses = require('./deployments/basedai-mainnet/contracts.json');

// Create contract instances
const factory = new ethers.Contract(
  addresses.FlexibleMarketFactoryUnified,
  factoryABI,
  signer
);
```

---

## Core Contracts API

### VersionedRegistry

**Address**: See contracts.json
**Purpose**: Contract registry and version management

#### Read Functions

```javascript
// Get latest contract address
function getContract(bytes32 key) external view returns (address);

// Example
const factoryAddress = await registry.getContract(ethers.id("FlexibleMarketFactoryUnified"));
```

```javascript
// Get specific version
function getContractVersion(bytes32 key, uint256 version) external view returns (address);

// Example - Get v1 of template
const templateV1 = await registry.getContractVersion(
  ethers.id("PredictionMarketTemplate"),
  1
);
```

```javascript
// Get latest version number
function getLatestVersion(bytes32 key) external view returns (uint256);

// Example
const latestVersion = await registry.getLatestVersion(ethers.id("LMSRCurve"));
```

#### Write Functions (ADMIN only)

```javascript
// Register new contract version
function setContract(
  bytes32 key,
  address contractAddress,
  uint256 version
) external;

// Example
await registry.setContract(
  ethers.id("LMSRCurve"),
  newCurveAddress,
  2 // version 2
);
```

---

### FlexibleMarketFactoryUnified

**Address**: See contracts.json
**Purpose**: Create and manage prediction markets

#### Read Functions

```javascript
// Get all markets
function getAllMarkets() external view returns (address[] memory);

// Example
const allMarkets = await factory.getAllMarkets();
console.log(`Total markets: ${allMarkets.length}`);
```

```javascript
// Get markets by state
function getMarketsByState(MarketState state) external view returns (address[] memory);

// Example - Get all active markets
const activeMarkets = await factory.getMarketsByState(2); // 2 = ACTIVE
```

```javascript
// Get market info
function getMarketInfo(address market) external view returns (
  address creator,
  uint256 createdAt,
  MarketState state
);

// Example
const [creator, createdAt, state] = await factory.getMarketInfo(marketAddress);
```

#### Write Functions

```javascript
// Create a market
function createMarket(
  string memory title,
  string memory description,
  string memory imageUrl,
  string[] memory outcomes,
  string memory category,
  string memory additionalInfo,
  uint256 resolutionTime
) external payable returns (address);

// Example
const tx = await factory.createMarket(
  "Will BTC hit $100k in 2024?",
  "Bitcoin price prediction",
  "https://example.com/btc.png",
  ["Yes", "No"],
  "Crypto",
  "{}",
  Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  { value: ethers.parseEther("0.01") } // Creator bond
);

const receipt = await tx.wait();
const marketAddress = receipt.logs[0].args.marketAddress;
```

```javascript
// Admin approve market
function adminApproveMarket(address market) external; // MARKET_ADMIN_ROLE

// Example
await factory.adminApproveMarket(marketAddress);
```

```javascript
// Activate market
function activateMarket(address market) external; // After approval

// Example
await factory.activateMarket(marketAddress);
```

---

### PredictionMarket

**Address**: Individual market addresses from factory
**Purpose**: Individual market logic and betting

#### Read Functions

```javascript
// Get market state
function getMarketState() external view returns (MarketState);

// Example
const state = await market.getMarketState();
// 0=PROPOSED, 1=APPROVED, 2=ACTIVE, 3=CLOSED, etc.
```

```javascript
// Get current price for outcome
function getCurrentPrice(uint256 outcome) external view returns (uint256);

// Example - Price for outcome 0 (Yes)
const price = await market.getCurrentPrice(0);
console.log(`Price: ${ethers.formatEther(price)} BASED`);
```

```javascript
// Get total shares for outcome
function getTotalShares(uint256 outcome) external view returns (uint256);

// Example
const shares = await market.getTotalShares(0);
```

```javascript
// Get user shares
function getUserShares(address user, uint256 outcome) external view returns (uint256);

// Example
const myShares = await market.getUserShares(userAddress, 0);
```

```javascript
// Check if user can claim
function canClaim(address user) external view returns (bool, uint256);

// Example
const [canClaim, amount] = await market.canClaim(userAddress);
if (canClaim) {
  console.log(`Can claim: ${ethers.formatEther(amount)} BASED`);
}
```

#### Write Functions

```javascript
// Place a bet
function placeBet(uint256 outcome, uint256 minShares) external payable;

// Example - Bet 0.1 ETH on outcome 0
const tx = await market.placeBet(
  0, // outcome index
  0, // minimum shares (0 = any amount)
  { value: ethers.parseEther("0.1") }
);

const receipt = await tx.wait();
const sharesReceived = receipt.logs[0].args.shares;
```

```javascript
// Claim winnings
function claimWinnings() external;

// Example
const tx = await market.claimWinnings();
await tx.wait();
console.log("Winnings claimed!");
```

---

### ResolutionManager

**Address**: See contracts.json
**Purpose**: Market resolution and disputes

#### Read Functions

```javascript
// Get pending resolutions
function getPendingResolutions() external view returns (address[] memory);

// Example
const pending = await resolutionManager.getPendingResolutions();
```

```javascript
// Get disputed resolutions
function getDisputedResolutions() external view returns (address[] memory);

// Example
const disputed = await resolutionManager.getDisputedResolutions();
```

```javascript
// Check if market is resolved
function isResolved(address market) external view returns (bool);

// Example
const resolved = await resolutionManager.isResolved(marketAddress);
```

#### Write Functions

```javascript
// Propose outcome (RESOLVER_ROLE)
function proposeOutcome(address market, uint256 outcome) external;

// Example
await resolutionManager.proposeOutcome(marketAddress, 0); // Outcome 0 wins
```

```javascript
// Challenge resolution
function challengeResolution(address market) external payable;

// Example - Challenge with dispute bond
await resolutionManager.challengeResolution(marketAddress, {
  value: ethers.parseEther("0.01")
});
```

```javascript
// Finalize resolution (after dispute period)
function finalizeResolution(address market) external;

// Example
await resolutionManager.finalizeResolution(marketAddress);
```

```javascript
// Batch propose outcomes
function batchProposeOutcomes(
  address[] memory markets,
  uint256[] memory outcomes
) external;

// Example - Resolve 3 markets at once
await resolutionManager.batchProposeOutcomes(
  [market1, market2, market3],
  [0, 1, 0] // outcomes
);
```

---

### LMSRCurve

**Address**: See contracts.json
**Purpose**: LMSR pricing calculations (VIEW ONLY)

#### Read Functions

```javascript
// Calculate cost of buying shares
function calculateCost(
  uint256[] memory currentShares,
  uint256 outcomeIndex,
  uint256 shares,
  bytes memory params
) external pure returns (uint256);

// Example
const currentShares = [
  ethers.parseEther("100"), // Outcome 0 shares
  ethers.parseEther("80")   // Outcome 1 shares
];

const params = ethers.AbiCoder.defaultAbiCoder().encode(
  ["uint256"],
  [ethers.parseEther("100")] // b parameter
);

const cost = await lmsrCurve.calculateCost(
  currentShares,
  0, // buy outcome 0
  ethers.parseEther("10"), // 10 shares
  params
);

console.log(`Cost: ${ethers.formatEther(cost)} BASED`);
```

```javascript
// Get current price
function getPrice(
  uint256[] memory currentShares,
  uint256 outcomeIndex,
  bytes memory params
) external pure returns (uint256);

// Example
const price = await lmsrCurve.getPrice(currentShares, 0, params);
console.log(`Price: ${ethers.formatEther(price)} BASED per share`);
```

---

## Event Listening

### Key Events

```javascript
// Factory Events
event MarketCreated(
  address indexed market,
  address indexed creator,
  string title
);

event MarketStateChanged(
  address indexed market,
  MarketState oldState,
  MarketState newState
);

// Market Events
event BetPlaced(
  address indexed user,
  uint256 outcome,
  uint256 amount,
  uint256 shares
);

event WinningsClaimed(
  address indexed user,
  uint256 amount
);

// Resolution Events
event OutcomeProposed(
  address indexed market,
  uint256 outcome,
  address resolver
);

event ResolutionFinalized(
  address indexed market,
  uint256 outcome
);

event DisputeRaised(
  address indexed market,
  address challenger,
  uint256 bond
);
```

### Listen for Events

```javascript
// Listen for new markets
factory.on("MarketCreated", (market, creator, title) => {
  console.log(`New market: ${title}`);
  console.log(`Address: ${market}`);
  console.log(`Creator: ${creator}`);
});

// Listen for bets on specific market
market.on("BetPlaced", (user, outcome, amount, shares) => {
  console.log(`${user} bet ${ethers.formatEther(amount)} on outcome ${outcome}`);
  console.log(`Received ${ethers.formatEther(shares)} shares`);
});

// Listen for resolutions
resolutionManager.on("ResolutionFinalized", (market, outcome) => {
  console.log(`Market ${market} resolved to outcome ${outcome}`);
});
```

### Query Historical Events

```javascript
// Get all markets created in last 7 days
const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
const currentBlock = await provider.getBlockNumber();
const blockNumber7DaysAgo = currentBlock - (7 * 24 * 60 * 60 / 2); // Approx

const filter = factory.filters.MarketCreated();
const events = await factory.queryFilter(filter, blockNumber7DaysAgo, 'latest');

console.log(`Markets created in last 7 days: ${events.length}`);
```

---

## Error Handling

### Common Errors

```javascript
// Market not active
error MarketNotActive();

// Insufficient bet amount
error InvalidBetAmount();

// Market already resolved
error MarketAlreadyResolved();

// Unauthorized
error UnauthorizedAccess();

// Invalid state transition
error InvalidStateTransition();
```

### Example Error Handling

```javascript
try {
  await market.placeBet(0, 0, { value: ethers.parseEther("0.1") });
} catch (error) {
  if (error.message.includes("MarketNotActive")) {
    console.error("Market is not active for betting");
  } else if (error.message.includes("InvalidBetAmount")) {
    console.error("Bet amount too small");
  } else {
    console.error("Unknown error:", error);
  }
}
```

---

## Gas Estimation

### Estimate Before Transaction

```javascript
// Estimate gas for market creation
const gasEstimate = await factory.createMarket.estimateGas(
  "Test Market",
  "Description",
  "",
  ["Yes", "No"],
  "Test",
  "{}",
  futureTimestamp,
  { value: ethers.parseEther("0.01") }
);

console.log(`Estimated gas: ${gasEstimate.toString()}`);

// Add 20% buffer
const gasLimit = gasEstimate * 120n / 100n;
```

---

## TypeScript SDK (Coming Soon)

```typescript
import { KEKTECHClient } from '@kektech/sdk';

// Simple client
const client = new KEKTECHClient({
  network: 'basedai',
  signer: wallet
});

// Create market
const market = await client.createMarket({
  title: "Will BTC hit $100k?",
  outcomes: ["Yes", "No"],
  duration: 30 * 24 * 60 * 60 // 30 days
});

// Place bet
await market.bet({
  outcome: 0,
  amount: "0.1"
});
```

---

## Rate Limits & Best Practices

### RPC Rate Limits
- BasedAI RPC: No official limits (use responsibly)
- Recommended: Max 10 req/sec per IP

### Best Practices
1. **Cache contract addresses** from registry
2. **Batch read operations** when possible
3. **Use events** instead of polling
4. **Estimate gas** before transactions
5. **Handle errors** gracefully

---

## Testing

### Using Hardhat

```javascript
// hardhat.config.js
module.exports = {
  networks: {
    basedai: {
      url: "https://rpc.basedai.com",
      chainId: 32323,
      accounts: [process.env.PRIVATE_KEY]
    },
    basedaiFork: {
      url: "http://localhost:8545", // Hardhat fork
      chainId: 32323
    }
  }
};

// Start fork
npx hardhat node --fork https://rpc.basedai.com

// Run tests on fork
npx hardhat test --network basedaiFork
```

---

**Last Updated**: November 8, 2025
**Network**: BasedAI Mainnet (32323)
**Status**: LIVE
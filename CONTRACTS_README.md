# 🔧 KEKTV Offers - Smart Contract Development

This directory contains smart contracts for the KEKTV Vouchers Offers system.

---

## 📁 Structure

```
contracts/
└── KektvVouchersOffers.sol     # Main offers contract

scripts/
└── deploy-kektv-offers.js      # Deployment script

test/
└── (tests will be added)

hardhat.config.js                # Hardhat configuration
.env.contracts.example           # Environment variables template
```

---

## 🚀 Setup

### 1. Install Dependencies

Already done! ✅

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv
```

### 2. Configure Environment

Copy `.env.contracts.example` to `.env`:

```bash
cp .env.contracts.example .env
```

Edit `.env` and add your private key:

```env
PRIVATE_KEY=your_private_key_here
BASEDAI_RPC_URL=https://mainnet.basedaibridge.com/rpc
```

**⚠️ SECURITY**: Never commit `.env` file! It's already in `.gitignore`.

---

## 🔨 Compilation

### Compile Contracts

**Note**: Hardhat requires Node.js 18 or 20 (not 23). If you have Node 23:

```bash
# Option 1: Use nvm
nvm use 20
npx hardhat compile

# Option 2: Deploy on VPS with correct Node version
```

Expected output:
```
✅ Compiled 1 Solidity file successfully
```

---

## 🧪 Testing

### Run Tests

```bash
npx hardhat test
```

### Run Tests with Coverage

```bash
npx hardhat coverage
```

---

## 🚀 Deployment

### Deploy to BasedAI Mainnet

```bash
# Make sure .env is configured with your PRIVATE_KEY
npx hardhat run scripts/deploy-kektv-offers.js --network basedai
```

Expected output:
```
✅ DEPLOYMENT SUCCESSFUL!
═══════════════════════════════════════════
📍 KektvVouchersOffers: 0x...
═══════════════════════════════════════════
```

### Verify on Block Explorer

```bash
npx hardhat verify --network basedai DEPLOYED_CONTRACT_ADDRESS "0x7FEF981beE047227f848891c6C9F9dad11767a48" "0x62E8D022CAf673906e62904f7BB5ae467082b546" "1000000000000000"
```

---

## 📋 Contract Overview

### KektvVouchersOffers.sol

**Purpose**: Decentralized offers system for KEKTV ERC-1155 vouchers

**Key Features**:
- ✅ Make offers using TECH tokens
- ✅ Accept/reject offers as voucher owner
- ✅ Cancel offers as offerer
- ✅ Escrow system (funds held in contract)
- ✅ Supports voucher amounts/quantities
- ✅ Pausable for emergencies
- ✅ Minimum offer values

**Constructor Parameters**:
- `_vouchersContract`: KEKTV Vouchers ERC-1155 address (`0x7FEF981beE047227f848891c6C9F9dad11767a48`)
- `_techToken`: TECH token ERC-20 address (`0x62E8D022CAf673906e62904f7BB5ae467082b546`)
- `_minOfferValue`: Minimum offer value in TECH wei (default: 0.001 TECH = `1000000000000000`)

**Main Functions**:

```solidity
// Make an offer
function makeOffer(uint256 tokenId, uint256 amount, uint256 offerPrice) external returns (uint256)

// Accept an offer (voucher owner)
function acceptOffer(uint256 offerId) external

// Cancel an offer (offerer)
function cancelOffer(uint256 offerId) external

// Reject an offer (voucher owner)
function rejectOffer(uint256 offerId) external

// View functions
function getTokenOffers(uint256 tokenId) external view returns (uint256[] memory)
function getUserOffers(address user) external view returns (uint256[] memory)
function getReceivedOffers(address user) external view returns (uint256[] memory)
function getOffer(uint256 offerId) external view returns (Offer memory)
```

**Events**:
- `OfferMade(offerId, offerer, voucherOwner, tokenId, amount, offerPrice)`
- `OfferAccepted(offerId, offerer, voucherOwner, tokenId, amount, offerPrice)`
- `OfferCancelled(offerId, offerer)`
- `OfferRejected(offerId, voucherOwner)`

---

## 🔐 Security Features

### Implemented Protections

1. **Reentrancy Protection**: `ReentrancyGuard` on all state-changing functions
2. **CEI Pattern**: Checks-Effects-Interactions pattern followed
3. **Escrow System**: TECH tokens held in contract until offer resolved
4. **Access Control**: Ownable for admin functions
5. **Pausable**: Emergency stop mechanism
6. **Input Validation**: All inputs validated
7. **Minimum Values**: Prevents dust spam offers

### Admin Functions

```solidity
function updateMinOfferValue(uint256 newMinValue) external onlyOwner
function pause() external onlyOwner
function unpause() external onlyOwner
function emergencyWithdraw() external onlyOwner whenPaused
```

---

## 📊 Voucher Types

| Token ID | Type | Description |
|----------|------|-------------|
| 0 | Genesis | Genesis tier voucher |
| 1 | Silver | Silver tier voucher |
| 2 | Gold | Gold tier voucher |
| 3 | Platinum | Platinum tier voucher |

---

## 🔗 Contract Addresses (BasedAI Mainnet)

```
KEKTV Vouchers (ERC-1155): 0x7FEF981beE047227f848891c6C9F9dad11767a48
TECH Token (ERC-20):       0x62E8D022CAf673906e62904f7BB5ae467082b546
KEKTV Marketplace V6:      0x2d79106D60f92F3a6b7B17E3cAd3Df0D4bdcE062
KEKTV Offers:              (deploy and add here)
```

---

## 🎯 Usage Flow

### Making an Offer

1. User approves TECH token for offers contract
2. User calls `makeOffer(tokenId, amount, offerPrice)`
3. TECH tokens transferred to escrow
4. Offer created and tracked

### Accepting an Offer

1. Voucher owner approves vouchers for offers contract
2. Voucher owner calls `acceptOffer(offerId)`
3. Vouchers transferred to offerer
4. TECH tokens transferred to voucher owner

### Cancelling an Offer

1. Offerer calls `cancelOffer(offerId)`
2. TECH tokens refunded to offerer
3. Offer marked inactive

---

## 🧰 Development Tools

### Hardhat Tasks

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Clean artifacts
npx hardhat clean

# Run local node
npx hardhat node

# Deploy
npx hardhat run scripts/deploy-kektv-offers.js --network basedai
```

### Useful Commands

```bash
# Check Hardhat version
npx hardhat --version

# List accounts
npx hardhat accounts

# Get network info
npx hardhat run scripts/network-info.js
```

---

## 🐛 Troubleshooting

### Node.js Version Warning

**Issue**: `WARNING: You are currently using Node.js v23.11.0, which is not supported`

**Solution**:
```bash
# Install nvm if not installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node 20
nvm install 20

# Use Node 20
nvm use 20

# Verify
node --version  # Should show v20.x.x
```

### Compilation Fails

**Issue**: Contract doesn't compile

**Solutions**:
1. Check Solidity version matches (0.8.20)
2. Ensure all dependencies installed
3. Clear cache: `npx hardhat clean`
4. Reinstall: `rm -rf node_modules && npm install`

### Deployment Fails

**Issue**: Deployment transaction fails

**Check**:
1. Sufficient BASED for gas
2. Private key correct in `.env`
3. RPC URL accessible
4. Network configuration correct

---

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [BasedAI Explorer](https://explorer.bf1337.org)
- [Solidity Documentation](https://docs.soliditylang.org)

---

## ✅ Next Steps

1. ✅ Contracts created
2. ⏳ Write tests
3. ⏳ Deploy to BasedAI
4. ⏳ Integrate with frontend
5. ⏳ Test on staging

---

**Questions?** Check the main project README or ask in the team chat!

# KektvVouchersOffersV3 - Deployment Guide

## Overview
This guide walks you through deploying the fixed V3 offers contract on BasedAI.

## Prerequisites

```bash
# Install dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Or if using Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Step 1: Setup Project (Hardhat)

```bash
cd ~/Desktop/Kektheory/kektheory-frontend/contracts/offers-v3

# Initialize Hardhat project
npx hardhat init

# Install OpenZeppelin
npm install @openzeppelin/contracts
```

## Step 2: Configure Hardhat

Create `hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    basedai: {
      url: "https://mainnet.basedaibridge.com/rpc",
      chainId: 32323,
      accounts: [process.env.PRIVATE_KEY] // NEVER commit this!
    }
  },
  etherscan: {
    apiKey: {
      basedai: "no-api-key-needed"
    },
    customChains: [
      {
        network: "basedai",
        chainId: 32323,
        urls: {
          apiURL: "https://explorer.bf1337.org/api",
          browserURL: "https://explorer.bf1337.org"
        }
      }
    ]
  }
};
```

## Step 3: Create Deployment Script

Create `scripts/deploy.js`:
```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying KektvVouchersOffersV3 to BasedAI...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "BASED");

  // Contract parameters
  const VOUCHERS_CONTRACT = "0x7FEF981beE047227f848891c6C9F9dad11767a48";
  const MIN_OFFER_VALUE = "1000000000000000"; // 0.001 BASED

  // Deploy
  const KektvOffersV3 = await hre.ethers.getContractFactory("KektvVouchersOffersV3");
  const offersV3 = await KektvOffersV3.deploy(
    VOUCHERS_CONTRACT,
    MIN_OFFER_VALUE
  );

  await offersV3.waitForDeployment();
  const address = await offersV3.getAddress();

  console.log("✅ KektvVouchersOffersV3 deployed to:", address);
  console.log("   Vouchers Contract:", VOUCHERS_CONTRACT);
  console.log("   Min Offer Value:", MIN_OFFER_VALUE, "(0.001 BASED)");
  
  // Verify deployment
  console.log("\nVerifying deployment...");
  const owner = await offersV3.owner();
  const paused = await offersV3.paused();
  const minValue = await offersV3.minOfferValue();
  
  console.log("   Owner:", owner);
  console.log("   Paused:", paused);
  console.log("   Min Value:", minValue.toString());

  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Next steps:");
  console.log("1. Update frontend config with new address:", address);
  console.log("2. Run test transactions to verify general offers work");
  console.log("3. Announce contract upgrade to users");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Step 4: Deploy to BasedAI

```bash
# Set your private key (NEVER commit this!)
export PRIVATE_KEY="your-private-key-here"

# Deploy to BasedAI mainnet
npx hardhat run scripts/deploy.js --network basedai

# Expected output:
# ✅ KektvVouchersOffersV3 deployed to: 0x...
```

## Step 5: Update Frontend Configuration

Update `config/contracts/kektv-offers.ts`:
```typescript
/**
 * KEKTV Offers Contract Configuration V3
 * Deployed on BasedAI Mainnet
 *
 * Contract: KektvVouchersOffersV3
 * Address: 0x... (YOUR NEW ADDRESS)
 * Network: BasedAI (32323)
 * Deployed: 2025-10-27
 *
 * V3 Changes:
 * - ✅ CRITICAL FIX: General offers now work correctly!
 * - ✅ Checks msg.sender's balance for general offers (voucherOwner = 0x0)
 * - ✅ Checks voucherOwner's balance for targeted offers
 * - ✅ Both offer types now function properly
 */

export const KEKTV_OFFERS_ADDRESS = '0xYOUR_NEW_V3_ADDRESS' as Address

// Update ABI if needed (should be same structure)
export const KEKTV_OFFERS_ABI = kektvOffersV3Abi
```

## Step 6: Test on Mainnet

Create `scripts/test-general-offer.js`:
```javascript
const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0xYOUR_NEW_V3_ADDRESS";
  const VOUCHERS_ADDRESS = "0x7FEF981beE047227f848891c6C9F9dad11767a48";
  
  const [signer] = await hre.ethers.getSigners();
  const offersV3 = await hre.ethers.getContractAt(
    "KektvVouchersOffersV3",
    CONTRACT_ADDRESS
  );

  console.log("Testing General Offer Functionality...\n");

  // Test 1: Make general offer
  console.log("1. Making general offer (voucherOwner = 0x0)...");
  const tx1 = await offersV3.makeOffer(
    3, // Platinum
    1, // 1 voucher
    "0x0000000000000000000000000000000000000000", // General offer!
    { value: hre.ethers.parseEther("0.01") } // 0.01 BASED
  );
  await tx1.wait();
  console.log("✅ General offer created!");

  // Get offer ID
  const totalOffers = await offersV3.getTotalOffers();
  const offerId = totalOffers - 1n;
  console.log("   Offer ID:", offerId.toString());

  // Test 2: Check offer details
  const offer = await offersV3.getOffer(offerId);
  console.log("\n2. Offer details:");
  console.log("   Token ID:", offer.tokenId.toString());
  console.log("   Amount:", offer.amount.toString());
  console.log("   Price:", hre.ethers.formatEther(offer.offerPrice), "BASED");
  console.log("   Voucher Owner:", offer.voucherOwner);
  console.log("   Is General:", offer.voucherOwner === "0x0000000000000000000000000000000000000000");

  console.log("\n✅ Test passed! General offers are working!");
  console.log("\n⚠️  To complete test:");
  console.log("   1. Use a different address that owns Platinum");
  console.log("   2. Call acceptOffer(" + offerId + ")");
  console.log("   3. Verify transaction succeeds!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Step 7: Migration Strategy

### Option A: Clean Start (Recommended)
1. Deploy V3 contract
2. Update frontend to use V3
3. Announce: "Please cancel old offers and create new ones on V3"
4. Users migrate organically

### Option B: Parallel Operation
1. Deploy V3 contract
2. Keep V2 address in config
3. Add V3 address as "offersV3Address"
4. Frontend shows offers from BOTH contracts
5. New offers go to V3 only
6. Old offers (V2) can be cancelled/accepted normally
7. Eventually sunset V2

### Option C: Manual Migration (Complex)
1. Deploy V3
2. Read all active offers from V2
3. For each offer:
   - Contact offerer
   - Ask them to cancel V2 offer
   - Recreate same offer on V3
4. Time-consuming but preserves all offers

## Step 8: Announce Upgrade

**User Communication Template:**
```
🎉 KEKTV Offers V3 - General Offers Now Work!

We've deployed a fixed version of the offers contract that resolves 
the issue with general offers (offers to anyone).

What Changed:
- ✅ General offers (to anyone) now work correctly
- ✅ Targeted offers (to specific user) still work as before
- ✅ Auto-delist feature still works perfectly

Action Required:
- None! The frontend automatically uses the new contract.
- Old offers on V2 can still be cancelled.
- New offers will use V3 automatically.

Contract Address: 0x...
Explorer: https://explorer.bf1337.org/address/0x...
```

## Troubleshooting

### Issue: Deployment fails with "insufficient funds"
**Solution:** Ensure deployer address has enough BASED for gas

### Issue: Contract not verified on explorer
**Solution:** BasedAI explorer may not support verification yet

### Issue: Frontend shows "Contract not found"
**Solution:** Check address in config, ensure RPC is responding

### Issue: Users report old offers still visible
**Solution:** Normal - they're from V2. Add note in UI to migrate.

## Security Checklist

Before deploying to mainnet:
- [ ] Code reviewed by team
- [ ] Tests pass on local network
- [ ] Tests pass on testnet (if available)
- [ ] OpenZeppelin contracts up to date
- [ ] No known vulnerabilities
- [ ] Owner address is multisig or secure
- [ ] Emergency pause function works
- [ ] Reentrancy guards in place

## Costs

**Deployment:**
- Gas estimate: ~2,500,000 gas
- At 9 gwei: ~0.0225 BASED
- Very cheap on BasedAI!

**User Operations:**
- makeOffer: ~150,000 gas
- acceptOffer: ~200,000 gas
- cancelOffer: ~80,000 gas

## Support

If you encounter issues:
1. Check explorer for transaction details
2. Verify contract address is correct
3. Ensure user has approved vouchers contract
4. Check console for error messages

Good luck with the deployment! 🚀

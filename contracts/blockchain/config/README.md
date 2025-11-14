# KEKTECH 3.0 - Parameter Management System

This directory contains the master configuration for all KEKTECH system parameters.

## Overview

**Single Source of Truth**: `parameters.js` contains ALL 29 configurable parameters for the KEKTECH prediction market system.

## Quick Start

### 1. View Current Parameters
```bash
cd packages/blockchain
node scripts/mainnet/check-parameters.js
```

### 2. Initialize Parameters (Run Once After Deployment)
```bash
node scripts/mainnet/init-parameters.js
```

### 3. Switch to Production Mode
```bash
node scripts/mainnet/switch-to-production.js
```

## Parameter Categories

### Market Creation (3 parameters)
- `minCreatorBond`: 0.1 BASED (refundable)
- `minimumBet`: 0.01 BASED
- `maximumBet`: 100 BASED

### Fee Distribution (7 parameters)
All fees in Basis Points (10000 = 100%)
- `protocolFeeBps`: 250 (2.5%)
- `creatorFeeBps`: 150 (1.5%)
- `stakerIncentiveBps`: 50 (0.5%)
- `treasuryFeeBps`: 50 (0.5%)
- `totalFeeBps`: 500 (5%)
- `platformFeePercent`: 500 (for contracts)
- `winnersShareBps`: 9500 (95%)

### Resolution - Testing Mode (4 parameters)
For rapid iteration during development
- `disputeWindow`: 15 minutes
- `minDisputeBond`: 0.01 BASED
- `agreementThreshold`: 75%
- `disagreementThreshold`: 40%

### Resolution - Production Mode (4 parameters)
For live markets with real users
- `disputeWindow`: 48 hours
- `minDisputeBond`: 0.1 BASED
- `agreementThreshold`: 75%
- `disagreementThreshold`: 40%

### Approval System (2 parameters)
- `likesRequired`: 10 likes
- `approvalWindow`: 24 hours

### LMSR Curve (3 parameters)
- `minB`: 1 BASED
- `maxB`: 1000 BASED
- `defaultB`: 100 BASED

### Boolean Flags (3 parameters)
- `marketCreationActive`
- `experimentalMarketsActive`
- `emergencyPause`

### Roles (6 constants)
Defined in AccessControlManager:
- `ADMIN_ROLE`
- `OPERATOR_ROLE`
- `RESOLVER_ROLE`
- `PAUSER_ROLE`
- `TREASURY_ROLE`
- `BACKEND_ROLE`

## Parameter Update Workflow

1. **Update Config**: Edit `parameters.js`
2. **Document Change**: Add reason in comments
3. **Test Locally**: Run tests with new values
4. **Test on Fork**: Verify on mainnet fork
5. **Deploy to Testnet**: Validate on Sepolia
6. **Update Mainnet**: Use admin panel or scripts
7. **Verify**: Run `check-parameters.js`
8. **Monitor**: Watch for issues

## Scripts

### `scripts/mainnet/init-parameters.js`
**Purpose**: Initialize all parameters after deployment
**Run**: Once, after contracts deployed
**What it does**:
- Sets all fee percentages in ParameterStorage
- Configures resolution windows
- Enables market creation
- Sets testing mode (15-min disputes)

### `scripts/mainnet/check-parameters.js`
**Purpose**: View all current parameter values
**Run**: Anytime to check system status
**What it does**:
- Queries all parameters from contracts
- Compares with config file
- Shows current mode (testing/production)
- Highlights mismatches

### `scripts/mainnet/switch-to-production.js`
**Purpose**: Switch from testing to production mode
**Run**: After testing full lifecycle
**What it does**:
- Updates dispute window: 15 min → 48 hours
- Updates min dispute bond: 0.01 → 0.1 BASED
- Verifies changes

## Testing vs Production

### Testing Mode (Default)
- **Dispute Window**: 15 minutes
- **Purpose**: Rapid iteration, quick testing
- **Use When**: Development, validation, QA
- **Switch Command**: Already active after `init-parameters.js`

### Production Mode
- **Dispute Window**: 48 hours
- **Purpose**: Live markets with real users
- **Use When**: After full lifecycle testing complete
- **Switch Command**: `node scripts/mainnet/switch-to-production.js`

## Admin Override

Admin can ALWAYS:
- Bypass any parameter restriction
- Instantly finalize resolutions (skip dispute window)
- Force approve/reject markets
- Emergency pause entire system
- Update any parameter

## Parameter Keys

Parameters are stored in ParameterStorage using keccak256 hashes:

```javascript
const key = ethers.id("protocolFeeBps");  // keccak256("protocolFeeBps")
const value = await paramStorage.getParameter(key);
```

Available in `config.keys`:
```javascript
const params = require('./parameters.js');
params.keys.protocolFeeBps  // Pre-computed keccak256 hash
```

## Example: Update Creator Fee

### Via Script
```javascript
const { ethers } = require("hardhat");
const config = require("../../config/parameters");

const paramStorage = await ethers.getContractAt("ParameterStorage", ADDRESS);

await paramStorage.setParameter(
  ethers.id("creatorFeeBps"),
  200  // Change from 150 (1.5%) to 200 (2%)
);
```

### Via Admin Panel (Future)
- Navigate to `/admin`
- Go to Parameters tab
- Update "Creator Fee"
- Enter new value: 200
- Click Save
- Verify change

## Important Notes

- ⚠️ **Always test on fork/testnet first**
- ✅ **Start in testing mode** (15-min windows)
- 🔄 **Switch to production** after full validation
- 📊 **Track all changes** (events emitted)
- 🛡️ **Guardrails exist** (min/max validation in contracts)

## Monitoring

All parameter changes emit events:
```solidity
event ParameterUpdated(bytes32 indexed key, uint256 oldValue, uint256 newValue);
event BoolParameterUpdated(bytes32 indexed key, bool oldValue, bool newValue);
```

Monitor these events to track system configuration changes.

## Support

For questions or issues:
- Check `CLAUDE.md` section "🎛️ PARAMETER MANAGEMENT SYSTEM"
- Review deployed contract addresses in `deployments/basedai-mainnet/contracts.json`
- Run `check-parameters.js` to verify current state

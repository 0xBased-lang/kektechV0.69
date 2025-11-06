# BMAD Bonding Curves V3 - Development Workspace

⚠️ **IMPORTANT: This is a NEW development workspace. Do NOT modify bmad-blockchain-dev - those contracts are deployed on mainnet!**

## Purpose

This workspace contains the refined bonding curve implementation with enhanced proposal system integration for KEKTECH 3.0.

## Status

🚧 **IN DEVELOPMENT** - Not deployed to any network yet

## Key Features

- **Bonding Curve Markets**: Dynamic pricing with continuous trading
- **Enhanced Proposals**: Market settings defined at proposal time
- **Flexible Economics**: All parameters adjustable via ParameterStorage
- **Multiple Curve Types**: Linear, Sigmoid, Quadratic curves
- **Creator Incentives**: Fee boost mechanism for market creators

## Directory Structure

```
bmad-bonding-curves-v3/
├── contracts/
│   ├── core/                 # Core system contracts
│   │   ├── ProposalManagerV3.sol
│   │   ├── BondingCurveManager.sol
│   │   └── EnhancedMarketFactory.sol
│   ├── markets/              # Market implementations
│   │   └── BondingCurveMarket.sol
│   ├── curves/               # Curve math implementations
│   │   ├── LinearCurve.sol
│   │   ├── SigmoidCurve.sol
│   │   └── QuadraticCurve.sol
│   └── interfaces/           # Contract interfaces
│       └── IBondingCurve.sol
├── test/                     # Test files
├── scripts/                  # Deployment scripts
└── docs/                     # Documentation
```

## Integration with Existing System

This system is designed to work alongside the existing deployed contracts:
- Uses same MasterRegistry
- Shares ParameterStorage
- Compatible with AccessControlManager
- Works with ResolutionManager
- Integrates with RewardDistributor

## Development Guidelines

1. **Never modify** bmad-blockchain-dev contracts (they're on mainnet)
2. **Test everything** - minimum 95% coverage required
3. **Gas optimization** - target <100k for trades
4. **Security first** - all functions need access control
5. **Documentation** - every function must be documented

## Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Check coverage
npm run coverage

# Deploy to local
npm run deploy:local
```

## Related Documentation

- Architecture: `/docs/BONDING_CURVE_REFINED_ARCHITECTURE_V1.md`
- Original System: `/expansion-packs/bmad-blockchain-dev/`
- Project Blueprint: `/docs/KEKTECH_3.0_Refined_Blueprint_v1.md`

---

**Created**: November 3, 2025
**Version**: 3.0.0-alpha
# KEKTECH 3.0 - PROJECT INDEX

Quick navigation for the kektechV0.69 prediction market platform.

---

## 🔴 DEPLOYMENT STATUS UPDATE
**Navigation**: [→ MASTER_STATUS](./MASTER_STATUS.md) | [→ TODO_TRACKER](./TODO_TRACKER.md) | [→ DEPLOYMENT_REALITY](./DEPLOYMENT_REALITY.md) | [→ TEST_REALITY](./TEST_REALITY.md)

- **Mainnet**: ✅ LIVE (November 6, 2025)
- **Contracts**: 9 deployed and working
- **Tests**: 222/321 passing (69%)
- **Documentation**: BEING UPDATED (much is outdated)

⚠️ **See [MASTER_STATUS.md](./MASTER_STATUS.md) for the REAL project status**

---

## 🚀 QUICK LINKS (Most Used Files)

### Essential Documents (NEW - Real Status)
- [MASTER_STATUS.md](/MASTER_STATUS.md) ⭐⭐⭐⭐⭐ - **SINGLE SOURCE OF TRUTH**
- [TODO_TRACKER.md](/TODO_TRACKER.md) ⭐⭐⭐⭐ - Real tasks needed
- [DEPLOYMENT_REALITY.md](/DEPLOYMENT_REALITY.md) ⭐⭐⭐⭐ - Actual mainnet deployment
- [TEST_REALITY.md](/TEST_REALITY.md) ⭐⭐⭐⭐ - Real test status

### Legacy Documents (May be outdated)
- [CLAUDE.md](/CLAUDE.md) ⭐⭐⭐ - Main AI instructions
- [README.md](/README.md) - Project overview
- [MAINNET_DEPLOYMENT_CHECKLIST.md](/MAINNET_DEPLOYMENT_CHECKLIST.md) - Deployment tracking

### Migration & Architecture
- [MIGRATION_IMPLEMENTATION_CHECKLIST.md](/expansion-packs/bmad-blockchain-dev/docs/migration/MIGRATION_IMPLEMENTATION_CHECKLIST.md) ⭐⭐⭐ - Master checklist
- [MINIMAL_MODULAR_MIGRATION_MASTER_PLAN.md](/expansion-packs/bmad-blockchain-dev/docs/migration/MINIMAL_MODULAR_MIGRATION_MASTER_PLAN.md) ⭐⭐⭐ - Master plan
- [TARGET_ARCHITECTURE.md](/expansion-packs/bmad-blockchain-dev/docs/active/TARGET_ARCHITECTURE.md) ⭐⭐⭐ - File modification whitelist

### Configuration
- [Blockchain package.json](/expansion-packs/bmad-blockchain-dev/package.json) - Smart contract scripts
- [Frontend package.json](/packages/frontend/package.json) - Frontend scripts
- [Hardhat config](/expansion-packs/bmad-blockchain-dev/hardhat.config.js) - Blockchain configuration

---

## 📁 DIRECTORY MAP

### Root Structure
```
kektechV0.69/
├── packages/           ⭐ Main frontend directory
│   └── frontend/       Next.js frontend application
├── expansion-packs/    ⭐ Smart contracts directory
│   └── bmad-blockchain-dev/  Blockchain development
├── deployments/        Deployment artifacts (legacy)
├── .github/           CI/CD workflows
├── lib/               Forge-std library
└── docs/              Root documentation
```

### Blockchain Package (`expansion-packs/bmad-blockchain-dev/`)
```
bmad-blockchain-dev/
├── contracts/          ⭐ Solidity smart contracts
│   ├── core/          Registry, Factory, Storage
│   ├── bonding-curves/ LMSR implementation
│   ├── markets/       Market contracts
│   ├── rewards/       Reward distribution
│   └── (9 other categories)
│
├── test/              ⭐ 326+ tests (100% passing)
├── scripts/           ⭐ Deployment & utility scripts
│   ├── deploy/        5 active deployment scripts
│   └── test/          Test execution scripts
│
├── docs/              ⭐ Documentation
│   ├── active/        4 current architecture docs
│   ├── migration/     27 migration phase docs
│   └── archive/       Historical documentation
│
├── archive/           Deprecated code (2.6MB)
├── audit-results/     Security audit reports
├── test-reports/      Test execution reports
├── test-results/      Test output data
├── coverage/          Code coverage (95%+)
└── (Build artifacts, logs, cache)
```

### Frontend Package (`packages/frontend/`)
```
frontend/
├── app/               Next.js 15 App Router
├── components/        React components
├── lib/              Utility libraries
├── config/           Frontend configuration
├── public/           Static assets
├── scripts/          Frontend scripts
├── test/             Unit tests
├── tests/            E2E tests (Playwright)
└── .vercel/          Vercel deployment config
```

### Deployments (`expansion-packs/bmad-blockchain-dev/deployments/`)
```
deployments/
├── sepolia/          Testnet contracts
├── basedai-mainnet/  Mainnet contracts ⭐
├── fork/             Fork test deployments
└── archive/          Historical deployments
```

---

## 🔧 CONFIGURATION FILES INDEX

### Blockchain Configuration
| File | Location | Purpose |
|------|----------|---------|
| package.json | `/expansion-packs/bmad-blockchain-dev/` | Dependencies & scripts |
| hardhat.config.js | `/expansion-packs/bmad-blockchain-dev/` | Hardhat configuration |
| slither.config.json | `/expansion-packs/bmad-blockchain-dev/` | Security analysis |
| .env | `/expansion-packs/bmad-blockchain-dev/` | Environment variables (PRIVATE) |
| .env.fork | `/expansion-packs/bmad-blockchain-dev/` | Fork testing environment |

### Frontend Configuration
| File | Location | Purpose |
|------|----------|---------|
| package.json | `/packages/frontend/` | Frontend dependencies |
| vercel.json | `/packages/frontend/` | Vercel deployment |
| tsconfig.json | `/packages/frontend/` | TypeScript config |
| .env.local | `/packages/frontend/` | Local environment (PRIVATE) |

### CI/CD Configuration
| File | Location | Purpose |
|------|----------|---------|
| ci.yml | `/.github/workflows/` | Continuous integration |
| deploy.yml | `/.github/workflows/` | Deployment automation |
| security.yml | `/.github/workflows/` | Security scanning |
| vercel-deploy.yml | `/.github/workflows/` | Vercel automation |

### Git Configuration
| File | Location | Purpose |
|------|----------|---------|
| .gitignore | `/` | Git ignore patterns |

---

## 📜 SMART CONTRACTS INDEX

**Location:** `/expansion-packs/bmad-blockchain-dev/contracts/`

### Core Contracts
- `core/` - VersionedRegistry, ParameterStorage, AccessControlManager
- `markets/` - PredictionMarket template, Market logic
- `bonding-curves/` - LMSR bonding curve implementation
- `rewards/` - RewardDistributor, Fee splitting
- `security/` - ResolutionManager, Access control

### Supporting Contracts
- `curves/` - Curve implementations
- `governance/` - Governance contracts (V2)
- `libraries/` - Shared libraries
- `interfaces/` - Contract interfaces
- `mocks/` - Testing mocks

### Total: ~100+ contracts across 12 categories

---

## 📚 DOCUMENTATION INDEX

### Priority 1: MUST READ FIRST ⭐⭐⭐
1. [CLAUDE.md](/CLAUDE.md) - Main project instructions
2. [MIGRATION_IMPLEMENTATION_CHECKLIST.md](/expansion-packs/bmad-blockchain-dev/docs/migration/MIGRATION_IMPLEMENTATION_CHECKLIST.md) - Master checklist
3. [MINIMAL_MODULAR_MIGRATION_MASTER_PLAN.md](/expansion-packs/bmad-blockchain-dev/docs/migration/MINIMAL_MODULAR_MIGRATION_MASTER_PLAN.md) - Master plan
4. [TARGET_ARCHITECTURE.md](/expansion-packs/bmad-blockchain-dev/docs/active/TARGET_ARCHITECTURE.md) - File whitelist

### Priority 2: Architecture & Design ⭐⭐
- [MARKET_LIFECYCLE.md](/expansion-packs/bmad-blockchain-dev/docs/active/MARKET_LIFECYCLE.md) - Market states & transitions
- [LIFECYCLE_API_REFERENCE.md](/expansion-packs/bmad-blockchain-dev/docs/active/LIFECYCLE_API_REFERENCE.md) - API documentation
- Phase implementation guides (PHASE_0 through PHASE_7)

### Priority 3: Guides & Procedures ⭐
- [DEPLOYMENT_PROCEDURES_GUIDE.md](/expansion-packs/bmad-blockchain-dev/docs/migration/DEPLOYMENT_PROCEDURES_GUIDE.md)
- [FRONTEND_INTEGRATION_GUIDE.md](/expansion-packs/bmad-blockchain-dev/docs/migration/FRONTEND_INTEGRATION_GUIDE.md)
- [TESTING_PROCEDURES_GUIDE.md](/expansion-packs/bmad-blockchain-dev/docs/migration/TESTING_PROCEDURES_GUIDE.md)
- [SECURITY_GOVERNANCE_GUIDE.md](/expansion-packs/bmad-blockchain-dev/docs/migration/SECURITY_GOVERNANCE_GUIDE.md)

### Deployment Documentation
- [MAINNET_DEPLOYMENT_CHECKLIST.md](/MAINNET_DEPLOYMENT_CHECKLIST.md) - Daily checklist
- Phase completion reports (PHASE_1_COMPLETE, PHASE_2_COMPLETE)
- [TESTING_COMPLETE_SUMMARY.md](/TESTING_COMPLETE_SUMMARY.md)

### Historical Documentation (Archive)
- Implementation history (30+ docs)
- Success reports
- Analysis documents
- Located in `/expansion-packs/bmad-blockchain-dev/docs/archive/`

---

## 🚀 SCRIPTS & TOOLS INDEX

### Deployment Scripts (`expansion-packs/bmad-blockchain-dev/scripts/deploy/`)
| Script | Purpose | Network |
|--------|---------|---------|
| basedai-mainnet-ultra-conservative.js | Mainnet deployment | BasedAI Mainnet |
| deploy-unified-sepolia.js | Testnet deployment | Sepolia |
| deploy-phase7-fork.js | Fork testing | Fork |
| configure-basedai-registry-fixed.js | Registry setup | BasedAI |
| deploy-bonding-curve-market.js | Bonding curve deploy | Any |

### Utility Scripts (`expansion-packs/bmad-blockchain-dev/scripts/`)
- `check-balance.js` - Check wallet balance
- `verify-mainnet-deployment.js` - Verify mainnet deployment
- `verify-registry.js` - Verify registry configuration
- `create-test-market-mainnet.js` - Create test market
- `check-gas-price.js` - Check current gas prices
- And 15+ more utility scripts

### Test Scripts (`expansion-packs/bmad-blockchain-dev/scripts/test/`)
- `advanced-edge-cases.js` - Edge case testing
- `comprehensive-edge-tests-v2.js` - Comprehensive tests
- `timeout-security-tests.js` - Security timeout tests

### NPM Scripts (Blockchain)
```bash
cd expansion-packs/bmad-blockchain-dev
npm run compile          # Compile contracts
npm run test            # Run all tests
npm run test:coverage   # Coverage report
npm run test:fork       # Fork testing
npm run deploy:mainnet  # Deploy to mainnet
npm run deploy:sepolia  # Deploy to testnet
npm run security:slither # Security analysis
```

### NPM Scripts (Frontend)
```bash
cd packages/frontend
npm run dev             # Start dev server
npm run build           # Build for production
npm run start           # Start production server
npm run test:contracts  # Test contracts
```

---

## 🧪 TESTING INDEX

### Test Suites (`expansion-packs/bmad-blockchain-dev/test/`)
- **Total Tests:** 326+ (100% passing)
- **Coverage:** 95%+
- **Types:** Unit, Integration, Fork, E2E

### Test Categories
- Market lifecycle tests
- LMSR bonding curve tests
- Access control tests
- Security tests
- Edge case tests
- Gas optimization tests

### Test Reports & Results
- `test-reports/` - Formatted test reports
- `test-results/` - Raw test output
- `coverage/` - Code coverage reports

---

## 🌐 DEPLOYMENT INDEX

### Networks

#### BasedAI Mainnet (Production)
- **Chain ID:** 32323
- **Location:** `/expansion-packs/bmad-blockchain-dev/deployments/basedai-mainnet/`
- **Files:**
  - `contracts.json` - Contract addresses
  - `deployment.json` - Deployment metadata

#### Sepolia Testnet
- **Chain ID:** 11155111
- **Location:** `/expansion-packs/bmad-blockchain-dev/deployments/sepolia/`
- **Files:**
  - `contracts.json` - Contract addresses
  - `deployment.json` - Deployment metadata

#### Fork Testing
- **Location:** `/expansion-packs/bmad-blockchain-dev/deployments/fork/`
- **Files:**
  - `deployment-unified.json` - Unified deployment
  - `deployment-phase7.json` - Phase 7 deployment
  - `params.json` - Test parameters

### Archived Deployments
- **Location:** `/expansion-packs/bmad-blockchain-dev/deployments/archive/`
- **Purpose:** Historical reference
- **Count:** 10+ deployment configurations

---

## 🔐 SECURITY & AUDIT INDEX

### Audit Reports (`expansion-packs/bmad-blockchain-dev/audit-results/`)
- `day1-20251104/` - Initial audit
- `day2-20251104/` - Re-audit

### Security Tools
- Slither (static analysis)
- Hardhat security plugins
- Manual security tests

### Test Coverage
- **Overall:** 95%+
- **Critical Paths:** 100%
- **Edge Cases:** Comprehensive

---

## 📦 ARCHIVE INDEX

### Deprecated Code (`expansion-packs/bmad-blockchain-dev/archive/`)
- **Size:** 2.6MB
- **Content:** Phase 3 deprecated code
  - Old factory implementation
  - Old registry implementation
  - Proposal managers (deferred to V2)
  - Deprecated scripts
  - Deprecated tests
- **Status:** READ-ONLY (archived for reference)

### Deployment Archive (`expansion-packs/bmad-blockchain-dev/deployments/archive/`)
- Old deployment configurations
- Split architecture attempts
- Verification results
- Historical state files

---

## 🔍 SEARCH TIPS

### Finding Files by Type
```bash
# All markdown documentation
find . -name "*.md" -not -path "*/node_modules/*"

# All smart contracts
find expansion-packs/bmad-blockchain-dev/contracts -name "*.sol"

# All deployment scripts
ls expansion-packs/bmad-blockchain-dev/scripts/deploy/

# All test files
find expansion-packs/bmad-blockchain-dev/test -name "*.js"
```

### Finding Configuration
```bash
# Package configs
find . -name "package.json" -not -path "*/node_modules/*"

# Environment files
find . -name ".env*" -not -path "*/node_modules/*"

# Build configs
find . -name "*.config.js" -not -path "*/node_modules/*"
```

---

## 🚨 IMPORTANT NOTES

### DO NOT MODIFY
- Files in `/expansion-packs/bmad-blockchain-dev/archive/` (archived deprecated code)
- Files not in `TARGET_ARCHITECTURE.md` whitelist
- Environment files (`.env`, `.env.local`) - these are private!

### ALWAYS CHECK FIRST
- [MIGRATION_IMPLEMENTATION_CHECKLIST.md] before any work
- [TARGET_ARCHITECTURE.md] before modifying files
- Current phase status in migration docs

### PRIORITY ORDER (If Conflicts)
1. MIGRATION_IMPLEMENTATION_CHECKLIST.md ⭐⭐⭐⭐⭐
2. TARGET_ARCHITECTURE.md ⭐⭐⭐⭐⭐
3. PHASE_X_*.md ⭐⭐⭐⭐
4. MINIMAL_MODULAR_MIGRATION_MASTER_PLAN.md ⭐⭐⭐
5. All other documentation ⭐⭐

---

## 📝 MAINTENANCE

**Last Updated:** 2025-11-08
**Repository Version:** V0.69
**Migration Status:** Phase 4 (70% complete)
**Tests Passing:** 326/326 (100%)
**Coverage:** 95%+

**Update This Index:** When adding new files, directories, or documentation

---

## 🤝 CONTRIBUTING

Before working on the project:
1. Read CLAUDE.md
2. Check MIGRATION_IMPLEMENTATION_CHECKLIST.md
3. Verify TARGET_ARCHITECTURE.md
4. Follow phase progression rules

---

*For detailed navigation, use the links above to jump to specific sections.*
# GitHub Actions CI/CD

This repository uses GitHub Actions for continuous integration and deployment.

## Workflows

### 🧪 CI - Full Stack Tests (`ci.yml`)
**Triggers**: Push to main/develop, Pull requests
**What it does**:
- Tests smart contracts with Hardhat
- Compiles all contracts
- Checks contract sizes (must be <24KB)
- Runs coverage reports
- Tests frontend build (when enabled)
- Runs integration tests on main branch

### 🔒 Security Audit (`security.yml`)
**Triggers**: Push to main, PRs, Weekly schedule (Mondays)
**What it does**:
- Runs Slither static analysis on smart contracts
- Checks for known vulnerabilities
- Audits npm dependencies
- Verifies contract sizes
- Generates security reports

### 🚀 Deploy to BasedAI (`deploy.yml`)
**Triggers**: Manual workflow dispatch only
**What it does**:
- Deploys contracts to BasedAI mainnet or fork
- Requires manual confirmation
- Updates frontend with new addresses
- Verifies contracts on block explorer

## Setup Required

### Secrets Needed
Add these secrets to your repository (Settings → Secrets → Actions):

1. `DEPLOYER_PRIVATE_KEY` - Private key for deployment wallet
2. `BASEDAI_RPC_URL` - BasedAI mainnet RPC endpoint

### Local Development
To run these checks locally:

```bash
# Run tests
cd expansion-packs/bmad-blockchain-dev
npm test

# Check contract sizes
npx hardhat size-contracts

# Run Slither (requires Python)
pip3 install slither-analyzer
slither . --compile-force-framework hardhat

# Run coverage
npm run coverage
```

## Workflow Status Badges

Add these to your main README:

```markdown
![CI](https://github.com/0xBased-lang/kektechV0.69/workflows/CI%20-%20Full%20Stack%20Tests/badge.svg)
![Security](https://github.com/0xBased-lang/kektechV0.69/workflows/Security%20Audit/badge.svg)
```

## Notes

- Frontend tests are currently disabled until the frontend directory is properly configured
- Slither may report warnings that are acceptable - review manually
- Deployment workflow requires manual confirmation for safety
- All workflows use Node.js 18 for consistency
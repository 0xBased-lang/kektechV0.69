# ⚙️ KEKTECH 3.0 — Implementation Roadmap (V1.1)
*Updated with Dual-Network Testing and Forked BasedAI Environment*

## 🧭 Phase 0 – Environment Setup & Toolchain

### 🎯 Objectives
Prepare the full multi-network development and testing environment.

### 🧩 Directory Layout
```
/contracts
  /core
  /governance
  /markets
  /rewards
  /interfaces
  /libraries
/scripts
/deploy
/test
/docs
```

### 🧰 Tech Stack
- Solidity ≥ 0.8.25  
- Frameworks: Hardhat + Foundry (for fuzz/invariant testing)  
- Static analysis: Slither / MythX / Echidna  
- Format & lint: Prettier + Solhint  
- Version control: Git + branch-per-module (feature/market-factory-v1)

---

## 🌐 Multi-Network Setup

| Network | Purpose | Chain ID | Notes |
|----------|----------|----------|-------|
| **Ethereum Sepolia** | Primary logic testing, deploy scripts, DAO governance simulation | 11155111 | Cheap & public |
| **Forked BasedAI mainnet** | Integration with real $BASED token, realistic gas & state testing | 32323 (forked) | Local or hosted RPC |
| **BasedAI mainnet** | Production deployment | 32323 | Final live system |

### 🧩 Hardhat Network Config Example
```js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.25",
  networks: {
    sepolia: {
      url: "https://rpc.sepolia.org",
      accounts: [process.env.PRIVATE_KEY],
    },
    forkedBasedAI: {
      url: "http://127.0.0.1:8545",
      chainId: 32323,
      forking: {
        url: "https://rpc.bf1337.org",
        blockNumber: 1234567,
      },
    },
    mainBasedAI: {
      url: "https://rpc.bf1337.org",
      accounts: [process.env.PRODUCTION_KEY],
      chainId: 32323,
    },
  },
};
```

Run local fork:
```bash
npx hardhat node --fork https://rpc.bf1337.org
```

---

## 🧩 Phase 1 – Core Infrastructure
Build:
- AccessControlManager
- ParameterStorage
- MasterRegistry

Test:
- On Sepolia → role, blacklist, registry logic.
- On forked BasedAI → BASED token compatibility & gas behavior.

---

## 🧩 Phase 2 – Market Lifecycle
Modules:
- ProposalManager
- FlexibleMarketFactory
- PredictionMarket

Testing:
- Deploy to Sepolia for flow.
- Forked BasedAI for real currency operations and bond handling.

---

## 🧩 Phase 3 – Resolution & Rewards
Modules:
- ResolutionManager
- RewardDistributor

Flow:
1. Admin resolves market within resolution window.
2. Market sends BASED fees → RewardDistributor.
3. Distributor splits (creator / treasury / staker reserve / optional beneficiary).

Tests:
- Split math accuracy.
- Batch claims.
- Toggle checks.
- Gas profiling on BasedAI fork.

---

## 🧩 Phase 4 – Integration Testing
End-to-end Scenarios:
1. Proposal → Market → Resolution → Reward claim.
2. Registry upgrade simulation.
3. Parameter updates verified live.
4. Emergency pause & resume.

Use Hardhat + Foundry integration tests.

---

## 🧩 Phase 5 – Backend & API Integration
Backend stack:
- Node / NestJS + Supabase (Postgres) + Ethers.js

Responsibilities:
- Collect off-chain votes.
- Aggregate + sign results.
- Submit to ProposalManager.
- Mirror on-chain events.
- REST API for frontend.

Host on your VPS with PM2.

---

## 🧩 Phase 6 – Front-End
Tech:
- React + Next.js + Tailwind + Wagmi + RainbowKit  
- Charts: Recharts

Main Pages:
- Home / Leaderboards  
- Create Proposal  
- Vote / Approve  
- Active Markets  
- Profile (claims & rewards)

---

## 🧩 Phase 7 – Audit & Deployment
Steps:
1. Final tests on BasedAI fork.  
2. Public test & demo on Sepolia.  
3. External audit (Hashlock, Solidity Finance).  
4. Fix findings → redeploy → verify on Etherscan.  
5. Mainnet launch on BasedAI.

---

## 🧩 Phase 8 – Governance Transition
Steps:
1. Transfer ownership → Vultisig multisig.  
2. Add DAO governance role.  
3. Move ParameterStorage & Registry control to DAO.  
4. Deploy governance UI.

---

## 🧱 Best Practices
| Area | Recommendation |
|-------|----------------|
| Security | nonReentrant, onlyRole, guardrails |
| Flexibility | All numeric values in BPS |
| Gas | Claim-based payouts |
| Transparency | Emit events for every change |
| Upgrades | Registry swaps only (no proxies) |
| Testing | Fork-based + Sepolia unit tests |
| Docs | Maintain /docs/ParameterKeys.md |

---

## 🧠 Developer Workflow
| Stage | Command | Purpose |
|--------|----------|---------|
| Local dev | `npx hardhat node` | Fast simulated testnet |
| Fork test | `npx hardhat node --fork https://rpc.bf1337.org` | Mainnet simulation |
| Run tests | `npx hardhat test --network forkedBasedAI` | Full protocol test |
| Deploy test | `npx hardhat run scripts/deploy.js --network sepolia` | Dry-run deploy |
| Deploy prod | `npx hardhat run scripts/deploy.js --network mainBasedAI` | Final deploy |

---

## 🚀 Outcome
This roadmap enables:
- Safe, realistic testing via Sepolia + forked BasedAI.  
- Gas-efficient, auditable contracts.  
- Seamless upgrade & governance transition.  
- Production-grade deployment pipeline for KEKTECH 3.0.

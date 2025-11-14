# KEKTECH 3.0 — Refined Master Blueprint (V1.0)

## I. Core Philosophy
- **Goal:** modular, upgradeable prediction-market ecosystem with flexible economic parameters.
- **Principles:**
  - simple first → expandable later,
  - every value adjustable through a single ParameterStorage,
  - claim-based payouts for gas efficiency,
  - upgradable via a single Master Registry (no proxies),
  - community governance introduced gradually.

## II. High-Level Architecture
```
Master Registry
├── ParameterStorage
├── AccessControlManager
├── FlexibleMarketFactory
├── ProposalManager
├── ResolutionManager
├── RewardDistributor
└── Treasury / Team wallet
```
All modules read addresses and parameters from the Registry and ParameterStorage.
Upgrades replace a module and update one key in the Registry.

## III. Access & Roles
| Role | Powers |
|------|--------|
| **Owner** | full control — initially hot wallet, later Vultisig multisig, eventually DAO |
| **Admin** | manage routine parameters, approve proposals, resolve markets |
| **Emergency** | trigger global pause |
| **Governance** | (future) modify parameters / registry via on-chain proposals |

Ownership transfer handled with `transferOwnership(newOwner)`.

## IV. Parameter & Feature Control Layer
**ParameterStorage** = single source of truth.

| Type | Examples | Unit |
|------|-----------|------|
| Numeric (BPS) | protocolFeeBps, creatorFeeBps, stakerIncentiveBps, treasuryFeeBps, extraBeneficiaryShareBps, maxFeeBpsPerMarket | 1 BPS = 0.01 % |
| Timing | resolutionWindow (default 48 h), marketExpiryTime | seconds |
| Collateral | creatorBondAmount, minBondAmount | BASED |
| Addresses | TEAM_TREASURY, extraBeneficiaryAddress | address |
| Booleans (toggles) | marketCreationActive, experimentalMarketsActive, extraBeneficiaryActive, emergencyPause | bool |

- Every change emits an event (`ParameterChanged`, `BoolChanged`, `AddressChanged`).
- Guardrails (max/min) apply **unless** `experimentalMarketsActive = true`.

## V. Proposal & Governance System
Purpose: prevent spam and let community approve new markets.

**Flow**
1. Creator submits proposal + pays bond, creation fee, and proposal tax.
2. Users vote (off-chain likes/dislikes).
3. If threshold reached → ProposalManager activates market.
4. Rejected/expired → creator reclaims bond.

Parameters in BPS and counts control thresholds.

## VI. Prediction Markets & Categories
- Binary outcomes only in V1 (YES/NO).
- Market categories (SPORTS, POLITICS, CRYPTO, etc.) with max fee ceilings.
- Category rules stored in ParameterStorage.
- FlexibleMarketFactory validates category + fees.

## VII. Resolution & Payout Mechanics
- ResolutionManager finalizes outcomes.
- PredictionMarket stores bets and calculates winners.
- RewardDistributor receives protocol fees and splits them.

**Global parameter:** resolutionWindow = 48h (adjustable).
Claim-based payouts (`claimWinnings()`); safe & gas-efficient.

## VIII. Reward Distributor & Treasury
Splits market fees into four destinations:

| Share | Recipient | Adjustable |
|--------|------------|------------|
| Creator | market creator | per market/category |
| Treasury | team wallet | global BPS |
| Staker Incentive | reserved for NFT staking | global BPS |
| Extra Beneficiary | toggleable optional address | flexible BPS + on/off |

Manual claims:
- `claimCreatorRewards()` (batch supported)
- `withdrawTreasury()`
- `claimBeneficiary()`

## IX. Access Control & Blacklist
- Role and blacklist management via AccessControlManager.
- On-chain enforcement: `require(!isBlacklisted(msg.sender))`.
- Front-end may also block wallet connection for UX.

## X. Registry System
**Single Master Registry** — one address book for all modules.

| Key | Module |
|-----|---------|
| PARAMETER_STORAGE | ParameterStorage |
| ACCESS_CONTROL | AccessControlManager |
| MARKET_FACTORY | FlexibleMarketFactory |
| PROPOSAL_MANAGER | ProposalManager |
| RESOLUTION_MANAGER | ResolutionManager |
| REWARD_DISTRIBUTOR | RewardDistributor |
| TEAM_TREASURY | treasury wallet |

Functions:
- `setContract(bytes32 key, address addr)`
- `getContract(bytes32 key)`
- `transferOwnership(address newOwner)`

Event: `ContractUpdated`.

## XI. Lifecycle & Upgrade Flow
| Phase | Description | Owner |
|--------|--------------|--------|
| V0 Bootstrap | local deployment / testing | hot wallet |
| V1 Launch | mainnet operational | Vultisig multisig |
| V2 Community | off-chain proposals tune parameters | multisig + admins |
| V3 DAO | full on-chain governance control | DAO contract |

Upgrade recipe:
1. Deploy new module.
2. Update registry key.
3. Optionally migrate state.

## XII. Security Baseline
| Vector | Mitigation |
|---------|-------------|
| Unauthorized parameter change | role checks (owner/admin) |
| Reentrancy | nonReentrant modifiers |
| Overflow | Solidity >=0.8 safe math |
| Address spoofing | registry + event audits |
| Fee abuse | guardrails (+ experimental bypass) |
| Global freeze | emergencyPause toggle |
| Gas DoS | no user loops |
| Ownership transfer | explicit transferOwnership() |

## XIII. Future Modules & Roadmap
| Version | Additions |
|----------|------------|
| V1.1 | weighted votes / reputation |
| V1.2 | off-chain comment → resolution triggers |
| V2.0 | NFT staking integration |
| V3.0 | multi-outcome markets + on-chain DAO |
| V4.0 | oracles / dispute resolution layer |
| V5.0 | cross-chain market mirroring |

## XIV. Chain & Token
- Network: BasedAI Chain ID 32323
- Native token: $BASED
- All fees, bonds, and rewards in $BASED.

## XV. Event-Driven Analytics
Frontend and explorer rely on events for dashboards.

## XVI. Economic Flow
```
Users bet → Market holds funds
     ↓
ResolutionManager finalizes outcome
     ↓
PredictionMarket → RewardDistributor (fees)
     ↓
Distributor splits → creator / treasury / staker-reserve / optional beneficiary
     ↓
Claim-based withdrawals
```
flexible factory template
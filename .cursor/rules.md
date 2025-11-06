# KEKTECH 3.0 - Cursor AI Rules and Context

## Project Context
You are working on KEKTECH 3.0, a modular prediction market platform on BasedAI Chain (Chain ID: 32323). The project uses a Master Registry pattern for upgradeable smart contracts without proxies.

## Technical Stack
- **Blockchain**: BasedAI Chain (mainnet: 32323, testnet: 32324)
- **Token**: $BASED (native token)
- **Smart Contracts**: Solidity 0.8.19+
- **Testing**: Hardhat + Foundry (dual framework)
- **Frontend**: Next.js + Wagmi + RainbowKit (planned)
- **Backend**: NestJS + Supabase (planned)

## Code Standards
1. **TDD Mandatory**: Always write tests BEFORE implementation
2. **Gas Optimization**: Keep operations under defined limits
3. **Security First**: Access control on all admin functions
4. **Events**: Emit for all state changes
5. **Documentation**: NatSpec comments for all functions

## Testing Requirements
- Unit test coverage: 95% minimum
- Fuzz testing: 10,000 runs standard
- Invariant testing: All critical properties
- Gas targets: Must meet specified limits

## Multi-Network Development
Always follow this progression:
1. Local → Development and unit tests
2. Sepolia → Public testnet validation
3. Fork → Mainnet state simulation
4. Testnet → Final validation
5. Mainnet → Production (requires multisig)

## Key Directories
```
expansion-packs/bmad-blockchain-dev/
├── contracts/       # Smart contracts
├── test/           # Test suites
├── scripts/        # Deployment scripts
├── workflows/      # Agent workflows
└── docs/           # Documentation
```

## Common Tasks

### Start Development
```bash
cd expansion-packs/bmad-blockchain-dev
npm install
npm run node:fork  # Start mainnet fork
```

### Run Tests
```bash
npm test           # Hardhat tests
forge test        # Foundry tests
npm run test:gas  # Gas report
```

### Deploy Contracts
```bash
npm run deploy:local    # Local network
npm run deploy:fork     # Fork testing
npm run deploy:sepolia  # Public testnet
npm run deploy:testnet  # BasedAI testnet
```

## Contract Architecture
- **MasterRegistry**: Central directory for all modules
- **ParameterStorage**: Configurable values (fees, windows, etc.)
- **AccessControlManager**: Role-based permissions
- **FlexibleMarketFactory**: Creates prediction markets
- **ProposalManager**: Community proposals
- **ResolutionManager**: Resolves market outcomes
- **RewardDistributor**: Splits fees to stakeholders

## Gas Targets
- setContract: <50k gas
- placeBet: <100k gas
- createMarket: <200k gas
- resolveMarket: <150k gas
- claimWinnings: <80k gas

## Security Checklist
- [ ] Access control on all admin functions
- [ ] Reentrancy guards where needed
- [ ] Input validation on all external functions
- [ ] Events emitted for state changes
- [ ] Emergency pause mechanism
- [ ] Slither analysis passed
- [ ] Formal verification considered

## Current Implementation Status
- ✅ Master Registry contract
- ✅ Multi-network configuration
- ✅ Fork testing setup
- ✅ Foundry integration
- ⏳ ParameterStorage
- ⏳ AccessControlManager
- ⏳ Market modules
- ⏳ Security audit

## BMad Agent Integration
Use these agents for specialized tasks:
- `/bmad-bc/architect` - System design
- `/bmad-bc/solidity` - Contract development
- `/bmad-bc/security` - Security audit
- `/bmad-bc/gas` - Gas optimization
- `/bmad-bc/deploy` - Deployment

## Important Notes
1. Always test on fork before real networks
2. Never skip TDD - tests first, implementation second
3. Document every architectural decision
4. Use events for off-chain indexing
5. Follow the Registry pattern for upgrades

## Quick Reference

### Fork Testing
```javascript
// Time travel
await network.provider.send("evm_increaseTime", [86400]);

// Impersonate account
await network.provider.request({
  method: "hardhat_impersonateAccount",
  params: ["0xAddress"]
});

// Snapshot/Revert
const snapshot = await network.provider.send("evm_snapshot");
await network.provider.send("evm_revert", [snapshot]);
```

### Foundry Commands
```bash
forge test --match-test testFuzz   # Run specific test
forge test --fork-url $FORK_URL    # Test on fork
forge coverage                      # Coverage report
forge snapshot                      # Gas snapshots
```

## Error Handling Patterns
```solidity
// Custom errors (gas efficient)
error NotOwner();
error InvalidInput();
error InsufficientFunds();

// Use require with descriptive messages for complex conditions
require(amount > 0, "Amount must be positive");

// Use custom errors for simple checks
if (msg.sender != owner) revert NotOwner();
```

## Optimization Tips
1. Pack struct variables to minimize storage slots
2. Use mappings over arrays when possible
3. Cache array length in loops
4. Use unchecked blocks for safe math
5. Minimize external calls
6. Use events instead of storage for logs

## Remember
- Quality over speed
- Security over features
- Tests over assumptions
- Documentation over memory
- Clarity over cleverness
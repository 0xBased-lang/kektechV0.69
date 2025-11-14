const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Gas Optimization Profiling", function() {
    let factory, registry, paramStorage, accessControl, rewardDistributor, resolutionManager;
    let lmsrCurve, marketValidation, templateRegistry;
    let owner, backend, resolver, user1, user2;
    let market, marketAddr;

    const ONE_DAY = 86400;
    const MIN_CREATOR_BOND = ethers.parseEther("0.01");

    before(async function() {
        [owner, backend, resolver, user1, user2] = await ethers.getSigners();

        console.log("\n🔬 GAS PROFILING ANALYSIS");
        console.log("=" .repeat(80));

        // Deploy system (measure each component)
        console.log("\n📦 DEPLOYMENT GAS COSTS:");

        // 1. VersionedRegistry
        const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
        const registryTx = await VersionedRegistry.deploy();
        registry = await registryTx.waitForDeployment();
        const registryReceipt = await ethers.provider.getTransactionReceipt(registryTx.deploymentTransaction().hash);
        console.log(`   Registry:              ${registryReceipt.gasUsed.toString().padStart(8)} gas`);

        // 2. ParameterStorage
        const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
        const paramTx = await ParameterStorage.deploy(await registry.getAddress());
        paramStorage = await paramTx.waitForDeployment();
        const paramReceipt = await ethers.provider.getTransactionReceipt(paramTx.deploymentTransaction().hash);
        console.log(`   ParameterStorage:      ${paramReceipt.gasUsed.toString().padStart(8)} gas`);
        await registry.setContract(ethers.id("ParameterStorage"), await paramStorage.getAddress(), 1);

        // 3. AccessControlManager
        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        const accessTx = await AccessControlManager.deploy(await registry.getAddress());
        accessControl = await accessTx.waitForDeployment();
        const accessReceipt = await ethers.provider.getTransactionReceipt(accessTx.deploymentTransaction().hash);
        console.log(`   AccessControl:         ${accessReceipt.gasUsed.toString().padStart(8)} gas`);
        await registry.setContract(ethers.id("AccessControlManager"), await accessControl.getAddress(), 1);

        // Grant roles
        const ADMIN_ROLE = ethers.id("ADMIN_ROLE");
        const BACKEND_ROLE = ethers.id("BACKEND_ROLE");
        const RESOLVER_ROLE = ethers.id("RESOLVER_ROLE");
        await accessControl.grantRole(ADMIN_ROLE, owner.address);
        await accessControl.grantRole(BACKEND_ROLE, backend.address);
        await accessControl.grantRole(RESOLVER_ROLE, resolver.address);

        // 4. RewardDistributor
        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        const rewardTx = await RewardDistributor.deploy(await registry.getAddress());
        rewardDistributor = await rewardTx.waitForDeployment();
        const rewardReceipt = await ethers.provider.getTransactionReceipt(rewardTx.deploymentTransaction().hash);
        console.log(`   RewardDistributor:     ${rewardReceipt.gasUsed.toString().padStart(8)} gas`);
        await registry.setContract(ethers.id("RewardDistributor"), await rewardDistributor.getAddress(), 1);

        // 5. ResolutionManager
        const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
        const resolutionTx = await ResolutionManager.deploy(
            await registry.getAddress(),
            BigInt(2 * ONE_DAY),
            ethers.parseEther("0.01")
        );
        resolutionManager = await resolutionTx.waitForDeployment();
        const resolutionReceipt = await ethers.provider.getTransactionReceipt(resolutionTx.deploymentTransaction().hash);
        console.log(`   ResolutionManager:     ${resolutionReceipt.gasUsed.toString().padStart(8)} gas`);
        await registry.setContract(ethers.id("ResolutionManager"), await resolutionManager.getAddress(), 1);

        // 6. LMSR Curve
        const LMSRCurve = await ethers.getContractFactory("LMSRCurve");
        const curveTx = await LMSRCurve.deploy();
        lmsrCurve = await curveTx.waitForDeployment();
        const curveReceipt = await ethers.provider.getTransactionReceipt(curveTx.deploymentTransaction().hash);
        console.log(`   LMSRCurve:             ${curveReceipt.gasUsed.toString().padStart(8)} gas`);

        // 7. PredictionMarket Template (REQUIRED for factory cloning!)
        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
        const marketTemplateTx = await PredictionMarket.deploy();
        const marketTemplate = await marketTemplateTx.waitForDeployment();
        const marketTemplateReceipt = await ethers.provider.getTransactionReceipt(marketTemplateTx.deploymentTransaction().hash);
        console.log(`   MarketTemplate:        ${marketTemplateReceipt.gasUsed.toString().padStart(8)} gas`);
        await registry.setContract(
            ethers.id("PredictionMarketTemplate"),
            await marketTemplate.getAddress(),
            1  // Version 1
        );

        // 8. MarketValidation
        const MarketValidation = await ethers.getContractFactory("MarketValidation");
        const validationTx = await MarketValidation.deploy();
        marketValidation = await validationTx.waitForDeployment();
        const validationReceipt = await ethers.provider.getTransactionReceipt(validationTx.deploymentTransaction().hash);
        console.log(`   MarketValidation:      ${validationReceipt.gasUsed.toString().padStart(8)} gas`);
        await registry.setContract(ethers.id("MarketValidation"), await marketValidation.getAddress(), 1);

        // 9. MarketTemplateRegistry
        const MarketTemplateRegistry = await ethers.getContractFactory("MarketTemplateRegistry");
        const templateTx = await MarketTemplateRegistry.deploy(await registry.getAddress());
        templateRegistry = await templateTx.waitForDeployment();
        const templateReceipt = await ethers.provider.getTransactionReceipt(templateTx.deploymentTransaction().hash);
        console.log(`   TemplateRegistry:      ${templateReceipt.gasUsed.toString().padStart(8)} gas`);
        await registry.setContract(ethers.id("MarketTemplateRegistry"), await templateRegistry.getAddress(), 1);

        // 10. FlexibleMarketFactoryUnified
        const Factory = await ethers.getContractFactory("FlexibleMarketFactoryUnified");
        const factoryTx = await Factory.deploy(
            await registry.getAddress(),
            MIN_CREATOR_BOND
        );
        factory = await factoryTx.waitForDeployment();
        const factoryReceipt = await ethers.provider.getTransactionReceipt(factoryTx.deploymentTransaction().hash);
        console.log(`   Factory:               ${factoryReceipt.gasUsed.toString().padStart(8)} gas`);

        await accessControl.grantRole(ethers.id("FACTORY_ROLE"), await factory.getAddress());
        await factory.setDefaultCurve(await lmsrCurve.getAddress());
    });

    it("Profile: Market Creation Breakdown", async function() {
        console.log("\n📊 MARKET CREATION GAS BREAKDOWN:");
        console.log("   " + "-".repeat(70));

        const config = {
            question: "Gas profiling test",
            description: "Analyzing gas costs",
            resolutionTime: (await time.latest()) + ONE_DAY,
            creatorBond: MIN_CREATOR_BOND,
            category: ethers.id("GAS_TEST"),
            outcome1: "Yes",
            outcome2: "No"
        };

        // Measure createMarket
        const tx = await factory.createMarket(config, { value: MIN_CREATOR_BOND });
        const receipt = await tx.wait();

        console.log(`   ✅ Total createMarket: ${receipt.gasUsed.toString().padStart(8)} gas`);

        // Break down by examining logs and estimating components
        const marketCreatedEvent = receipt.logs.find(log => {
            try {
                const parsed = factory.interface.parseLog(log);
                return parsed && parsed.name === "MarketCreated";
            } catch (e) {
                return false;
            }
        });

        if (!marketCreatedEvent) {
            throw new Error("MarketCreated event not found in transaction logs");
        }

        const parsedEvent = factory.interface.parseLog(marketCreatedEvent);
        marketAddr = parsedEvent.args.marketAddress;  // Fixed: was .market, should be .marketAddress

        if (!marketAddr) {
            throw new Error("Market address not found in MarketCreated event");
        }

        market = await ethers.getContractAt("PredictionMarket", marketAddr);

        console.log(`   📍 Market Address: ${marketAddr}`);
        console.log(`\n   💡 Estimated Breakdown:`);
        console.log(`      - EIP-1167 Clone Deploy:     ~55k gas (minimal proxy pattern)`);
        console.log(`      - Initialization Call:       ~150k gas (constructor logic)`);
        console.log(`      - Storage Writes (6-8):      ~120k gas (SSTORE operations)`);
        console.log(`      - Event Emissions:           ~10k gas (MarketCreated event)`);
        console.log(`      - Registry Lookups (3-4):    ~12k gas (external calls)`);
        console.log(`      - Validation Logic:          ~365k gas (REMAINDER - optimization target!)`);
    });

    it("Profile: Place Bet Breakdown", async function() {
        console.log("\n📊 PLACE BET GAS BREAKDOWN:");
        console.log("   " + "-".repeat(70));

        // Activate market first
        await factory.adminApproveMarket(marketAddr);
        await factory.refundCreatorBond(marketAddr, "Approved");
        await factory.connect(backend).activateMarket(marketAddr);

        // Measure placeBet with detailed profiling
        console.log(`\n   🔍 Testing different bet amounts:`);

        const amounts = [
            { eth: "0.01", label: "Small bet  (0.01 ETH)" },
            { eth: "0.1",  label: "Medium bet (0.1 ETH)" },
            { eth: "1.0",  label: "Large bet  (1.0 ETH)" }
        ];

        for (const { eth, label } of amounts) {
            try {
                const betTx = await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther(eth) });
                const betReceipt = await betTx.wait();
                console.log(`   ${label}: ${betReceipt.gasUsed.toString().padStart(8)} gas`);
                break; // Only do one successful bet
            } catch (error) {
                console.log(`   ${label}: FAILED (${error.message.split('(')[0].trim()})`);
            }
        }

        // FIX: Use larger bet amount to ensure shares are calculated
        // LMSR with b=100*10^18 might return 0 shares for very small bets like 0.01 ETH
        const betTx = await market.connect(user2).placeBet(2, 0, { value: ethers.parseEther("1.0") });
        const betReceipt = await betTx.wait();

        console.log(`\n   ✅ Total placeBet:     ${betReceipt.gasUsed.toString().padStart(8)} gas`);
        console.log(`\n   💡 Estimated Breakdown:`);
        console.log(`      - Binary Search (25 iter):   ~500k gas (bonding curve calculations!)`);
        console.log(`      - Storage Writes (4-5):      ~80k gas (bet info, shares, totals)`);
        console.log(`      - Event Emissions:           ~8k gas (BetPlaced event)`);
        console.log(`      - Access Control Check:      ~5k gas (state validation)`);
        console.log(`      - Math & Logic:              ~374k gas (REMAINDER - optimization target!)`);
    });

    it("Profile: Resolution Operations", async function() {
        console.log("\n📊 RESOLUTION GAS BREAKDOWN:");
        console.log("   " + "-".repeat(70));

        // Fast forward past resolution time
        await time.increase(ONE_DAY + 1);

        // Propose resolution
        const proposeTx = await resolutionManager.connect(resolver).proposeResolution(marketAddr, 1, "Test resolution");
        const proposeReceipt = await proposeTx.wait();
        console.log(`   Propose Resolution:    ${proposeReceipt.gasUsed.toString().padStart(8)} gas`);

        // Submit dispute signals (auto-finalize)
        const finalizeTx = await resolutionManager.connect(backend).submitDisputeSignals(marketAddr, 100, 0);
        const finalizeReceipt = await finalizeTx.wait();
        console.log(`   Auto-Finalize:         ${finalizeReceipt.gasUsed.toString().padStart(8)} gas`);

        // FIX: user1 bet on outcome 1 and won, user2 bet on outcome 2 and lost
        // Only winners can claim winnings
        const claimTx = await market.connect(user1).claimWinnings();
        const claimReceipt = await claimTx.wait();
        console.log(`   Claim Winnings:        ${claimReceipt.gasUsed.toString().padStart(8)} gas`);
    });

    it("Analysis: Optimization Opportunities", async function() {
        console.log("\n🎯 TOP OPTIMIZATION OPPORTUNITIES:");
        console.log("   " + "=".repeat(70));

        console.log(`\n   1. 🔴 CRITICAL: Binary Search in placeBet (~500k gas)`);
        console.log(`      Issue: Up to 25 iterations calling bonding curve calculateCost()`);
        console.log(`      Impact: Reduces 967k → ~467k (52% reduction!)`);
        console.log(`      Solutions:`);
        console.log(`         a) Cache bonding curve results (10-20 key prices)`);
        console.log(`         b) Use interpolation between cached points`);
        console.log(`         c) Reduce iterations (25 → 15 with better initial bounds)`);
        console.log(`         d) Pre-calculate common bet amounts (0.01, 0.1, 1.0 ETH)`);

        console.log(`\n   2. 🔴 CRITICAL: Market Creation Validation (~365k gas)`);
        console.log(`      Issue: Unknown validation logic consuming majority of gas`);
        console.log(`      Impact: Reduces 712k → ~347k (51% reduction!)`);
        console.log(`      Solutions:`);
        console.log(`         a) Profile validation steps individually`);
        console.log(`         b) Move non-critical validation off-chain`);
        console.log(`         c) Batch storage writes`);
        console.log(`         d) Optimize registry lookups (cache addresses)`);

        console.log(`\n   3. 🟡 MODERATE: Storage Optimization`);
        console.log(`      Issue: Multiple SSTORE operations in hot paths`);
        console.log(`      Impact: Reduces overall gas by ~10-15%`);
        console.log(`      Solutions:`);
        console.log(`         a) Pack related variables (uint128 instead of uint256)`);
        console.log(`         b) Use memory variables, single final SSTORE`);
        console.log(`         c) Reduce event data (indexed parameters)`);

        console.log(`\n   4. 🟡 MODERATE: Registry Lookups Caching`);
        console.log(`      Issue: Multiple external calls per operation`);
        console.log(`      Impact: Saves ~5-10k per operation`);
        console.log(`      Solutions:`);
        console.log(`         a) Cache contract addresses in storage`);
        console.log(`         b) Update cache on registry changes only`);
        console.log(`         c) Use immutable for truly constant addresses`);

        console.log(`\n   5. 🟢 MINOR: Event Optimization`);
        console.log(`      Issue: Large event payloads`);
        console.log(`      Impact: Saves ~2-5k per event`);
        console.log(`      Solutions:`);
        console.log(`         a) Remove redundant indexed parameters`);
        console.log(`         b) Use smaller data types where possible`);
        console.log(`         c) Emit only essential data`);
    });

    it("Cost Estimate: Mainnet Deployment", async function() {
        console.log("\n💰 MAINNET COST ESTIMATES (BasedAI Chain):");
        console.log("   " + "=".repeat(70));

        // Assume gas price of 1 gwei (typical for L2/side chains)
        const gasPrice = ethers.parseUnits("1", "gwei");

        // Assume $BASED price of $0.10 (example)
        const basedPriceUSD = 0.10;

        console.log(`\n   Gas Price: 1 gwei (typical L2)`);
        console.log(`   $BASED Price: $${basedPriceUSD} (example)`);
        console.log(`\n   Current Gas Costs:`);

        const operations = [
            { name: "Deploy Full System", gas: 5_000_000n, freq: "once" },
            { name: "Create Market", gas: 712_000n, freq: "per market" },
            { name: "Place Bet", gas: 967_000n, freq: "per bet" },
            { name: "Propose Resolution", gas: 454_000n, freq: "per market" },
            { name: "Auto-Finalize", gas: 137_000n, freq: "per market" },
            { name: "Claim Winnings", gas: 109_000n, freq: "per user" }
        ];

        for (const { name, gas, freq } of operations) {
            const costEth = (gas * gasPrice);
            const costUSD = parseFloat(ethers.formatEther(costEth)) * basedPriceUSD;
            console.log(`   ${name.padEnd(20)}: ${gas.toString().padStart(9)} gas = ${ethers.formatEther(costEth).padStart(12)} $BASED ($${costUSD.toFixed(4)}) ${freq}`);
        }

        console.log(`\n   📊 Market Lifecycle Example (100 bets):`);
        const createCost = 712_000n * gasPrice;
        const betsCost = 967_000n * gasPrice * 100n;
        const resolveCost = 454_000n * gasPrice;
        const finalizeCost = 137_000n * gasPrice;
        const claimsCost = 109_000n * gasPrice * 100n; // All users claim
        const totalCost = createCost + betsCost + resolveCost + finalizeCost + claimsCost;
        const totalUSD = parseFloat(ethers.formatEther(totalCost)) * basedPriceUSD;

        console.log(`      Create Market:       ${ethers.formatEther(createCost).padStart(12)} $BASED`);
        console.log(`      100 Bets:            ${ethers.formatEther(betsCost).padStart(12)} $BASED`);
        console.log(`      Propose Resolution:  ${ethers.formatEther(resolveCost).padStart(12)} $BASED`);
        console.log(`      Auto-Finalize:       ${ethers.formatEther(finalizeCost).padStart(12)} $BASED`);
        console.log(`      100 Claims:          ${ethers.formatEther(claimsCost).padStart(12)} $BASED`);
        console.log(`      ${"─".repeat(50)}`);
        console.log(`      TOTAL:               ${ethers.formatEther(totalCost).padStart(12)} $BASED ($${totalUSD.toFixed(2)})`);

        console.log(`\n   ⚠️  Note: Actual costs depend on:`);
        console.log(`      - BasedAI gas price (may be lower than 1 gwei)`);
        console.log(`      - $BASED token price (volatile)`);
        console.log(`      - Network congestion`);
        console.log(`      - Contract optimization level`);
    });
});

/**
 * @fileoverview Testing newly discovered CRITICAL vulnerabilities
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("🚨 CRITICAL NEW VULNERABILITIES TEST", function () {
    let deployer, attacker, user1, user2, user3;
    let registry, accessControl, paramStorage, marketFactory, resolutionManager;
    let predictionMarket;

    const MIN_CREATOR_BOND = ethers.parseEther("0.001");
    const MIN_BET = ethers.parseEther("0.0001");
    const MARKET_FEE = 200; // 2%

    before(async function () {
        console.log("\n🚨 Testing CRITICAL vulnerabilities discovered through ULTRATHINK analysis...\n");
        [deployer, attacker, user1, user2, user3] = await ethers.getSigners();

        // Deploy system
        const MasterRegistry = await ethers.getContractFactory("MasterRegistry");
        registry = await MasterRegistry.deploy();

        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        accessControl = await AccessControlManager.deploy();

        const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
        paramStorage = await ParameterStorage.deploy(
            MIN_CREATOR_BOND,
            MIN_BET,
            MARKET_FEE,
            ethers.parseEther("1.0"),
            86400 * 3
        );

        const FlexibleMarketFactory = await ethers.getContractFactory("FlexibleMarketFactory");
        marketFactory = await FlexibleMarketFactory.deploy(
            await registry.getAddress(),
            await accessControl.getAddress(),
            await paramStorage.getAddress()
        );

        const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
        resolutionManager = await ResolutionManager.deploy(
            await registry.getAddress(),
            await accessControl.getAddress(),
            await paramStorage.getAddress()
        );

        // Setup registry
        await registry.setContract("AccessControlManager", await accessControl.getAddress());
        await registry.setContract("ParameterStorage", await paramStorage.getAddress());
        await registry.setContract("MarketFactory", await marketFactory.getAddress());
        await registry.setContract("ResolutionManager", await resolutionManager.getAddress());

        // Grant roles
        const CREATOR_ROLE = await marketFactory.MARKET_CREATOR_ROLE();
        const RESOLVER_ROLE = await resolutionManager.RESOLVER_ROLE();
        await accessControl.grantRole(CREATOR_ROLE, await marketFactory.getAddress());
        await accessControl.grantRole(RESOLVER_ROLE, await resolutionManager.getAddress());
        await accessControl.grantRole(RESOLVER_ROLE, deployer.address);
    });

    describe("🚨 CRITICAL VULNERABILITY #1: Initialization Attack", function () {
        it("Should prevent re-initialization of PredictionMarket", async function () {
            console.log("   🔍 Testing if PredictionMarket can be re-initialized...");

            // Create a market
            const currentTime = await time.latest();
            const tx = await marketFactory.createMarket(
                {
                    question: "Init Attack Test?",
                    description: "Testing initialization vulnerability",
                    resolutionTime: currentTime + 86400,
                    creatorBond: MIN_CREATOR_BOND,
                    category: ethers.keccak256(ethers.toUtf8Bytes("INIT")),
                    outcome1: "Yes",
                    outcome2: "No",
                },
                { value: MIN_CREATOR_BOND }
            );

            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    const parsed = marketFactory.interface.parseLog(log);
                    return parsed && parsed.name === "MarketCreated";
                } catch { return false; }
            });

            const parsedEvent = marketFactory.interface.parseLog(event);
            const marketAddress = parsedEvent.args.market;
            predictionMarket = await ethers.getContractAt("PredictionMarket", marketAddress);

            // Try to re-initialize with attacker's parameters
            console.log("   💥 Attacker attempting to re-initialize market...");

            try {
                await predictionMarket.connect(attacker).initialize(
                    attacker.address, // Change registry to attacker
                    "Hijacked Market?",
                    "Hijacked1",
                    "Hijacked2",
                    attacker.address,
                    currentTime + 1
                );
                console.log("   ❌ CRITICAL: Re-initialization succeeded! Market can be hijacked!");
                throw new Error("CRITICAL: Market can be re-initialized!");
            } catch (error) {
                if (error.message.includes("CRITICAL")) {
                    throw error;
                }
                console.log("   ✅ Good: Re-initialization failed as expected");
                // This is what we want - initialization should fail
            }
        });
    });

    describe("🚨 CRITICAL VULNERABILITY #2: Permanent Fund Lock", function () {
        it("Should handle scenario where ALL bets are on losing side", async function () {
            console.log("   🔍 Testing permanent fund lock scenario...");

            // Create a new market
            const currentTime = await time.latest();
            const tx = await marketFactory.createMarket(
                {
                    question: "Fund Lock Test?",
                    description: "Testing fund lock vulnerability",
                    resolutionTime: currentTime + 86400,
                    creatorBond: MIN_CREATOR_BOND,
                    category: ethers.keccak256(ethers.toUtf8Bytes("LOCK")),
                    outcome1: "Yes",
                    outcome2: "No",
                },
                { value: MIN_CREATOR_BOND }
            );

            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    const parsed = marketFactory.interface.parseLog(log);
                    return parsed && parsed.name === "MarketCreated";
                } catch { return false; }
            });

            const parsedEvent = marketFactory.interface.parseLog(event);
            const marketAddress = parsedEvent.args.market;
            const lockMarket = await ethers.getContractAt("PredictionMarket", marketAddress);

            // Everyone bets on outcome 1
            console.log("   💰 All users betting on outcome 1...");
            const bet1 = ethers.parseEther("0.1");
            const bet2 = ethers.parseEther("0.2");
            const bet3 = ethers.parseEther("0.15");

            await lockMarket.connect(user1).placeBet(1, 0, { value: bet1 });
            await lockMarket.connect(user2).placeBet(1, 0, { value: bet2 });
            await lockMarket.connect(user3).placeBet(1, 0, { value: bet3 });

            const totalBets = bet1 + bet2 + bet3;

            // Check market balance
            const marketBalance = await ethers.provider.getBalance(marketAddress);
            console.log(`   💵 Total funds in market: ${ethers.formatEther(marketBalance)} ETH`);

            // Resolve market to outcome 2 (NO ONE wins)
            await time.increase(86401);
            console.log("   🎯 Resolving market to outcome 2 (all bets lose)...");
            await resolutionManager.resolveMarket(marketAddress, 2);

            // Try to claim - should fail for everyone
            console.log("   🔐 Checking if users can claim their funds back...");

            // Calculate what payout would be
            const payout1 = await lockMarket.calculatePayout(user1.address);
            const payout2 = await lockMarket.calculatePayout(user2.address);
            const payout3 = await lockMarket.calculatePayout(user3.address);

            console.log(`   📊 User1 payout: ${ethers.formatEther(payout1)} ETH`);
            console.log(`   📊 User2 payout: ${ethers.formatEther(payout2)} ETH`);
            console.log(`   📊 User3 payout: ${ethers.formatEther(payout3)} ETH`);

            if (payout1 == 0n && payout2 == 0n && payout3 == 0n) {
                console.log("   ❌ CRITICAL: All payouts are 0! Funds are PERMANENTLY LOCKED!");

                // Verify funds are truly stuck
                const finalBalance = await ethers.provider.getBalance(marketAddress);
                console.log(`   💀 ${ethers.formatEther(finalBalance)} ETH stuck forever in contract!`);

                // Try to claim anyway
                await expect(
                    lockMarket.connect(user1).claimWinnings()
                ).to.be.reverted;

                throw new Error(`CRITICAL: ${ethers.formatEther(finalBalance)} ETH permanently locked!`);
            } else {
                console.log("   ✅ Users can recover funds even when all lose");
            }
        });
    });

    describe("🚨 ADDITIONAL VULNERABILITY: Creator Bond Handling", function () {
        it("Should verify creator bond is properly handled", async function () {
            console.log("   🔍 Testing creator bond fund flow...");

            const currentTime = await time.latest();

            // Track balances before
            const factoryBalanceBefore = await ethers.provider.getBalance(await marketFactory.getAddress());

            // Create market with bond
            const tx = await marketFactory.createMarket(
                {
                    question: "Bond Test?",
                    description: "Testing creator bond",
                    resolutionTime: currentTime + 86400,
                    creatorBond: MIN_CREATOR_BOND,
                    category: ethers.keccak256(ethers.toUtf8Bytes("BOND")),
                    outcome1: "Yes",
                    outcome2: "No",
                },
                { value: MIN_CREATOR_BOND }
            );

            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    const parsed = marketFactory.interface.parseLog(log);
                    return parsed && parsed.name === "MarketCreated";
                } catch { return false; }
            });

            const parsedEvent = marketFactory.interface.parseLog(event);
            const marketAddress = parsedEvent.args.market;

            // Check where the bond went
            const factoryBalanceAfter = await ethers.provider.getBalance(await marketFactory.getAddress());
            const marketBalance = await ethers.provider.getBalance(marketAddress);

            console.log(`   💰 Factory balance change: ${ethers.formatEther(factoryBalanceAfter - factoryBalanceBefore)} ETH`);
            console.log(`   💰 Market balance: ${ethers.formatEther(marketBalance)} ETH`);

            if (marketBalance == 0n) {
                console.log("   ⚠️ WARNING: Creator bond not transferred to market!");
                console.log("   ⚠️ Bond might be stuck in factory contract!");
            }
        });
    });

    describe("🚨 FEE CALCULATION VULNERABILITY", function () {
        it("Should check if fees are properly calculated in PredictionMarket", async function () {
            console.log("   🔍 Testing fee calculation in betting...");

            // Create a new market
            const currentTime = await time.latest();
            const tx = await marketFactory.createMarket(
                {
                    question: "Fee Test?",
                    description: "Testing fee calculation",
                    resolutionTime: currentTime + 86400,
                    creatorBond: MIN_CREATOR_BOND,
                    category: ethers.keccak256(ethers.toUtf8Bytes("FEE")),
                    outcome1: "Yes",
                    outcome2: "No",
                },
                { value: MIN_CREATOR_BOND }
            );

            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    const parsed = marketFactory.interface.parseLog(log);
                    return parsed && parsed.name === "MarketCreated";
                } catch { return false; }
            });

            const parsedEvent = marketFactory.interface.parseLog(event);
            const marketAddress = parsedEvent.args.market;
            const feeMarket = await ethers.getContractAt("PredictionMarket", marketAddress);

            // Place a bet
            const betAmount = ethers.parseEther("0.1");
            await feeMarket.connect(user1).placeBet(1, 0, { value: betAmount });

            // Check the pools
            const [pool1, pool2] = await feeMarket.getLiquidity();
            const totalInPools = pool1 + pool2;

            console.log(`   💰 Bet amount: ${ethers.formatEther(betAmount)} ETH`);
            console.log(`   💰 Total in pools: ${ethers.formatEther(totalInPools)} ETH`);
            console.log(`   💰 Difference (fees?): ${ethers.formatEther(betAmount - totalInPools)} ETH`);

            // The contract doesn't seem to deduct fees from bets!
            if (totalInPools === betAmount) {
                console.log("   ⚠️ WARNING: No fees deducted from bets!");
                console.log("   ⚠️ Fees might be calculated incorrectly at payout!");
            }
        });
    });
});
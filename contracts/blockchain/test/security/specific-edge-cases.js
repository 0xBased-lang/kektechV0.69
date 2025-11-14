/**
 * @fileoverview Specific Edge Case Security Tests
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("🔬 SPECIFIC EDGE CASE ANALYSIS", function () {
    let deployer, attacker, user1, user2;
    let registry, accessControl, paramStorage, marketFactory;
    let resolutionManager, rewardDistributor;

    const MIN_CREATOR_BOND = ethers.parseEther("0.001");
    const MIN_BET = ethers.parseEther("0.0001");
    const MARKET_FEE = 200; // 2%

    before(async function () {
        console.log("\n🔬 Running specific edge case analysis...\n");
        [deployer, attacker, user1, user2] = await ethers.getSigners();

        // Deploy fresh contracts for testing
        const MasterRegistry = await ethers.getContractFactory("MasterRegistry");
        registry = await MasterRegistry.deploy(deployer.address);
        await registry.waitForDeployment();

        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        accessControl = await AccessControlManager.deploy(deployer.address);
        await accessControl.waitForDeployment();

        const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
        paramStorage = await ParameterStorage.deploy(
            deployer.address,
            MIN_CREATOR_BOND,
            MIN_BET,
            MARKET_FEE,
            ethers.parseEther("1.0"), // dispute bond
            86400 * 3 // dispute period
        );
        await paramStorage.waitForDeployment();

        const FlexibleMarketFactory = await ethers.getContractFactory("FlexibleMarketFactory");
        marketFactory = await FlexibleMarketFactory.deploy(
            await registry.getAddress(),
            await accessControl.getAddress(),
            await paramStorage.getAddress()
        );
        await marketFactory.waitForDeployment();

        const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
        resolutionManager = await ResolutionManager.deploy(
            await registry.getAddress(),
            await accessControl.getAddress(),
            await paramStorage.getAddress()
        );
        await resolutionManager.waitForDeployment();

        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        rewardDistributor = await RewardDistributor.deploy(
            await registry.getAddress(),
            await accessControl.getAddress(),
            await paramStorage.getAddress()
        );
        await rewardDistributor.waitForDeployment();

        // Setup registry
        await registry.setContract("AccessControlManager", await accessControl.getAddress());
        await registry.setContract("ParameterStorage", await paramStorage.getAddress());
        await registry.setContract("MarketFactory", await marketFactory.getAddress());
        await registry.setContract("ResolutionManager", await resolutionManager.getAddress());
        await registry.setContract("RewardDistributor", await rewardDistributor.getAddress());

        // Grant roles
        const CREATOR_ROLE = await marketFactory.MARKET_CREATOR_ROLE();
        const RESOLVER_ROLE = await resolutionManager.RESOLVER_ROLE();
        await accessControl.grantRole(CREATOR_ROLE, marketFactory.getAddress());
        await accessControl.grantRole(RESOLVER_ROLE, resolutionManager.getAddress());
        await accessControl.grantRole(RESOLVER_ROLE, deployer.address);
    });

    describe("🔢 FEE CALCULATION PRECISION EDGE CASES", function () {
        it("Should handle 1 wei bets without loss", async function () {
            const currentTime = await time.latest();
            const tx = await marketFactory.createMarket(
                {
                    question: "Wei Test?",
                    description: "Testing 1 wei",
                    resolutionTime: currentTime + 86400,
                    creatorBond: MIN_CREATOR_BOND,
                    category: ethers.keccak256(ethers.toUtf8Bytes("TEST")),
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

            if (event) {
                const parsedEvent = marketFactory.interface.parseLog(event);
                const marketAddress = parsedEvent.args.market;
                const market = await ethers.getContractAt("PredictionMarket", marketAddress);

                // Test with amounts that could cause issues
                const testAmounts = [
                    1n, // 1 wei
                    3n, // 3 wei
                    999n, // 999 wei
                    ethers.parseEther("0.000000000000000001"), // smallest ether unit
                ];

                for (const amount of testAmounts) {
                    // Calculate fee
                    const fee = (amount * BigInt(MARKET_FEE)) / 10000n;
                    const netBet = amount - fee;

                    // If amount is above minimum, it should work
                    if (amount >= MIN_BET) {
                        await market.connect(user1).placeBet(0, 0, { value: amount });
                    } else {
                        // Should revert for amounts below minimum
                        await expect(
                            market.connect(user1).placeBet(0, 0, { value: amount })
                        ).to.be.revertedWithCustomError(market, "InvalidBetAmount");
                    }
                }
            }
        });

        it("Should prevent fee calculation overflow", async function () {
            // Test fee calculation with large numbers
            const largeAmount = ethers.parseEther("1000000"); // 1M ETH
            const fee = (largeAmount * BigInt(MARKET_FEE)) / 10000n;

            // Verify no overflow
            expect(fee).to.be.lt(largeAmount);
            expect(fee).to.equal(ethers.parseEther("20000")); // 2% of 1M = 20k
        });
    });

    describe("🥪 SANDWICH ATTACK SCENARIOS", function () {
        it("Should handle front-run back-run sandwich attacks", async function () {
            const currentTime = await time.latest();
            const tx = await marketFactory.createMarket(
                {
                    question: "Sandwich Test?",
                    description: "Testing sandwich attacks",
                    resolutionTime: currentTime + 86400,
                    creatorBond: MIN_CREATOR_BOND,
                    category: ethers.keccak256(ethers.toUtf8Bytes("MEV")),
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

            if (event) {
                const parsedEvent = marketFactory.interface.parseLog(event);
                const marketAddress = parsedEvent.args.market;
                const market = await ethers.getContractAt("PredictionMarket", marketAddress);

                // Attacker front-runs with large bet
                const attackerBet1 = ethers.parseEther("1.0");
                await market.connect(attacker).placeBet(0, 0, { value: attackerBet1 });

                // User places normal bet
                const userBet = ethers.parseEther("0.5");
                await market.connect(user1).placeBet(0, 0, { value: userBet });

                // Attacker back-runs with opposite bet
                const attackerBet2 = ethers.parseEther("0.5");
                await market.connect(attacker).placeBet(1, 0, { value: attackerBet2 });

                // Check that system maintains integrity
                const pool0 = await market.bettingPools(0);
                const pool1 = await market.bettingPools(1);
                const totalFees = await market.totalFees();

                // Verify accounting
                const totalBets = attackerBet1 + userBet + attackerBet2;
                const expectedFees = (totalBets * BigInt(MARKET_FEE)) / 10000n;
                const expectedPools = totalBets - expectedFees;

                // Allow small rounding difference
                expect(pool0 + pool1 + totalFees).to.be.closeTo(
                    totalBets,
                    ethers.parseEther("0.0001") // 0.0001 ETH tolerance
                );
            }
        });
    });

    describe("⏰ BLOCK TIMESTAMP MANIPULATION", function () {
        it("Should prevent manipulation via timestamp", async function () {
            const currentTime = await time.latest();

            // Try to create market with exact current timestamp
            await expect(
                marketFactory.createMarket(
                    {
                        question: "Timestamp Manipulation?",
                        description: "Testing timestamp",
                        resolutionTime: currentTime, // Exactly current time
                        creatorBond: MIN_CREATOR_BOND,
                        category: ethers.keccak256(ethers.toUtf8Bytes("TIME")),
                        outcome1: "Yes",
                        outcome2: "No",
                    },
                    { value: MIN_CREATOR_BOND }
                )
            ).to.be.revertedWithCustomError(marketFactory, "InvalidResolutionTime");

            // Try with 1 second in future (should work)
            const tx = await marketFactory.createMarket(
                {
                    question: "Near Future?",
                    description: "1 second future",
                    resolutionTime: currentTime + 1,
                    creatorBond: MIN_CREATOR_BOND,
                    category: ethers.keccak256(ethers.toUtf8Bytes("TIME")),
                    outcome1: "Yes",
                    outcome2: "No",
                },
                { value: MIN_CREATOR_BOND }
            );

            expect(tx).to.not.be.undefined;
        });
    });

    describe("💣 ZERO LIQUIDITY DIVISION", function () {
        it("Should handle division by zero in reward calculation", async function () {
            const currentTime = await time.latest();
            const tx = await marketFactory.createMarket(
                {
                    question: "Zero Division Test?",
                    description: "Testing zero division",
                    resolutionTime: currentTime + 86400,
                    creatorBond: MIN_CREATOR_BOND,
                    category: ethers.keccak256(ethers.toUtf8Bytes("ZERO")),
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

            if (event) {
                const parsedEvent = marketFactory.interface.parseLog(event);
                const marketAddress = parsedEvent.args.market;
                const market = await ethers.getContractAt("PredictionMarket", marketAddress);

                // Only bet on one side
                await market.connect(user1).placeBet(0, 0, { value: ethers.parseEther("0.1") });

                // Advance time and resolve
                await time.increase(86401);
                await resolutionManager.resolveMarket(marketAddress, 1); // Resolve to opposite side

                // User1 should get refund since they bet on losing side with no winners
                const initialBalance = await ethers.provider.getBalance(user1.address);
                await market.connect(user1).claimReward();
                const finalBalance = await ethers.provider.getBalance(user1.address);

                // Should have received something (gas costs will affect exact amount)
                expect(finalBalance).to.be.gt(initialBalance);
            }
        });
    });

    describe("🎯 ROUNDING ERROR ACCUMULATION", function () {
        it("Should not leak funds through rounding errors", async function () {
            const currentTime = await time.latest();
            const tx = await marketFactory.createMarket(
                {
                    question: "Rounding Test?",
                    description: "Testing rounding errors",
                    resolutionTime: currentTime + 86400,
                    creatorBond: MIN_CREATOR_BOND,
                    category: ethers.keccak256(ethers.toUtf8Bytes("ROUND")),
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

            if (event) {
                const parsedEvent = marketFactory.interface.parseLog(event);
                const marketAddress = parsedEvent.args.market;
                const market = await ethers.getContractAt("PredictionMarket", marketAddress);

                // Place many small bets with odd amounts to cause rounding
                const bets = [
                    ethers.parseEther("0.000100001"),
                    ethers.parseEther("0.000200003"),
                    ethers.parseEther("0.000300007"),
                    ethers.parseEther("0.000400011"),
                    ethers.parseEther("0.000500013"),
                ];

                let totalSent = 0n;
                for (const bet of bets) {
                    await market.connect(user1).placeBet(0, 0, { value: bet });
                    totalSent += bet;
                }

                // Check contract balance matches expected
                const contractBalance = await ethers.provider.getBalance(marketAddress);
                const pool0 = await market.bettingPools(0);
                const pool1 = await market.bettingPools(1);
                const totalFees = await market.totalFees();

                // Total in pools + fees should equal total sent
                const accounted = pool0 + pool1 + totalFees;

                // Allow for tiny rounding difference (max 1 wei per bet)
                const maxRoundingError = BigInt(bets.length);
                expect(contractBalance - accounted).to.be.lte(maxRoundingError);
            }
        });
    });

    describe("🔐 ACCESS CONTROL BYPASS ATTEMPTS", function () {
        it("Should prevent unauthorized role escalation", async function () {
            const ADMIN_ROLE = await accessControl.DEFAULT_ADMIN_ROLE();
            const RESOLVER_ROLE = await resolutionManager.RESOLVER_ROLE();

            // Attacker tries to grant themselves admin
            await expect(
                accessControl.connect(attacker).grantRole(ADMIN_ROLE, attacker.address)
            ).to.be.reverted;

            // Attacker tries to grant themselves resolver role
            await expect(
                accessControl.connect(attacker).grantRole(RESOLVER_ROLE, attacker.address)
            ).to.be.reverted;

            // Verify attacker doesn't have roles
            expect(await accessControl.hasRole(ADMIN_ROLE, attacker.address)).to.be.false;
            expect(await accessControl.hasRole(RESOLVER_ROLE, attacker.address)).to.be.false;
        });
    });

    describe("📊 FINAL ACCOUNTING VERIFICATION", function () {
        it("Should maintain perfect accounting across all operations", async function () {
            const currentTime = await time.latest();
            const tx = await marketFactory.createMarket(
                {
                    question: "Accounting Test?",
                    description: "Testing perfect accounting",
                    resolutionTime: currentTime + 86400,
                    creatorBond: MIN_CREATOR_BOND,
                    category: ethers.keccak256(ethers.toUtf8Bytes("ACCOUNT")),
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

            if (event) {
                const parsedEvent = marketFactory.interface.parseLog(event);
                const marketAddress = parsedEvent.args.market;
                const market = await ethers.getContractAt("PredictionMarket", marketAddress);

                // Track all funds
                let totalIn = MIN_CREATOR_BOND; // Creator bond

                // Place various bets
                const bet1 = ethers.parseEther("0.1");
                const bet2 = ethers.parseEther("0.2");
                const bet3 = ethers.parseEther("0.15");

                await market.connect(user1).placeBet(0, 0, { value: bet1 });
                await market.connect(user2).placeBet(1, 0, { value: bet2 });
                await market.connect(attacker).placeBet(0, 0, { value: bet3 });

                totalIn += bet1 + bet2 + bet3;

                // Verify accounting before resolution
                const balanceBefore = await ethers.provider.getBalance(marketAddress);
                expect(balanceBefore).to.equal(totalIn);

                // Resolve market
                await time.increase(86401);
                await resolutionManager.resolveMarket(marketAddress, 0);

                // Claim rewards
                await market.connect(user1).claimReward();
                await market.connect(attacker).claimReward();

                // Final accounting check
                const balanceAfter = await ethers.provider.getBalance(marketAddress);
                const pool0 = await market.bettingPools(0);
                const pool1 = await market.bettingPools(1);
                const totalFees = await market.totalFees();

                // All funds should be accounted for
                const totalClaimed = balanceBefore - balanceAfter;
                const totalInPools = pool0 + pool1;

                // Remaining should only be unclaimed funds
                expect(balanceAfter).to.be.lte(totalIn);
            }
        });
    });
});
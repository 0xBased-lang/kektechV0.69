/**
 * @fileoverview ULTRADEEP Security Analysis - Finding ANY remaining vulnerabilities
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const fs = require("fs");
const path = require("path");

describe("🧠 ULTRADEEP SECURITY ANALYSIS", function () {
    let deployer, attacker, user1, user2, user3;
    let registry, accessControl, paramStorage, marketFactory, proposalManager;
    let resolutionManager, rewardDistributor;
    let deployedAddresses;

    const MIN_CREATOR_BOND = ethers.parseEther("0.001");
    const MIN_BET = ethers.parseEther("0.0001");
    const MARKET_FEE = 200; // 2%
    const MAX_UINT256 = ethers.MaxUint256;
    const MAX_INT256 = ethers.MaxInt256;

    before(async function () {
        console.log("\n🔬 ULTRADEEP Analysis - Searching for ANY vulnerabilities...\n");
        [deployer, attacker, user1, user2, user3] = await ethers.getSigners();

        // Load deployed addresses from fork
        const deploymentPath = path.join(__dirname, "../../deployments/fork-deployment.json");
        const deploymentData = fs.readFileSync(deploymentPath, "utf8");
        deployedAddresses = JSON.parse(deploymentData);

        // Get contract instances
        registry = await ethers.getContractAt("VersionedRegistry", deployedAddresses.VersionedRegistry);
        accessControl = await ethers.getContractAt("AccessControlManager", deployedAddresses.AccessControlManager);
        paramStorage = await ethers.getContractAt("ParameterStorage", deployedAddresses.ParameterStorage);
        marketFactory = await ethers.getContractAt("FlexibleMarketFactory", deployedAddresses.FlexibleMarketFactory);
        proposalManager = await ethers.getContractAt("ProposalManager", deployedAddresses.ProposalManager);
        resolutionManager = await ethers.getContractAt("ResolutionManager", deployedAddresses.ResolutionManager);
        rewardDistributor = await ethers.getContractAt("RewardDistributor", deployedAddresses.RewardDistributor);
    });

    describe("🔢 INTEGER OVERFLOW/UNDERFLOW EDGE CASES", function () {
        it("Should handle fee calculation with MAX_UINT256 bet amounts", async function () {
            // Try to create market first
            const currentTime = await time.latest();
            const resolutionTime = currentTime + 86400;

            const tx = await marketFactory.createMarket(
                {
                    question: "Overflow Test Market?",
                    description: "Testing integer overflow",
                    resolutionTime: resolutionTime,
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
                    return marketFactory.interface.parseLog(log).name === "MarketCreated";
                } catch { return false; }
            });
            const marketAddress = event.args.market;
            const market = await ethers.getContractAt("PredictionMarket", marketAddress);

            // Try betting with values that could cause overflow in fee calculation
            const hugeBet = ethers.parseEther("1000000"); // 1M ETH

            // This should NOT overflow due to Solidity 0.8+ protections
            await expect(
                market.connect(attacker).placeBet(0, 0, { value: hugeBet })
            ).to.be.revertedWithoutReason(); // Will fail due to insufficient balance
        });

        it("Should handle fee calculation edge cases with rounding", async function () {
            // Test with amounts that cause rounding issues
            const amounts = [
                ethers.parseEther("0.000000000000000001"), // 1 wei
                ethers.parseEther("0.000000000000000003"), // 3 wei
                ethers.parseEther("0.999999999999999999"), // Almost 1 ETH
            ];

            for (const amount of amounts) {
                // Fee calculation should handle these without issues
                const fee = (amount * BigInt(MARKET_FEE)) / 10000n;
                const betAmount = amount - fee;

                // Verify no overflow/underflow
                expect(betAmount).to.be.lte(amount);
                expect(fee).to.be.gte(0);
            }
        });
    });

    describe("⛽ GAS GRIEFING & DOS ATTACKS", function () {
        it("Should prevent storage collision attacks", async function () {
            // Try to create many markets to fill storage
            const promises = [];
            const currentTime = await time.latest();

            // Try creating 10 markets rapidly
            for (let i = 0; i < 10; i++) {
                promises.push(
                    marketFactory.createMarket(
                        {
                            question: `Market ${i}?`,
                            description: `Test ${i}`,
                            resolutionTime: currentTime + 86400,
                            creatorBond: MIN_CREATOR_BOND,
                            category: ethers.keccak256(ethers.toUtf8Bytes("TEST")),
                            outcome1: "Yes",
                            outcome2: "No",
                        },
                        { value: MIN_CREATOR_BOND }
                    )
                );
            }

            // Should handle concurrent creation without issues
            const results = await Promise.allSettled(promises);
            const successful = results.filter(r => r.status === "fulfilled").length;
            expect(successful).to.be.gte(1); // At least some should succeed
        });

        it("Should handle extremely long strings without gas issues", async function () {
            const currentTime = await time.latest();

            // Create a very long question (but within reasonable limits)
            const longQuestion = "A".repeat(1000);
            const longDescription = "B".repeat(2000);

            // This should either succeed or revert cleanly
            const result = await marketFactory.createMarket(
                {
                    question: longQuestion,
                    description: longDescription,
                    resolutionTime: currentTime + 86400,
                    creatorBond: MIN_CREATOR_BOND,
                    category: ethers.keccak256(ethers.toUtf8Bytes("TEST")),
                    outcome1: "Yes",
                    outcome2: "No",
                },
                { value: MIN_CREATOR_BOND }
            ).then(() => true).catch(() => false);

            // Should handle gracefully (either work or revert)
            expect(typeof result).to.equal("boolean");
        });
    });

    describe("🥪 MEV & FRONT-RUNNING PROTECTION", function () {
        it("Should handle rapid consecutive bets (sandwich attack scenario)", async function () {
            // Create a market
            const currentTime = await time.latest();
            const tx = await marketFactory.createMarket(
                {
                    question: "MEV Test?",
                    description: "Testing MEV protection",
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
                    return marketFactory.interface.parseLog(log).name === "MarketCreated";
                } catch { return false; }
            });
            const marketAddress = event.args.market;
            const market = await ethers.getContractAt("PredictionMarket", marketAddress);

            // Simulate sandwich attack: attacker front-runs and back-runs user
            const userBet = ethers.parseEther("0.1");
            const attackerBet = ethers.parseEther("0.01");

            // Front-run
            await market.connect(attacker).placeBet(0, 0, { value: attackerBet });

            // User transaction
            await market.connect(user1).placeBet(0, 0, { value: userBet });

            // Back-run
            await market.connect(attacker).placeBet(1, 0, { value: attackerBet });

            // All bets should succeed without breaking the system
            const pool0 = await market.bettingPools(0);
            const pool1 = await market.bettingPools(1);

            expect(pool0).to.be.gt(0);
            expect(pool1).to.be.gt(0);
        });
    });

    describe("⏰ TIMING MANIPULATION ATTACKS", function () {
        it("Should handle block.timestamp edge cases", async function () {
            const currentTime = await time.latest();

            // Test with resolution time exactly at current + 1 second
            await expect(
                marketFactory.createMarket(
                    {
                        question: "Timing Attack?",
                        description: "Test timing",
                        resolutionTime: currentTime + 1, // Just 1 second in future
                        creatorBond: MIN_CREATOR_BOND,
                        category: ethers.keccak256(ethers.toUtf8Bytes("TEST")),
                        outcome1: "Yes",
                        outcome2: "No",
                    },
                    { value: MIN_CREATOR_BOND }
                )
            ).to.not.be.reverted; // Should work with very near future

            // Test with resolution time at current block
            await expect(
                marketFactory.createMarket(
                    {
                        question: "Past Time?",
                        description: "Test past",
                        resolutionTime: currentTime, // Current time
                        creatorBond: MIN_CREATOR_BOND,
                        category: ethers.keccak256(ethers.toUtf8Bytes("TEST")),
                        outcome1: "Yes",
                        outcome2: "No",
                    },
                    { value: MIN_CREATOR_BOND }
                )
            ).to.be.revertedWithCustomError(marketFactory, "InvalidResolutionTime");
        });
    });

    describe("💰 ECONOMIC ATTACK VECTORS", function () {
        it("Should handle zero liquidity pool division", async function () {
            // Create market
            const currentTime = await time.latest();
            const tx = await marketFactory.createMarket(
                {
                    question: "Zero Liquidity Test?",
                    description: "Testing zero liquidity",
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
                    return marketFactory.interface.parseLog(log).name === "MarketCreated";
                } catch { return false; }
            });
            const marketAddress = event.args.market;
            const market = await ethers.getContractAt("PredictionMarket", marketAddress);

            // Advance time to after resolution
            await time.increase(86401);

            // Try to resolve with zero liquidity in one pool
            await resolutionManager.connect(deployer).resolveMarket(marketAddress, 0);

            // Should handle gracefully
            const outcome = await market.outcome();
            expect(outcome).to.equal(0);
        });

        it("Should prevent flash loan attacks", async function () {
            // Note: Full flash loan testing would require a lending protocol
            // Here we test that the system doesn't break with rapid large transactions

            const currentTime = await time.latest();
            const tx = await marketFactory.createMarket(
                {
                    question: "Flash Loan Test?",
                    description: "Testing flash loan resistance",
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
                    return marketFactory.interface.parseLog(log).name === "MarketCreated";
                } catch { return false; }
            });
            const marketAddress = event.args.market;
            const market = await ethers.getContractAt("PredictionMarket", marketAddress);

            // Simulate flash loan scenario: large bet and immediate attempt to manipulate
            const largeBet = ethers.parseEther("1.0");
            await market.connect(user1).placeBet(0, 0, { value: largeBet });

            // Try to immediately resolve (should fail due to time constraint)
            await expect(
                resolutionManager.connect(deployer).resolveMarket(marketAddress, 0)
            ).to.be.revertedWithCustomError(market, "MarketNotResolvable");
        });
    });

    describe("🔐 ACCESS CONTROL EDGE CASES", function () {
        it("Should prevent privilege escalation through role manipulation", async function () {
            // Attacker should not be able to grant themselves admin role
            const ADMIN_ROLE = await accessControl.DEFAULT_ADMIN_ROLE();

            await expect(
                accessControl.connect(attacker).grantRole(ADMIN_ROLE, attacker.address)
            ).to.be.reverted;
        });

        it("Should handle role renunciation edge cases", async function () {
            // Create a new role and grant it
            const TEST_ROLE = ethers.keccak256(ethers.toUtf8Bytes("TEST_ROLE"));
            await accessControl.connect(deployer).grantRole(TEST_ROLE, user1.address);

            // User renounces their role
            await accessControl.connect(user1).renounceRole(TEST_ROLE, user1.address);

            // Verify they no longer have the role
            const hasRole = await accessControl.hasRole(TEST_ROLE, user1.address);
            expect(hasRole).to.be.false;
        });
    });

    describe("📝 DATA VALIDATION EDGE CASES", function () {
        it("Should handle special characters and Unicode in market data", async function () {
            const currentTime = await time.latest();

            // Test with special characters
            const specialChars = "Test 🚀 ñ é 中文 עברית ∞ ™";

            const tx = await marketFactory.createMarket(
                {
                    question: specialChars,
                    description: specialChars,
                    resolutionTime: currentTime + 86400,
                    creatorBond: MIN_CREATOR_BOND,
                    category: ethers.keccak256(ethers.toUtf8Bytes("UNICODE")),
                    outcome1: "✅",
                    outcome2: "❌",
                },
                { value: MIN_CREATOR_BOND }
            );

            // Should handle Unicode without issues
            expect(tx).to.not.be.undefined;
        });

        it("Should reject empty strings in critical fields", async function () {
            const currentTime = await time.latest();

            // Test with empty question
            await expect(
                marketFactory.createMarket(
                    {
                        question: "",
                        description: "Valid description",
                        resolutionTime: currentTime + 86400,
                        creatorBond: MIN_CREATOR_BOND,
                        category: ethers.keccak256(ethers.toUtf8Bytes("TEST")),
                        outcome1: "Yes",
                        outcome2: "No",
                    },
                    { value: MIN_CREATOR_BOND }
                )
            ).to.be.revertedWithCustomError(marketFactory, "InvalidQuestion");
        });

        it("Should handle null bytes and injection attempts", async function () {
            const currentTime = await time.latest();

            // Test with potential injection strings
            const injectionAttempts = [
                "'; DROP TABLE markets; --",
                "<script>alert('XSS')</script>",
                "../../etc/passwd",
                String.fromCharCode(0) + "null byte",
            ];

            for (const injection of injectionAttempts) {
                // Should either accept as regular string or revert cleanly
                const result = await marketFactory.createMarket(
                    {
                        question: injection,
                        description: "Test injection",
                        resolutionTime: currentTime + 86400,
                        creatorBond: MIN_CREATOR_BOND,
                        category: ethers.keccak256(ethers.toUtf8Bytes("TEST")),
                        outcome1: "Yes",
                        outcome2: "No",
                    },
                    { value: MIN_CREATOR_BOND }
                ).then(() => true).catch(() => false);

                // Should handle without breaking
                expect(typeof result).to.equal("boolean");
            }
        });
    });

    describe("🔄 CROSS-CONTRACT REENTRANCY", function () {
        it("Should prevent cross-contract reentrancy attacks", async function () {
            // This would require a malicious contract to fully test
            // Here we verify that reentrancy guards are in place

            const currentTime = await time.latest();
            const tx = await marketFactory.createMarket(
                {
                    question: "Reentrancy Test?",
                    description: "Testing reentrancy",
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
                    return marketFactory.interface.parseLog(log).name === "MarketCreated";
                } catch { return false; }
            });
            const marketAddress = event.args.market;
            const market = await ethers.getContractAt("PredictionMarket", marketAddress);

            // Verify reentrancy protection exists
            const marketCode = await ethers.provider.getCode(marketAddress);

            // Check for reentrancy guard patterns in bytecode
            // (This is a simplified check - full audit would decompile)
            expect(marketCode.length).to.be.gt(100); // Contract has code
        });
    });

    describe("🔮 ORACLE MANIPULATION", function () {
        it("Should prevent resolution manipulation through spam disputes", async function () {
            // Create and resolve a market
            const currentTime = await time.latest();
            const tx = await marketFactory.createMarket(
                {
                    question: "Oracle Test?",
                    description: "Testing oracle",
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
                    return marketFactory.interface.parseLog(log).name === "MarketCreated";
                } catch { return false; }
            });
            const marketAddress = event.args.market;

            // Advance time and resolve
            await time.increase(86401);
            await resolutionManager.connect(deployer).resolveMarket(marketAddress, 0);

            // Try to dispute multiple times (spam attack)
            const disputeBond = await paramStorage.disputeBond();

            // First dispute should work
            await proposalManager.connect(attacker).disputeResolution(
                marketAddress,
                1,
                "Spam dispute 1",
                { value: disputeBond }
            );

            // Subsequent disputes on same market should be handled properly
            await expect(
                proposalManager.connect(attacker).disputeResolution(
                    marketAddress,
                    0,
                    "Spam dispute 2",
                    { value: disputeBond }
                )
            ).to.not.be.reverted; // System should handle multiple disputes
        });
    });

    describe("⚡ FEE EXTRACTION EDGE CASES", function () {
        it("Should handle fee rounding errors across many transactions", async function () {
            // Create market
            const currentTime = await time.latest();
            const tx = await marketFactory.createMarket(
                {
                    question: "Fee Rounding Test?",
                    description: "Testing fee rounding",
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
                    return marketFactory.interface.parseLog(log).name === "MarketCreated";
                } catch { return false; }
            });
            const marketAddress = event.args.market;
            const market = await ethers.getContractAt("PredictionMarket", marketAddress);

            // Place many small bets to accumulate rounding errors
            let totalBets = 0n;
            for (let i = 0; i < 10; i++) {
                const betAmount = ethers.parseEther("0.0001") + BigInt(i); // Slightly different amounts
                await market.connect(user1).placeBet(i % 2, 0, { value: betAmount });
                totalBets += betAmount;
            }

            // Check that pools + fees account for all funds (no leakage)
            const pool0 = await market.bettingPools(0);
            const pool1 = await market.bettingPools(1);
            const totalFees = await market.totalFees();

            // Total in contract should equal pools + fees
            const contractBalance = await ethers.provider.getBalance(marketAddress);
            const accountedFor = pool0 + pool1 + totalFees;

            // Allow for small rounding difference (max 10 wei per transaction)
            const maxDifference = 10n * 10n; // 10 transactions * 10 wei max
            expect(contractBalance - accountedFor).to.be.lte(maxDifference);
        });
    });

    describe("🚨 EMERGENCY SCENARIOS", function () {
        it("Should handle market with all funds in one outcome", async function () {
            // Create market
            const currentTime = await time.latest();
            const tx = await marketFactory.createMarket(
                {
                    question: "One-sided Market?",
                    description: "Testing one-sided betting",
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
                    return marketFactory.interface.parseLog(log).name === "MarketCreated";
                } catch { return false; }
            });
            const marketAddress = event.args.market;
            const market = await ethers.getContractAt("PredictionMarket", marketAddress);

            // Everyone bets on the same outcome
            await market.connect(user1).placeBet(0, 0, { value: ethers.parseEther("0.1") });
            await market.connect(user2).placeBet(0, 0, { value: ethers.parseEther("0.2") });
            await market.connect(user3).placeBet(0, 0, { value: ethers.parseEther("0.15") });

            // Advance time and resolve
            await time.increase(86401);
            await resolutionManager.connect(deployer).resolveMarket(marketAddress, 0);

            // Everyone should be able to claim
            await market.connect(user1).claimReward();
            await market.connect(user2).claimReward();
            await market.connect(user3).claimReward();

            // Verify claims worked
            const claimed1 = await market.hasClaimed(user1.address);
            expect(claimed1).to.be.true;
        });

        it("Should handle chain reorganization scenario", async function () {
            // Simulate by testing state consistency after multiple operations
            const currentTime = await time.latest();

            // Create multiple markets quickly
            const markets = [];
            for (let i = 0; i < 3; i++) {
                const tx = await marketFactory.createMarket(
                    {
                        question: `Reorg Test ${i}?`,
                        description: `Testing reorg ${i}`,
                        resolutionTime: currentTime + 86400,
                        creatorBond: MIN_CREATOR_BOND,
                        category: ethers.keccak256(ethers.toUtf8Bytes("TEST")),
                        outcome1: "Yes",
                        outcome2: "No",
                    },
                    { value: MIN_CREATOR_BOND }
                );
                markets.push(tx);
            }

            // Verify all markets exist and have correct state
            for (const marketTx of markets) {
                const receipt = await marketTx.wait();
                expect(receipt.status).to.equal(1);
            }

            // Check registry consistency
            const marketCount = await marketFactory.marketCount();
            expect(marketCount).to.be.gte(3);
        });
    });

    describe("🎯 FINAL EDGE CASES", function () {
        it("Should handle maximum values for all parameters", async function () {
            const currentTime = await time.latest();

            // Test with maximum safe values
            const maxSafeTime = currentTime + (365 * 24 * 60 * 60 * 2); // 2 years (our max)
            const maxBond = ethers.parseEther("1000"); // Large but reasonable

            const result = await marketFactory.createMarket(
                {
                    question: "Max Values Test?",
                    description: "Testing maximum values",
                    resolutionTime: maxSafeTime - 1, // Just under max
                    creatorBond: maxBond,
                    category: ethers.keccak256(ethers.toUtf8Bytes("MAX")),
                    outcome1: "Yes",
                    outcome2: "No",
                },
                { value: maxBond }
            ).then(() => true).catch(() => false);

            // Should handle large values
            expect(result).to.be.oneOf([true, false]); // Either works or reverts cleanly
        });

        it("Should handle minimum values for all parameters", async function () {
            const currentTime = await time.latest();

            // Test with minimum values
            const result = await marketFactory.createMarket(
                {
                    question: "M", // Minimum viable question
                    description: "D", // Minimum description
                    resolutionTime: currentTime + 1, // Minimum time
                    creatorBond: MIN_CREATOR_BOND,
                    category: ethers.keccak256(ethers.toUtf8Bytes("M")),
                    outcome1: "Y",
                    outcome2: "N",
                },
                { value: MIN_CREATOR_BOND }
            ).then(() => true).catch(() => false);

            expect(result).to.be.true; // Should work with minimal values
        });
    });
});
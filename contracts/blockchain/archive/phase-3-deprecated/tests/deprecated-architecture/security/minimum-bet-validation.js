const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * @title Minimum Bet Validation Test
 * @notice Validates that minimum bet amount is properly enforced after parameter fix
 */
describe("🔒 SECURITY FIX VALIDATION: Minimum Bet Enforcement", function () {
    let user1, user2;
    let registry, parameterStorage, marketFactory;
    let market, marketAddress;

    const CREATOR_BOND = ethers.parseEther("0.02");

    before(async function () {
        console.log("\n🔒 MINIMUM BET VALIDATION - Testing Security Fix...\n");

        [deployer, user1, user2] = await ethers.getSigners();

        const deploymentPath = path.join(__dirname, "../../deployments/fork-deployment.json");
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

        registry = await ethers.getContractAt("VersionedRegistry", deployment.contracts.masterRegistry);
        parameterStorage = await ethers.getContractAt("ParameterStorage", deployment.contracts.parameterStorage);
        marketFactory = await ethers.getContractAt("FlexibleMarketFactory", deployment.contracts.marketFactory);

        console.log("✅ Contracts loaded\n");
    });

    describe("📊 Parameter Validation", function () {
        it("✅ Should have minimum bet correctly set in ParameterStorage", async function () {
            console.log("🔍 Checking parameter storage...");

            // Check the parameter using the CORRECT key
            const minBetKey = ethers.keccak256(ethers.toUtf8Bytes("minimumBet"));
            const minBet = await parameterStorage.getParameter(minBetKey);

            console.log(`   Minimum Bet Value: ${ethers.formatEther(minBet)} ETH`);

            // Should be 0.001 ETH
            expect(minBet).to.equal(ethers.parseEther("0.001"));

            console.log("   ✅ Parameter correctly stored with 'minimumBet' key\n");
        });
    });

    describe("🛡️ Minimum Bet Enforcement", function () {
        before(async function () {
            // Create a market for testing
            const currentTime = Math.floor(Date.now() / 1000);
            const marketConfig = {
                question: "Min Bet Test Market",
                description: "Testing minimum bet enforcement",
                resolutionTime: currentTime + 3600,
                creatorBond: CREATOR_BOND,
                category: ethers.id("test"),
                outcome1: "YES",
                outcome2: "NO"
            };

            const tx = await marketFactory.connect(user1).createMarket(marketConfig, { value: CREATOR_BOND });
            const receipt = await tx.wait();

            const event = receipt.logs.find(log => {
                try {
                    const parsed = marketFactory.interface.parseLog(log);
                    return parsed && parsed.name === "MarketCreated";
                } catch {
                    return false;
                }
            });

            const parsed = marketFactory.interface.parseLog(event);
            marketAddress = parsed.args.marketAddress;
            market = await ethers.getContractAt("PredictionMarket", marketAddress);

            console.log("📋 Test market created\n");
        });

        it("✅ Should accept bet exactly at minimum (0.001 ETH)", async function () {
            console.log("🔍 Testing bet at minimum amount...");

            const minBet = ethers.parseEther("0.001");

            await expect(
                market.connect(user2).placeBet(1, 0, { value: minBet })
            ).to.emit(market, "BetPlaced");

            console.log("   ✅ 0.001 ETH bet accepted\n");
        });

        it("❌ Should REJECT bet below minimum (0.0009 ETH)", async function () {
            console.log("🔍 Testing bet below minimum amount...");

            const belowMin = ethers.parseEther("0.0009"); // Just below 0.001

            await expect(
                market.connect(user2).placeBet(1, 0, { value: belowMin })
            ).to.be.revertedWithCustomError(market, "BetTooSmall");

            console.log("   ✅ 0.0009 ETH bet correctly REJECTED\n");
        });

        it("❌ Should REJECT tiny bet (0.00001 ETH)", async function () {
            console.log("🔍 Testing tiny dust bet...");

            const dustBet = ethers.parseEther("0.00001");

            await expect(
                market.connect(user2).placeBet(1, 0, { value: dustBet })
            ).to.be.revertedWithCustomError(market, "BetTooSmall");

            console.log("   ✅ 0.00001 ETH dust bet correctly REJECTED\n");
        });

        it("❌ Should REJECT 1 wei bet (absolute minimum)", async function () {
            console.log("🔍 Testing 1 wei bet...");

            const oneWei = 1n;

            await expect(
                market.connect(user2).placeBet(1, 0, { value: oneWei })
            ).to.be.revertedWithCustomError(market, "BetTooSmall");

            console.log("   ✅ 1 wei bet correctly REJECTED\n");
        });

        it("✅ Should accept bet above minimum (0.01 ETH)", async function () {
            console.log("🔍 Testing bet above minimum amount...");

            const aboveMin = ethers.parseEther("0.01");

            await expect(
                market.connect(user1).placeBet(2, 0, { value: aboveMin })
            ).to.emit(market, "BetPlaced");

            console.log("   ✅ 0.01 ETH bet accepted\n");
        });
    });

    after(function () {
        console.log("═".repeat(60));
        console.log("🎉 SECURITY FIX VALIDATED!");
        console.log("═".repeat(60));
        console.log("\n✅ Minimum bet enforcement CONFIRMED:");
        console.log("   ✅ Parameter correctly set with 'minimumBet' key");
        console.log("   ✅ Bets >= 0.001 ETH accepted");
        console.log("   ✅ Bets < 0.001 ETH rejected");
        console.log("   ✅ Dust attacks prevented");
        console.log("\n🏆 Critical vulnerability FIXED!\n");
    });
});
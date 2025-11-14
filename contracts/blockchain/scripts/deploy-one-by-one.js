const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Manual deployment - ONE contract at a time with delays
 * Run with: npx hardhat run scripts/deploy-one-by-one.js --network sepolia
 */

const STATE_FILE = "sepolia-deployment-unified.json";
const DELAY_MS = 60000; // 60 seconds between transactions

async function delay(ms) {
    console.log(`\n⏳ Waiting ${ms/1000} seconds before next transaction...`);
    await new Promise(r => setTimeout(r, ms));
    console.log("✅ Ready!\n");
}

async function main() {
    const [deployer] = await ethers.getSigners();
    const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));

    console.log("\n🔥 EXTREME GAS DEPLOYMENT - ONE BY ONE");
    console.log("=====================================");
    console.log("Deployer:", deployer.address);
    console.log("Gas: 1000 gwei max, 50 gwei priority");
    console.log("Delay: 60 seconds between transactions\n");

    const registry = await ethers.getContractAt("VersionedRegistry", state.contracts.VersionedRegistry);

    try {
        // Contract 4: RewardDistributor
        if (!state.contracts.RewardDistributor) {
            console.log("📦 Deploying RewardDistributor...");
            const Reward = await ethers.getContractFactory("RewardDistributor");
            const reward = await Reward.deploy(state.contracts.VersionedRegistry);
            await reward.waitForDeployment();
            const rewardAddr = await reward.getAddress();
            console.log("✅ Deployed:", rewardAddr);

            await delay(DELAY_MS);

            console.log("🔗 Registering RewardDistributor...");
            const key = ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor"));
            const tx = await registry.setContract(key, rewardAddr, 1);
            await tx.wait(2);
            console.log("✅ Registered!");

            state.contracts.RewardDistributor = rewardAddr;
            fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

            await delay(DELAY_MS);
        } else {
            console.log("✅ RewardDistributor already deployed:", state.contracts.RewardDistributor);
        }

        // Contract 5: PredictionMarketTemplate
        if (!state.contracts.PredictionMarketTemplate) {
            console.log("📦 Deploying PredictionMarketTemplate...");
            const Market = await ethers.getContractFactory("PredictionMarket");
            const template = await Market.deploy();
            await template.waitForDeployment();
            const templateAddr = await template.getAddress();
            console.log("✅ Deployed:", templateAddr);

            await delay(DELAY_MS);

            console.log("🔗 Registering Template...");
            const key = ethers.keccak256(ethers.toUtf8Bytes("PredictionMarketTemplate"));
            const tx = await registry.setContract(key, templateAddr, 1);
            await tx.wait(2);
            console.log("✅ Registered!");

            state.contracts.PredictionMarketTemplate = templateAddr;
            fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

            await delay(DELAY_MS);
        } else {
            console.log("✅ PredictionMarketTemplate already deployed:", state.contracts.PredictionMarketTemplate);
        }

        // Contract 6: FlexibleMarketFactoryUnified 🎯
        if (!state.contracts.FlexibleMarketFactoryUnified) {
            console.log("📦 Deploying FlexibleMarketFactoryUnified 🎯 (PHASE 4 GOAL!)...");
            const Factory = await ethers.getContractFactory("FlexibleMarketFactoryUnified");
            const factory = await Factory.deploy(
                state.contracts.VersionedRegistry,
                ethers.parseEther("0.1")
            );
            await factory.waitForDeployment();
            const factoryAddr = await factory.getAddress();
            console.log("✅ Deployed:", factoryAddr);

            await delay(DELAY_MS);

            console.log("🔗 Registering Factory...");
            const key = ethers.keccak256(ethers.toUtf8Bytes("FlexibleMarketFactoryUnified"));
            const tx = await registry.setContract(key, factoryAddr, 1);
            await tx.wait(2);
            console.log("✅ Registered!");

            state.contracts.FlexibleMarketFactoryUnified = factoryAddr;
            fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
        } else {
            console.log("✅ FlexibleMarketFactoryUnified already deployed:", state.contracts.FlexibleMarketFactoryUnified);
        }

        console.log("\n🎉 ALL CONTRACTS DEPLOYED!");
        console.log("=====================================");
        console.log("VersionedRegistry:", state.contracts.VersionedRegistry);
        console.log("ParameterStorage:", state.contracts.ParameterStorage);
        console.log("AccessControlManager:", state.contracts.AccessControlManager);
        console.log("RewardDistributor:", state.contracts.RewardDistributor);
        console.log("PredictionMarketTemplate:", state.contracts.PredictionMarketTemplate);
        console.log("FlexibleMarketFactoryUnified:", state.contracts.FlexibleMarketFactoryUnified);
        console.log("\n✅ Phase 4.3 Sepolia Deployment COMPLETE!\n");

    } catch (error) {
        console.log("\n❌ Error:", error.message);
        state.error = { message: error.message, stack: error.stack };
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

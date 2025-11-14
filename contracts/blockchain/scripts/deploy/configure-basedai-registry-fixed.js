const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

// Load deployment state
const STATE_FILE = path.join(__dirname, "../../basedai-mainnet-deployment.json");

// Configuration
const CONFIG = {
    CONFIRMATIONS: 1,           // BasedAI is fast, 1 confirmation is enough
    DELAY_BETWEEN_TXS: 10000,   // 10 seconds between transactions
    GAS_LIMIT: 500000,          // Lower gas limit for registration (small operations)
    // BasedAI gas price is EXTREMELY low: 0.000000009 gwei
    // We set a safe minimum that's still very low
    MIN_GAS_PRICE: 9n,          // 9 wei = 0.000000009 gwei (BasedAI native)
    MAX_GAS_PRICE: 100000000n   // 100 gwei max as safety ceiling
};

// Helper: Delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: Get safe gas price for BasedAI
async function getSafeGasPrice(provider) {
    try {
        const feeData = await provider.getFeeData();

        // If we get a gas price, use it (but ensure it's at least MIN_GAS_PRICE)
        if (feeData.gasPrice && feeData.gasPrice > 0n) {
            const gasPrice = feeData.gasPrice > CONFIG.MIN_GAS_PRICE
                ? feeData.gasPrice
                : CONFIG.MIN_GAS_PRICE;

            // Cap at MAX_GAS_PRICE for safety
            return gasPrice > CONFIG.MAX_GAS_PRICE ? CONFIG.MAX_GAS_PRICE : gasPrice;
        }

        // Fallback: Use BasedAI's native ultra-low gas price
        return CONFIG.MIN_GAS_PRICE;
    } catch (error) {
        console.log(`${colors.yellow}⚠️  Could not fetch gas price, using BasedAI minimum: ${CONFIG.MIN_GAS_PRICE} wei${colors.reset}`);
        return CONFIG.MIN_GAS_PRICE;
    }
}

async function main() {
    console.log(`${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}║         🔧 BASEDAI REGISTRY CONFIGURATION                ║${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

    // Load deployment state
    if (!fs.existsSync(STATE_FILE)) {
        console.log(`${colors.red}❌ ERROR: Deployment state file not found!${colors.reset}`);
        console.log(`${colors.red}   Expected: ${STATE_FILE}${colors.reset}`);
        console.log(`${colors.red}   Run deployment script first!${colors.reset}\n`);
        process.exit(1);
    }

    const deploymentState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

    // Verify all contracts are deployed
    const requiredContracts = [
        "VersionedRegistry",
        "ParameterStorage",
        "AccessControlManager",
        "ResolutionManager",
        "RewardDistributor",
        "FlexibleMarketFactoryUnified",
        "PredictionMarketTemplate",
        "CurveRegistry",
        "MarketTemplateRegistry"
    ];

    console.log(`${colors.cyan}Verifying deployment state...${colors.reset}`);
    for (const contract of requiredContracts) {
        if (!deploymentState.contracts[contract]) {
            console.log(`${colors.red}❌ ERROR: ${contract} not found in deployment state!${colors.reset}\n`);
            process.exit(1);
        }
        console.log(`${colors.green}   ✅ ${contract}${colors.reset}`);
    }
    console.log();

    // Get network info
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const network = await ethers.provider.getNetwork();

    console.log(`${colors.bright}Deployer:${colors.reset} ${deployer.address}`);
    console.log(`${colors.bright}Balance:${colors.reset}  ${ethers.formatEther(balance)} $BASED`);
    console.log(`${colors.bright}Network:${colors.reset}  ${network.name} (Chain ID: ${network.chainId})\n`);

    // SAFETY CHECK: Confirm correct network
    if (network.chainId !== 32323n) {
        console.log(`${colors.red}❌ ERROR: Wrong network! Expected Chain ID 32323, got ${network.chainId}${colors.reset}`);
        console.log(`${colors.red}   CONFIGURATION STOPPED${colors.reset}\n`);
        process.exit(1);
    }

    console.log(`${colors.green}✅ Pre-flight checks passed${colors.reset}\n`);

    // Get safe gas price for BasedAI
    const gasPrice = await getSafeGasPrice(ethers.provider);
    console.log(`${colors.cyan}Gas Price:${colors.reset} ${gasPrice} wei (${ethers.formatUnits(gasPrice, "gwei")} gwei)`);
    console.log(`${colors.dim}   BasedAI uses ultra-low gas prices: 0.000000009 gwei${colors.reset}\n`);

    // Get registry instance
    const registry = await ethers.getContractAt(
        "VersionedRegistry",
        deploymentState.contracts.VersionedRegistry
    );

    // Gas options - CRITICAL: Must explicitly set type to 0 (legacy) for BasedAI
    const txOptions = {
        gasLimit: CONFIG.GAS_LIMIT,
        gasPrice: gasPrice,
        type: 0  // Legacy transaction (no EIP-1559)
    };

    console.log(`${colors.cyan}Transaction options:${colors.reset}`);
    console.log(`   Gas Limit: ${txOptions.gasLimit}`);
    console.log(`   Gas Price: ${txOptions.gasPrice} wei`);
    console.log(`   Type: ${txOptions.type} (Legacy)${colors.reset}\n`);

    // Contracts to register (excluding VersionedRegistry itself)
    const contractsToRegister = [
        { name: "AccessControlManager", key: "AccessControlManager" },
        { name: "ResolutionManager", key: "ResolutionManager" },
        { name: "ParameterStorage", key: "ParameterStorage" },
        { name: "RewardDistributor", key: "RewardDistributor" },
        { name: "MarketFactory", key: "FlexibleMarketFactoryUnified" },
        { name: "PredictionMarket", key: "PredictionMarketTemplate" },
        { name: "CurveRegistry", key: "CurveRegistry" },
        { name: "MarketTemplateRegistry", key: "MarketTemplateRegistry" }
    ];

    const registrationResults = [];
    let totalGasUsed = 0n;

    try {
        console.log(`${colors.bright}${colors.cyan}Registering contracts in VersionedRegistry...${colors.reset}\n`);

        let registeredCount = 0;

        for (const contract of contractsToRegister) {
            console.log(`${colors.cyan}📝 Registering ${contract.name}...${colors.reset}`);

            // Check if already registered
            try {
                const existingAddress = await registry.getContract(ethers.id(contract.name));
                if (existingAddress !== ethers.ZeroAddress) {
                    console.log(`${colors.green}   ✅ Already registered at ${existingAddress}${colors.reset}`);

                    // Get version
                    const version = await registry.getLatestVersion(ethers.id(contract.name));
                    console.log(`${colors.dim}   📋 Version: ${version}${colors.reset}\n`);

                    registeredCount++;
                    registrationResults.push({
                        name: contract.name,
                        address: existingAddress,
                        version: version.toString(),
                        status: "already_registered"
                    });
                    continue;
                }
            } catch (error) {
                // Not registered yet or error - continue with registration
                console.log(`${colors.dim}   ℹ️  Not registered yet, proceeding...${colors.reset}`);
            }

            try {
                // Register contract at version 1
                const address = deploymentState.contracts[contract.key];
                console.log(`${colors.dim}   ⏳ Sending transaction...${colors.reset}`);

                // CRITICAL FIX: Pass txOptions correctly
                const tx = await registry.setContract(
                    ethers.id(contract.name),
                    address,
                    1,  // Version 1
                    txOptions  // Pass options as separate parameter
                );

                console.log(`${colors.dim}   ⏳ Transaction sent: ${tx.hash}${colors.reset}`);
                console.log(`${colors.dim}   ⏳ Waiting for ${CONFIG.CONFIRMATIONS} confirmation(s)...${colors.reset}`);

                const receipt = await tx.wait(CONFIG.CONFIRMATIONS);
                totalGasUsed += receipt.gasUsed;

                console.log(`${colors.green}   ✅ Registered at: ${address}${colors.reset}`);
                console.log(`${colors.dim}   📋 Block: ${receipt.blockNumber}, Gas Used: ${receipt.gasUsed.toString()}${colors.reset}\n`);

                registeredCount++;
                registrationResults.push({
                    name: contract.name,
                    address: address,
                    version: "1",
                    txHash: tx.hash,
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed.toString(),
                    status: "success"
                });

                // Delay between transactions
                if (registeredCount < contractsToRegister.length) {
                    console.log(`${colors.dim}   ⏸️  Waiting ${CONFIG.DELAY_BETWEEN_TXS/1000}s before next registration...${colors.reset}\n`);
                    await delay(CONFIG.DELAY_BETWEEN_TXS);
                }
            } catch (txError) {
                console.log(`${colors.red}   ❌ Registration failed: ${txError.message}${colors.reset}\n`);
                registrationResults.push({
                    name: contract.name,
                    address: deploymentState.contracts[contract.key],
                    status: "failed",
                    error: txError.message
                });
                throw txError; // Re-throw to trigger catch block
            }
        }

        // Calculate total cost
        const totalCostWei = totalGasUsed * gasPrice;
        const totalCostETH = ethers.formatEther(totalCostWei);

        // Update deployment state
        deploymentState.status = "REGISTRY_CONFIGURED";
        deploymentState.configurationTimestamp = new Date().toISOString();
        deploymentState.registrationResults = registrationResults;
        deploymentState.totalGasUsedForRegistration = totalGasUsed.toString();
        deploymentState.totalCostForRegistration = totalCostETH;
        deploymentState.note = `All ${registeredCount} contracts registered in VersionedRegistry successfully.`;
        delete deploymentState.error; // Clear any previous errors
        fs.writeFileSync(STATE_FILE, JSON.stringify(deploymentState, null, 2));

        console.log(`${colors.green}${colors.bright}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.green}${colors.bright}║       ✅ REGISTRY CONFIGURATION COMPLETE! ✅             ║${colors.reset}`);
        console.log(`${colors.green}${colors.bright}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

        console.log(`${colors.cyan}Registered ${registeredCount}/8 contracts in VersionedRegistry${colors.reset}`);
        console.log(`${colors.cyan}Total Gas Used: ${totalGasUsed.toString()}${colors.reset}`);
        console.log(`${colors.cyan}Total Cost: ${totalCostETH} $BASED${colors.reset}\n`);

        // Verify all registrations
        console.log(`${colors.bright}${colors.cyan}📋 Verification:${colors.reset}`);
        console.log(`${colors.dim}────────────────────────────────────────────────────────────${colors.reset}`);

        for (const contract of contractsToRegister) {
            try {
                const address = await registry.getContract(ethers.id(contract.name));
                const version = await registry.getLatestVersion(ethers.id(contract.name));
                console.log(`${colors.bright}${contract.name}:${colors.reset}`);
                console.log(`   ${address} (v${version})`);
            } catch (error) {
                console.log(`${colors.red}${contract.name}: ERROR - ${error.message}${colors.reset}`);
            }
        }
        console.log(`${colors.dim}────────────────────────────────────────────────────────────${colors.reset}\n`);

        console.log(`${colors.yellow}⚠️  NEXT STEP: Create first test market${colors.reset}`);
        console.log(`${colors.dim}   npx hardhat run scripts/create-test-market-mainnet.js --network basedai_mainnet${colors.reset}\n`);

    } catch (error) {
        console.log(`${colors.red}${colors.bright}\n╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.red}${colors.bright}║            ❌ CONFIGURATION FAILED ❌                     ║${colors.reset}`);
        console.log(`${colors.red}${colors.bright}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

        console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
        if (error.stack) {
            console.log(`${colors.dim}${error.stack}${colors.reset}`);
        }
        console.log();

        // Save partial results
        deploymentState.status = "CONFIGURATION_FAILED";
        deploymentState.error = error.message;
        deploymentState.registrationResults = registrationResults;
        deploymentState.failedTimestamp = new Date().toISOString();
        fs.writeFileSync(STATE_FILE, JSON.stringify(deploymentState, null, 2));

        console.log(`${colors.yellow}State saved with partial results.${colors.reset}`);
        console.log(`${colors.yellow}Review error and retry with:${colors.reset}`);
        console.log(`${colors.dim}  npx hardhat run scripts/deploy/configure-basedai-registry-fixed.js --network basedai_mainnet${colors.reset}\n`);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

/**
 * @title Sepolia Contract Verification Script - Config B
 * @notice Verifies Config B deployment (runs=50, viaIR=true)
 * @dev Tests if removing custom YUL improves verification success rate
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Colors for console output
const colors = {
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

// Deployment state file path
const deploymentStatePath = path.join(__dirname, '../sepolia-deployment-split.json');

async function log(message) {
    console.log(message);
}

async function verifyContract(address, contractName, constructorArguments = []) {
    try {
        log(`\n${colors.bright}Verifying ${contractName}...${colors.reset}`);
        log(`Address: ${address}`);
        log(`Constructor Args: ${JSON.stringify(constructorArguments)}`);

        await hre.run("verify:verify", {
            address: address,
            constructorArguments: constructorArguments,
        });

        log(`${colors.green}✅ ${contractName} verified successfully${colors.reset}`);
        return { contract: contractName, status: 'success', address };
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            log(`${colors.yellow}⚠️ ${contractName} already verified${colors.reset}`);
            return { contract: contractName, status: 'already_verified', address };
        } else {
            log(`${colors.red}❌ ${contractName} verification failed: ${error.message}${colors.reset}`);
            return { contract: contractName, status: 'failed', address, error: error.message };
        }
    }
}

async function main() {
    log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    log(`${colors.bright}${colors.cyan}     CONFIG B VERIFICATION TEST - SEPOLIA (runs=50)         ${colors.reset}`);
    log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    // Load deployment state
    if (!fs.existsSync(deploymentStatePath)) {
        throw new Error(`Deployment state file not found: ${deploymentStatePath}`);
    }

    const deploymentState = JSON.parse(fs.readFileSync(deploymentStatePath, 'utf8'));
    const contracts = deploymentState.contracts;

    log(`${colors.bright}📋 Loaded Config B deployment state${colors.reset}`);
    log(`Network: Sepolia (Chain ID: 11155111)`);
    log(`Config: runs=50, viaIR=true (no custom YUL)`);
    log(`Timestamp: ${new Date(deploymentState.timestamp || deploymentState.startTime).toLocaleString()}\n`);

    const results = [];

    // 1. Verify MasterRegistry (no constructor args)
    results.push(await verifyContract(
        contracts.MasterRegistry,
        "MasterRegistry",
        []
    ));

    // 2. Verify ParameterStorage (registry address)
    results.push(await verifyContract(
        contracts.ParameterStorage,
        "ParameterStorage",
        [contracts.MasterRegistry]
    ));

    // 3. Verify AccessControlManager (registry address)
    results.push(await verifyContract(
        contracts.AccessControlManager,
        "AccessControlManager",
        [contracts.MasterRegistry]
    ));

    // 4. Verify MockBondingCurve (name)
    results.push(await verifyContract(
        contracts.MockBondingCurve,
        "MockBondingCurve",
        ["Mock LMSR"]
    ));

    // 5. Verify FlexibleMarketFactoryCore (registry, minBond)
    const minBond = hre.ethers.parseEther("0.1");
    results.push(await verifyContract(
        contracts.FlexibleMarketFactoryCore,
        "FlexibleMarketFactoryCore",
        [contracts.MasterRegistry, minBond.toString()]
    ));

    // 6. Verify FlexibleMarketFactoryExtensions (factoryCore, registry)
    results.push(await verifyContract(
        contracts.FlexibleMarketFactoryExtensions,
        "FlexibleMarketFactoryExtensions",
        [contracts.FlexibleMarketFactoryCore, contracts.MasterRegistry]
    ));

    // 7. Verify ResolutionManager (registry, disputeWindow, minDisputeBond)
    const disputeWindow = 86400; // 24 hours
    const minDisputeBond = hre.ethers.parseEther("0.01");
    results.push(await verifyContract(
        contracts.ResolutionManager,
        "ResolutionManager",
        [contracts.MasterRegistry, disputeWindow, minDisputeBond.toString()]
    ));

    // 8. Verify RewardDistributor (registry address)
    results.push(await verifyContract(
        contracts.RewardDistributor,
        "RewardDistributor",
        [contracts.MasterRegistry]
    ));

    // 9. Verify ProposalManager (registry address)
    results.push(await verifyContract(
        contracts.ProposalManager,
        "ProposalManager",
        [contracts.MasterRegistry]
    ));

    // Summary
    log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    log(`${colors.bright}${colors.cyan}           CONFIG B VERIFICATION SUMMARY                     ${colors.reset}`);
    log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    const successCount = results.filter(r => r.status === 'success').length;
    const alreadyVerifiedCount = results.filter(r => r.status === 'already_verified').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    log(`${colors.green}✅ Successfully Verified: ${successCount}${colors.reset}`);
    log(`${colors.yellow}⚠️ Already Verified: ${alreadyVerifiedCount}${colors.reset}`);
    log(`${colors.red}❌ Failed: ${failedCount}${colors.reset}`);
    log(`\nTotal Contracts: ${results.length}`);

    const totalVerified = successCount + alreadyVerifiedCount;
    const verificationRate = ((totalVerified / results.length) * 100).toFixed(1);
    log(`\n${colors.bright}Verification Rate: ${verificationRate}%${colors.reset}`);

    if (failedCount > 0) {
        log(`\n${colors.red}${colors.bright}Failed Verifications:${colors.reset}`);
        results.filter(r => r.status === 'failed').forEach(r => {
            log(`- ${r.contract}: ${r.error}`);
        });
    }

    // Save verification results
    const verificationResults = {
        timestamp: new Date().toISOString(),
        network: "sepolia",
        chainId: 11155111,
        config: "Config B (runs=50, viaIR=true)",
        results,
        summary: {
            total: results.length,
            success: successCount,
            alreadyVerified: alreadyVerifiedCount,
            failed: failedCount,
            verificationRate: parseFloat(verificationRate)
        }
    };

    const resultsPath = path.join(__dirname, '../verification-results-sepolia-config-b.json');
    fs.writeFileSync(resultsPath, JSON.stringify(verificationResults, null, 2));
    log(`\n${colors.green}✅ Config B verification results saved to: ${resultsPath}${colors.reset}`);

    // Etherscan links
    log(`\n${colors.bright}${colors.cyan}📝 View Config B Contracts on Sepolia Etherscan:${colors.reset}`);
    results.forEach(r => {
        const status = r.status === 'success' || r.status === 'already_verified' ? '✅' : '❌';
        log(`${status} ${r.contract}: https://sepolia.etherscan.io/address/${r.address}#code`);
    });

    log(`\n${colors.bright}${colors.green}🎉 Config B Verification Complete!${colors.reset}\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

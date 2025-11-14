const { ethers } = require("hardhat");

const CONTRACTS = {
    MasterRegistry: "0x412ab6fbdd342AAbE6145f3e36930E42a2089964",
    ProposalManagerV2: "0x9C4B56D0a0465c3aB0CCbCc749bA84155395818C"
};

const colors = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    reset: "\x1b[0m"
};

async function main() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}  FINALIZE PROPOSALMANAGER REGISTRATION${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Balance: ${ethers.formatUnits(balance, 18)} BASED\n`);

    // Get contracts
    const masterRegistry = await ethers.getContractAt("MasterRegistry", CONTRACTS.MasterRegistry);

    // Get gas price
    const feeData = await ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;
    console.log(`Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} gwei\n`);

    try {
        // Check if already registered using bytes32 key
        const proposalManagerKey = ethers.id("ProposalManager");
        const currentProposalManager = await masterRegistry.getContract(proposalManagerKey);

        if (currentProposalManager !== ethers.ZeroAddress) {
            console.log(`${colors.yellow}⚠ ProposalManager already registered:${colors.reset}`);
            console.log(`  ${currentProposalManager}\n`);

            if (currentProposalManager.toLowerCase() === CONTRACTS.ProposalManagerV2.toLowerCase()) {
                console.log(`${colors.green}✓ CORRECT ProposalManager already set!${colors.reset}\n`);
                await verifySystem(masterRegistry);
                return;
            } else {
                console.log(`${colors.red}✗ Wrong ProposalManager registered!${colors.reset}`);
                console.log(`  Expected: ${CONTRACTS.ProposalManagerV2}\n`);
                return;
            }
        }

        // Register with aggressive gas limits
        console.log(`${colors.cyan}Registering ProposalManager with high gas limit...${colors.reset}`);
        const tx = await masterRegistry.setContract(
            proposalManagerKey,
            CONTRACTS.ProposalManagerV2,
            {
                gasPrice: gasPrice,
                gasLimit: 5000000 // 5M gas limit
            }
        );

        console.log(`Transaction sent: ${tx.hash}`);
        console.log(`Waiting for confirmation...`);

        const receipt = await tx.wait();
        console.log(`${colors.green}✓ ProposalManager registered!${colors.reset}`);
        console.log(`  Gas used: ${receipt.gasUsed.toString()}\n`);

        // Verify
        await verifySystem(masterRegistry);

    } catch (error) {
        console.error(`${colors.red}✗ Error: ${error.message}${colors.reset}\n`);

        // Still try to verify what's already there
        console.log(`${colors.cyan}Checking current system state anyway...${colors.reset}\n`);
        await verifySystem(masterRegistry);
    }
}

async function verifySystem(masterRegistry) {
    console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}  SYSTEM VERIFICATION${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

    const expectedContracts = {
        "AccessControlManager": "0x6E315ce994f668C8b94Ee67FC92C4139719a1F78",
        "ParameterStorage": "0x827A80DeD074671D96bc6bAa4260CA1c76Bf24e9",
        "FlexibleMarketFactory": "0x6890a655e8C6FDCa56bC9e471545FE4c574E0c0D",
        "ResolutionManager": "0x6075c7BEe90B1146dFC2F92ddaCefa4fe9A46A84",
        "RewardDistributor": "0xf1937b66DA7403bEdb59E0cE53C96B674DCd6bDd",
        "ProposalManager": "0x9C4B56D0a0465c3aB0CCbCc749bA84155395818C"
    };

    let allCorrect = true;

    for (const [name, expectedAddress] of Object.entries(expectedContracts)) {
        try {
            const contractKey = ethers.id(name);
            const registeredAddress = await masterRegistry.getContract(contractKey);
            const isCorrect = registeredAddress.toLowerCase() === expectedAddress.toLowerCase();

            if (isCorrect && registeredAddress !== ethers.ZeroAddress) {
                console.log(`${colors.green}✓${colors.reset} ${name.padEnd(25)} ${registeredAddress}`);
            } else if (registeredAddress === ethers.ZeroAddress) {
                console.log(`${colors.red}✗${colors.reset} ${name.padEnd(25)} NOT REGISTERED`);
                allCorrect = false;
            } else {
                console.log(`${colors.yellow}⚠${colors.reset} ${name.padEnd(25)} ${registeredAddress} (wrong address)`);
                allCorrect = false;
            }
        } catch (error) {
            console.log(`${colors.red}✗${colors.reset} ${name.padEnd(25)} ERROR: ${error.message}`);
            allCorrect = false;
        }
    }

    console.log();

    if (allCorrect) {
        console.log(`${colors.green}╔═══════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.green}║  🎉 SYSTEM 100% OPERATIONAL & PRODUCTION READY  ║${colors.reset}`);
        console.log(`${colors.green}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

        console.log(`${colors.cyan}Next Steps:${colors.reset}`);
        console.log(`  1. Frontend integration with these addresses`);
        console.log(`  2. Set initial parameters via ParameterStorage`);
        console.log(`  3. Transfer ownership to multisig (when ready)`);
        console.log(`  4. Begin market creation\n`);

        console.log(`${colors.cyan}Explorer:${colors.reset}`);
        console.log(`  https://explorer.bf1337.org/address/${CONTRACTS.MasterRegistry}\n`);
    } else {
        console.log(`${colors.yellow}╔═══════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.yellow}║  ⚠ SYSTEM INCOMPLETE - ACTION REQUIRED         ║${colors.reset}`);
        console.log(`${colors.yellow}╚═══════════════════════════════════════════════╝${colors.reset}\n`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

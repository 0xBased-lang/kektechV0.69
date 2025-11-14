const hre = require("hardhat");
const { spawn } = require("child_process");
const chalk = require("chalk");

/**
 * @title Fork Setup Utility
 * @notice Starts a local fork of BasedAI mainnet for realistic testing
 * @dev Preserves mainnet state while allowing unlimited testing
 */

// Configuration
const FORK_CONFIG = {
    rpcUrl: process.env.BASEDAI_MAINNET_RPC || "https://rpc.bf1337.org",
    blockNumber: process.env.FORK_BLOCK_NUMBER || "latest",
    chainId: 32323,
    port: 8545,
    hostname: "127.0.0.1"
};

// ANSI color codes for terminal output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    red: "\x1b[31m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m"
};

async function startFork() {
    console.log(`${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════╗
║     BasedAI Mainnet Fork Setup 🔱           ║
║         Chain ID: ${FORK_CONFIG.chainId}                    ║
╚══════════════════════════════════════════════╝
${colors.reset}`);

    console.log(`${colors.yellow}Starting fork configuration...${colors.reset}`);
    console.log(`${colors.blue}RPC URL: ${FORK_CONFIG.rpcUrl}${colors.reset}`);
    console.log(`${colors.blue}Block Number: ${FORK_CONFIG.blockNumber}${colors.reset}`);
    console.log(`${colors.blue}Local Port: ${FORK_CONFIG.port}${colors.reset}\n`);

    // Build the Hardhat node command
    const args = [
        "hardhat",
        "node",
        "--fork",
        FORK_CONFIG.rpcUrl
    ];

    // Add block number if specified
    if (FORK_CONFIG.blockNumber !== "latest") {
        args.push("--fork-block-number", FORK_CONFIG.blockNumber);
    }

    // Add network configuration
    args.push("--hostname", FORK_CONFIG.hostname);
    args.push("--port", FORK_CONFIG.port.toString());

    console.log(`${colors.yellow}Executing: npx ${args.join(" ")}${colors.reset}\n`);

    // Start the fork
    const fork = spawn("npx", args, {
        stdio: "pipe",
        shell: true
    });

    // Handle stdout
    fork.stdout.on("data", (data) => {
        const output = data.toString();

        // Color code the output based on content
        if (output.includes("Started HTTP")) {
            console.log(`${colors.green}✓ Fork server started successfully!${colors.reset}`);
            console.log(`${colors.cyan}RPC Endpoint: http://${FORK_CONFIG.hostname}:${FORK_CONFIG.port}${colors.reset}`);
            displayTestAccounts();
        } else if (output.includes("Account")) {
            // Account information
            console.log(`${colors.magenta}${output.trim()}${colors.reset}`);
        } else if (output.includes("WARNING")) {
            console.log(`${colors.yellow}⚠ ${output.trim()}${colors.reset}`);
        } else {
            console.log(output.trim());
        }
    });

    // Handle stderr
    fork.stderr.on("data", (data) => {
        console.error(`${colors.red}Error: ${data}${colors.reset}`);
    });

    // Handle exit
    fork.on("close", (code) => {
        if (code === 0) {
            console.log(`${colors.green}Fork process exited successfully${colors.reset}`);
        } else {
            console.log(`${colors.red}Fork process exited with code ${code}${colors.reset}`);
        }
    });

    // Handle errors
    fork.on("error", (err) => {
        console.error(`${colors.red}Failed to start fork: ${err.message}${colors.reset}`);
        process.exit(1);
    });

    // Display helpful information
    setTimeout(() => {
        displayUsageInstructions();
    }, 3000);
}

function displayTestAccounts() {
    console.log(`\n${colors.cyan}${colors.bright}Test Accounts (10,000 BASED each):${colors.reset}`);
    console.log(`${colors.blue}════════════════════════════════════════${colors.reset}`);

    // Hardhat default test accounts (first 5)
    const testAccounts = [
        { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", key: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" },
        { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", key: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" },
        { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", key: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" },
        { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", key: "0x7c852118294e51e653712a81e05800f419e09eafc5c48d8ad5c4a5e8c3c83cf2" },
        { address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", key: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a" }
    ];

    testAccounts.forEach((account, index) => {
        console.log(`${colors.cyan}Account ${index}:${colors.reset} ${account.address}`);
        if (index === 0) {
            console.log(`${colors.yellow}  Private Key: ${account.key}${colors.reset}`);
            console.log(`${colors.yellow}  (Other keys hidden for safety)${colors.reset}`);
        }
    });
}

function displayUsageInstructions() {
    console.log(`\n${colors.green}${colors.bright}Fork Ready for Testing! 🚀${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════${colors.reset}\n`);

    console.log(`${colors.yellow}Quick Test Commands:${colors.reset}`);
    console.log(`${colors.blue}1. Deploy contracts:${colors.reset}`);
    console.log(`   npm run deploy:fork\n`);

    console.log(`${colors.blue}2. Run fork tests:${colors.reset}`);
    console.log(`   npm run test:fork\n`);

    console.log(`${colors.blue}3. Run Foundry tests on fork:${colors.reset}`);
    console.log(`   forge test --fork-url http://localhost:8545\n`);

    console.log(`${colors.blue}4. Connect with ethers.js:${colors.reset}`);
    console.log(`   const provider = new ethers.JsonRpcProvider("http://localhost:8545");\n`);

    console.log(`${colors.magenta}${colors.bright}Advantages of Fork Testing:${colors.reset}`);
    console.log(`${colors.green}✓${colors.reset} Real mainnet state (tokens, contracts, balances)`);
    console.log(`${colors.green}✓${colors.reset} Zero cost (unlimited transactions)`);
    console.log(`${colors.green}✓${colors.reset} Time manipulation (can advance blocks)`);
    console.log(`${colors.green}✓${colors.reset} Snapshot & revert capabilities`);
    console.log(`${colors.green}✓${colors.reset} Impersonate any account\n`);

    console.log(`${colors.cyan}Press Ctrl+C to stop the fork${colors.reset}`);
}

// Handle interrupts gracefully
process.on("SIGINT", () => {
    console.log(`\n${colors.yellow}Shutting down fork...${colors.reset}`);
    process.exit(0);
});

process.on("SIGTERM", () => {
    console.log(`\n${colors.yellow}Terminating fork...${colors.reset}`);
    process.exit(0);
});

// Run the setup
startFork().catch((error) => {
    console.error(`${colors.red}Fork setup failed:${colors.reset}`, error);
    process.exit(1);
});
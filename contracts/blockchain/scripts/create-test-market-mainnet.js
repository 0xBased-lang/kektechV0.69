const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load deployment state
const deploymentState = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../basedai-mainnet-deployment.json"),
    "utf8"
  )
);

// Test market configuration
const TEST_MARKET_CONFIG = {
  question: "Will BasedAI become the leading prediction market platform?",
  description:
    "First test market on KEKTECH 3.0 - BasedAI mainnet deployment",
  resolutionTime: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
  creatorBond: ethers.parseEther("0.1"),
  category: "0x0000000000000000000000000000000000000000000000000000000000000001", // Non-zero category (required)
  outcome1: "Yes",
  outcome2: "No",
};

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
};

async function main() {
  console.log(
    `${colors.cyan}${colors.bright}╔════════════════════════════════════════╗${colors.reset}`
  );
  console.log(
    `${colors.cyan}${colors.bright}║    Create First Test Market - BasedAI   ║${colors.reset}`
  );
  console.log(
    `${colors.cyan}${colors.bright}╚════════════════════════════════════════╝${colors.reset}\n`
  );

  const [deployer] = await ethers.getSigners();
  console.log(`${colors.cyan}Deployer: ${deployer.address}${colors.reset}\n`);

  // Get factory contract
  const factoryAddress = deploymentState.contracts.FlexibleMarketFactoryUnified;
  console.log(
    `${colors.dim}Connecting to factory: ${factoryAddress}${colors.reset}`
  );

  const factory = await ethers.getContractAt(
    "FlexibleMarketFactoryUnified",
    factoryAddress
  );

  // Prepare transaction
  console.log(`\n${colors.cyan}Creating test market...${colors.reset}`);
  console.log(`${colors.dim}  Question: ${TEST_MARKET_CONFIG.question}${colors.reset}`);
  const bondAmount = ethers.formatEther(TEST_MARKET_CONFIG.creatorBond);
  console.log(
    `${colors.dim}  Bond Required: ${bondAmount} $BASED${colors.reset}`
  );
  console.log(
    `${colors.dim}  Outcomes: "${TEST_MARKET_CONFIG.outcome1}" vs "${TEST_MARKET_CONFIG.outcome2}"${colors.reset}`
  );

  // Create market
  const tx = await factory.createMarket(TEST_MARKET_CONFIG, {
    value: TEST_MARKET_CONFIG.creatorBond,
  });

  console.log(`${colors.yellow}   ⏳ Transaction sent: ${tx.hash}${colors.reset}`);
  console.log(`${colors.yellow}   ⏳ Waiting for confirmation...${colors.reset}`);

  const receipt = await tx.wait(2);

  console.log(
    `${colors.green}   ✅ Market created in block ${receipt.blockNumber}${colors.reset}`
  );
  console.log(
    `${colors.green}   ✅ Gas used: ${receipt.gasUsed.toString()}${colors.reset}`
  );

  // Extract market address from events
  const event = receipt.logs
    .map((log) => {
      try {
        return factory.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "MarketCreated");

  if (event) {
    const marketAddress = event.args[0];
    console.log(
      `${colors.green}   ✅ Market Address: ${marketAddress}${colors.reset}`
    );

    // Get market details
    const market = await ethers.getContractAt(
      "PredictionMarketTemplate",
      marketAddress
    );
    const state = await market.marketState();
    const stateNames = ["PROPOSED", "ACTIVE", "FINALIZED", "REJECTED"];
    console.log(
      `${colors.green}   ✅ Market State: ${stateNames[state]}${colors.reset}`
    );
  }

  console.log(
    `\n${colors.green}${colors.bright}✅ TEST MARKET CREATED SUCCESSFULLY!${colors.reset}\n`
  );
}

main().catch((error) => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});

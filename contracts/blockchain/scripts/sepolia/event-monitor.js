/**
 * Sepolia Event Monitor Script
 * Continuously monitors and logs all events from deployed contracts
 * Run continuously during validation period
 */

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

// Event categories for better organization
const EVENT_CATEGORIES = {
  market: ["MarketCreated", "MarketActivated", "MarketResolved", "MarketDisputed", "MarketFinalized", "MarketCancelled", "MarketRejected"],
  betting: ["BetPlaced", "SharesMinted", "OddsUpdated"],
  payout: ["PayoutClaimed", "RewardsDistributed"],
  governance: ["ResolutionProposed", "DisputeRaised", "VoteCast"],
  admin: ["RoleGranted", "RoleRevoked", "ParameterUpdated", "ContractRegistered"]
};

async function main() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log("═".repeat(70));
  console.log("📡 SEPOLIA EVENT MONITOR");
  console.log(`Started: ${new Date().toISOString()}`);
  console.log("═".repeat(70));
  console.log(colors.reset);

  // Load deployment
  const deploymentDir = path.join(__dirname, "../../deployments/sepolia");
  if (!fs.existsSync(deploymentDir)) {
    console.log(`${colors.red}❌ No Sepolia deployment found${colors.reset}`);
    return;
  }

  const deploymentFiles = fs.readdirSync(deploymentDir)
    .filter(f => f.startsWith("deployment-") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (deploymentFiles.length === 0) {
    console.log(`${colors.red}❌ No deployment files found${colors.reset}`);
    return;
  }

  const deploymentFile = path.join(deploymentDir, deploymentFiles[0]);
  console.log(`Using deployment: ${colors.cyan}${deploymentFiles[0]}${colors.reset}\n`);

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));

  // Get current block number
  const provider = ethers.provider;
  const currentBlock = await provider.getBlockNumber();

  console.log(`${colors.blue}Starting from block: ${currentBlock}${colors.reset}`);
  console.log(`${colors.blue}Monitoring contracts:${colors.reset}`);

  const contracts = {};
  for (const [name, address] of Object.entries(deployment.contracts || {})) {
    console.log(`  ${colors.green}✓${colors.reset} ${name}: ${address}`);

    try {
      contracts[name] = await ethers.getContractAt(name, address);
    } catch (error) {
      console.log(`  ${colors.yellow}⚠${colors.reset} Could not load ${name} contract interface`);
    }
  }

  console.log(`\n${colors.cyan}${colors.bright}Listening for events...${colors.reset}\n`);

  // Set up event listeners for each contract
  const eventLog = [];

  for (const [name, contract] of Object.entries(contracts)) {
    contract.on("*", (event) => {
      logEvent(name, event, eventLog);
    });
  }

  // Also monitor Factory for new market creation
  if (contracts.FlexibleMarketFactoryUnified) {
    contracts.FlexibleMarketFactoryUnified.on("MarketCreated", async (marketAddress, question, creator, event) => {
      console.log(`\n${colors.magenta}${colors.bright}🎯 NEW MARKET CREATED!${colors.reset}`);
      console.log(`  Address: ${colors.cyan}${marketAddress}${colors.reset}`);
      console.log(`  Question: ${question}`);
      console.log(`  Creator: ${creator}`);
      console.log(`  Block: ${event.log.blockNumber}`);
      console.log(`  Tx: ${event.log.transactionHash}\n`);

      // Automatically start monitoring the new market
      try {
        const Market = await ethers.getContractAt("PredictionMarket", marketAddress);
        Market.on("*", (marketEvent) => {
          logEvent(`Market(${marketAddress.slice(0, 8)}...)`, marketEvent, eventLog);
        });
        console.log(`  ${colors.green}✓ Now monitoring new market${colors.reset}\n`);
      } catch (error) {
        console.log(`  ${colors.yellow}⚠ Could not start monitoring new market${colors.reset}\n`);
      }
    });
  }

  // Periodically save event log
  const saveInterval = 60000; // Save every minute
  setInterval(() => {
    saveEventLog(eventLog);
  }, saveInterval);

  // Keep script running
  console.log(`${colors.green}Monitoring active. Press Ctrl+C to stop.${colors.reset}\n`);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}Shutting down...${colors.reset}`);
    saveEventLog(eventLog);
    console.log(`${colors.green}Event log saved. Goodbye!${colors.reset}\n`);
    process.exit(0);
  });

  // Keep process alive
  await new Promise(() => {});
}

function logEvent(contractName, event, eventLog) {
  const timestamp = new Date().toISOString();
  const eventName = event.log.fragment.name;
  const category = getEventCategory(eventName);

  // Color based on category
  let categoryColor = colors.blue;
  if (category === 'market') categoryColor = colors.magenta;
  if (category === 'betting') categoryColor = colors.green;
  if (category === 'payout') categoryColor = colors.cyan;
  if (category === 'admin') categoryColor = colors.yellow;

  console.log(`${colors.bright}[${timestamp}]${colors.reset} ${categoryColor}${eventName}${colors.reset} from ${colors.cyan}${contractName}${colors.reset}`);

  // Log event args
  const args = event.log.args;
  if (args && args.length > 0) {
    console.log(`  Args:`);
    for (const [key, value] of Object.entries(args)) {
      if (isNaN(key)) { // Only log named args
        const formattedValue = formatEventArg(key, value);
        console.log(`    ${key}: ${formattedValue}`);
      }
    }
  }

  console.log(`  Block: ${event.log.blockNumber} | Tx: ${event.log.transactionHash}\n`);

  // Add to event log
  eventLog.push({
    timestamp,
    contractName,
    eventName,
    category,
    blockNumber: event.log.blockNumber,
    transactionHash: event.log.transactionHash,
    args: formatArgsForLog(args)
  });
}

function getEventCategory(eventName) {
  for (const [category, events] of Object.entries(EVENT_CATEGORIES)) {
    if (events.includes(eventName)) {
      return category;
    }
  }
  return 'other';
}

function formatEventArg(key, value) {
  // Format different types of values for display
  if (typeof value === 'bigint') {
    // Try to format as ETH if it looks like a Wei value
    if (value > 1000000000000000n) { // >0.001 ETH
      return `${ethers.formatEther(value)} ETH (${value.toString()} Wei)`;
    }
    return value.toString();
  }

  if (Array.isArray(value)) {
    return `[${value.join(', ')}]`;
  }

  if (typeof value === 'string' && value.startsWith('0x') && value.length === 66) {
    // Looks like a transaction hash
    return value;
  }

  if (typeof value === 'string' && value.startsWith('0x') && value.length === 42) {
    // Looks like an address
    return value;
  }

  return value.toString();
}

function formatArgsForLog(args) {
  const formatted = {};
  if (args) {
    for (const [key, value] of Object.entries(args)) {
      if (isNaN(key)) { // Only named args
        if (typeof value === 'bigint') {
          formatted[key] = value.toString();
        } else if (Array.isArray(value)) {
          formatted[key] = value.map(v =>
            typeof v === 'bigint' ? v.toString() : v
          );
        } else {
          formatted[key] = value;
        }
      }
    }
  }
  return formatted;
}

function saveEventLog(eventLog) {
  const logDir = path.join(__dirname, "../../deployments/sepolia/event-logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, `events-${new Date().toISOString().split('T')[0]}.json`);

  // Load existing log if it exists
  let existingLog = [];
  if (fs.existsSync(logFile)) {
    try {
      existingLog = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    } catch (e) {
      console.log(`${colors.yellow}⚠ Could not load existing log, creating new file${colors.reset}`);
    }
  }

  // Merge and deduplicate
  const mergedLog = [...existingLog, ...eventLog];
  const uniqueLog = Array.from(
    new Map(mergedLog.map(e => [e.transactionHash + e.eventName, e])).values()
  );

  fs.writeFileSync(logFile, JSON.stringify(uniqueLog, null, 2));
  console.log(`${colors.green}📁 Event log saved: ${uniqueLog.length} events${colors.reset}`);

  // Clear in-memory log after saving
  eventLog.length = 0;
}

main()
  .then(() => {})
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

const { ethers } = require("ethers");

// Error definitions from FlexibleMarketFactoryUnified
const errors = [
  "UnauthorizedAccess(address)",
  "InvalidMarketConfig()",
  "InvalidResolutionTime()",
  "InvalidBondAmount()",
  "InvalidQuestion()",
  "InvalidCategory()",
  "MarketNotFound(address)",
  "InsufficientBond()",
  "ContractPaused()",
  "MarketAlreadyApproved(address)",
  "MarketAlreadyRejected(address)",
  "MarketNotApproved(address)",
  "ApprovalDeadlinePassed(address)",
  "ThresholdNotMet(address)",
];

const targetSelector = "0x252d8334";

console.log("\nLooking for error selector:", targetSelector);
console.log("========================================\n");

for (const errorSig of errors) {
  const selector = ethers.id(errorSig).slice(0, 10); // First 4 bytes
  const match = selector === targetSelector ? " ← MATCH!" : "";
  console.log(`${errorSig.padEnd(40)} → ${selector}${match}`);
}

console.log("\n========================================");

// Also check if it's a require statement
console.log("\nCommon Solidity errors:");
const solidityErrors = {
  "0x4e487b71": "Panic - unknown selector",
  "0x08c379a0": "Error(string) - require/assert message",
};

for (const [selector, desc] of Object.entries(solidityErrors)) {
  const match = selector === targetSelector ? " ← MATCH!" : "";
  console.log(`${selector} → ${desc}${match}`);
}

console.log("\n========================================\n");

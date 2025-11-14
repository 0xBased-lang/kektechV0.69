const { ethers } = require("hardhat");
const config = require("../../config/parameters");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🔍 Quick Parameter Verification\n");

  const deploymentPath = path.join(__dirname, "../../../../deployments/basedai-mainnet/deployment.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const paramStorage = await ethers.getContractAt(
    "ParameterStorage",
    deployment.contracts.ParameterStorage
  );

  console.log("Checking fee parameters...\n");

  const params = [
    { key: "protocolFeeBps", expected: config.fees.protocolFeeBps },
    { key: "creatorFeeBps", expected: config.fees.creatorFeeBps },
    { key: "stakerIncentiveBps", expected: config.fees.stakerIncentiveBps },
    { key: "treasuryFeeBps", expected: config.fees.treasuryFeeBps },
    { key: "platformFeePercent", expected: config.fees.platformFeePercent },
  ];

  let allSet = true;
  for (const param of params) {
    try {
      const value = await paramStorage.getParameter(ethers.id(param.key));
      const match = value.toString() === param.expected.toString();
      console.log(`${match ? "✅" : "❌"} ${param.key}: ${value} (expected: ${param.expected})`);
      if (!match) allSet = false;
    } catch (e) {
      console.log(`❌ ${param.key}: NOT SET`);
      allSet = false;
    }
  }

  if (allSet) {
    console.log("\n✅ All parameters are already initialized!");
  } else {
    console.log("\n⚠️  Some parameters are missing or incorrect");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });

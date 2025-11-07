const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying KEKTV Vouchers Offers Contract...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);

  // Get deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "BASED\n");

  // Contract addresses (BasedAI mainnet)
  const KEKTV_VOUCHERS = "0x7FEF981beE047227f848891c6C9F9dad11767a48"; // ERC-1155 vouchers
  const TECH_TOKEN = "0x62E8D022CAf673906e62904f7BB5ae467082b546";    // TECH token

  // Minimum offer value (0.001 TECH = 1000000000000000 wei)
  const MIN_OFFER_VALUE = hre.ethers.parseEther("0.001");

  console.log("📋 Configuration:");
  console.log("   KEKTV Vouchers:", KEKTV_VOUCHERS);
  console.log("   TECH Token:", TECH_TOKEN);
  console.log("   Min Offer Value:", hre.ethers.formatEther(MIN_OFFER_VALUE), "TECH");
  console.log("");

  // Deploy contract
  console.log("📦 Deploying KektvVouchersOffers...");
  const KektvVouchersOffers = await hre.ethers.getContractFactory("KektvVouchersOffers");
  const offersContract = await KektvVouchersOffers.deploy(
    KEKTV_VOUCHERS,
    TECH_TOKEN,
    MIN_OFFER_VALUE
  );

  await offersContract.waitForDeployment();
  const offersAddress = await offersContract.getAddress();

  console.log("\n✅ DEPLOYMENT SUCCESSFUL!\n");
  console.log("═══════════════════════════════════════════");
  console.log("📍 KektvVouchersOffers:", offersAddress);
  console.log("═══════════════════════════════════════════\n");

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const vouchersContract = await offersContract.vouchersContract();
  const techToken = await offersContract.techToken();
  const minOfferValue = await offersContract.minOfferValue();
  const owner = await offersContract.owner();
  const paused = await offersContract.paused();

  console.log("\n📊 Contract Configuration:");
  console.log("   Vouchers Contract:", vouchersContract, vouchersContract === KEKTV_VOUCHERS ? "✅" : "❌");
  console.log("   TECH Token:", techToken, techToken === TECH_TOKEN ? "✅" : "❌");
  console.log("   Min Offer Value:", hre.ethers.formatEther(minOfferValue), "TECH");
  console.log("   Owner:", owner);
  console.log("   Paused:", paused ? "Yes" : "No");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      KektvVouchersOffers: offersAddress,
      KektvVouchers: KEKTV_VOUCHERS,
      TECHToken: TECH_TOKEN
    },
    config: {
      minOfferValue: hre.ethers.formatEther(minOfferValue) + " TECH"
    }
  };

  console.log("\n💾 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require("fs");
  fs.writeFileSync(
    "deployment-kektv-offers.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n✅ Deployment info saved to deployment-kektv-offers.json");

  console.log("\n🎯 NEXT STEPS:");
  console.log("1. Update config/contracts/kektv-offers.ts with address:", offersAddress);
  console.log("2. Test offers on staging environment");
  console.log("3. Approve offers contract to spend TECH tokens");
  console.log("4. Make your first offer on a voucher!");
  console.log("\n✨ Contract deployed and ready to use!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

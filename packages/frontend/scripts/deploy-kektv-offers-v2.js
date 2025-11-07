const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying KEKTV Vouchers Offers V2 Contract (BASED Payments)...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);

  // Get deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "BASED\n");

  // Contract addresses (BasedAI mainnet)
  const KEKTV_VOUCHERS = "0x7FEF981beE047227f848891c6C9F9dad11767a48"; // ERC-1155 vouchers

  // Minimum offer value (0.001 BASED = 1000000000000000 wei)
  const MIN_OFFER_VALUE = hre.ethers.parseEther("0.001");

  console.log("📋 Configuration:");
  console.log("   KEKTV Vouchers:", KEKTV_VOUCHERS);
  console.log("   Min Offer Value:", hre.ethers.formatEther(MIN_OFFER_VALUE), "BASED");
  console.log("   Payment Token: BASED (native token)");
  console.log("");

  // Deploy contract
  console.log("📦 Deploying KektvVouchersOffersV2...");
  const KektvVouchersOffersV2 = await hre.ethers.getContractFactory("KektvVouchersOffersV2");
  const offersContract = await KektvVouchersOffersV2.deploy(
    KEKTV_VOUCHERS,
    MIN_OFFER_VALUE
  );

  await offersContract.waitForDeployment();
  const offersAddress = await offersContract.getAddress();

  console.log("\n✅ DEPLOYMENT SUCCESSFUL!\n");
  console.log("═══════════════════════════════════════════");
  console.log("📍 KektvVouchersOffersV2:", offersAddress);
  console.log("═══════════════════════════════════════════\n");

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const vouchersContract = await offersContract.vouchersContract();
  const minOfferValue = await offersContract.minOfferValue();
  const owner = await offersContract.owner();
  const paused = await offersContract.paused();

  console.log("Vouchers Contract:", vouchersContract);
  console.log("Min Offer Value:", hre.ethers.formatEther(minOfferValue), "BASED");
  console.log("Owner:", owner);
  console.log("Paused:", paused);
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: "basedai",
    chainId: 32323,
    contract: "KektvVouchersOffersV2",
    address: offersAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    parameters: {
      vouchersContract: KEKTV_VOUCHERS,
      minOfferValue: MIN_OFFER_VALUE.toString(),
      paymentToken: "BASED (native)"
    },
    verification: {
      vouchersContract,
      minOfferValue: minOfferValue.toString(),
      owner,
      paused
    }
  };

  const fs = require("fs");
  fs.writeFileSync(
    "deployment-kektv-offers-v2.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("💾 Deployment info saved to deployment-kektv-offers-v2.json");
  console.log("");
  console.log("🎉 V2 Contract deployed successfully with BASED payments!");
  console.log("");
  console.log("🔑 Key Changes from V1:");
  console.log("   ✅ Uses BASED (native token) instead of TECH");
  console.log("   ✅ No token approval needed");
  console.log("   ✅ Simpler UX for users");
  console.log("   ✅ Lower gas costs");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

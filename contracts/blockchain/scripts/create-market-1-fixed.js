const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const deploymentState = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../basedai-mainnet-deployment.json"), "utf8")
);

const MARKET_CONFIG = {
  question: "Will BasedAI prediction markets reach 1000+ active users by January 2026?",
  description: "Market 1: Baseline lifecycle test on KEKTECH 3.0",
  resolutionTime: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
  creatorBond: ethers.parseEther("0.1"),
  category: "0x0000000000000000000000000000000000000000000000000000000000000001",
  outcome1: "Yes - 1000+ users",
  outcome2: "No - Below 1000 users"
};

const CURVE_TYPE_LMSR = 0;  // Enum value for LMSR
const LIQUIDITY = ethers.parseEther("10");  // b = 10 BASED

async function main() {
  const [signer] = await ethers.getSigners();
  const factory = await ethers.getContractAt(
    "FlexibleMarketFactoryUnified",
    deploymentState.contracts.FlexibleMarketFactoryUnified
  );

  console.log("\n🚀 Creating Market 1 with LMSR curve (FIXED)...\n");
  console.log("Question:", MARKET_CONFIG.question);
  console.log("CurveType: LMSR (0)");
  console.log("Liquidity:", ethers.formatEther(LIQUIDITY), "$BASED");
  console.log("Bond:", ethers.formatEther(MARKET_CONFIG.creatorBond), "$BASED\n");

  const totalRequired = MARKET_CONFIG.creatorBond + LIQUIDITY;
  console.log("Total required:", ethers.formatEther(totalRequired), "$BASED\n");

  const tx = await factory.createMarketWithCurve(
    MARKET_CONFIG,
    CURVE_TYPE_LMSR,  // CurveType = LMSR (0)
    LIQUIDITY,        // curveParams = liquidity
    { value: totalRequired, gasLimit: 5000000 }
  );

  console.log("Transaction sent:", tx.hash);
  const receipt = await tx.wait(2);
  console.log("✅ Confirmed in block:", receipt.blockNumber);

  const event = receipt.logs.find(log => {
    try {
      return factory.interface.parseLog(log).name === "MarketCreated";
    } catch {
      return false;
    }
  });

  if (event) {
    const marketAddress = factory.interface.parseLog(event).args.marketAddress;
    console.log("\n🎊 MARKET 1 CREATED SUCCESSFULLY!");
    console.log("Address:", marketAddress, "\n");

    fs.writeFileSync(
      path.join(__dirname, "../market-1-state.json"),
      JSON.stringify({ 
        market1: { 
          address: marketAddress, 
          createdAt: new Date().toISOString(), 
          block: receipt.blockNumber,
          question: MARKET_CONFIG.question,
          curveType: "LMSR",
          liquidity: ethers.formatEther(LIQUIDITY)
        } 
      }, null, 2)
    );
    console.log("✅ Market state saved to market-1-state.json\n");
  }
}

main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });

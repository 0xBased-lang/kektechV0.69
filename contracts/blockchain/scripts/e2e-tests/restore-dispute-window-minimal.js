const { ethers } = require("hardhat");

const RESOLUTION_MANAGER = "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0";
const PRODUCTION_WINDOW = 172800; // 48 hours

async function main() {
  console.log("\n🔄 Restoring dispute window to 48 hours...\n");

  const resolutionManager = await ethers.getContractAt(
    "ResolutionManager",
    RESOLUTION_MANAGER
  );

  const current = await resolutionManager.getDisputeWindow();
  console.log(`Current: ${current}s (${Number(current) / 3600}h)`);
  console.log(`Target: ${PRODUCTION_WINDOW}s (48h)\n`);

  if (Number(current) === PRODUCTION_WINDOW) {
    console.log("✅ Already at production value!\n");
    return;
  }

  const tx = await resolutionManager.setDisputeWindow(PRODUCTION_WINDOW, {
    gasLimit: 60000,
    gasPrice: 10,
  });

  console.log(`📝 Tx: ${tx.hash}`);
  const receipt = await tx.wait();

  console.log(`✅ RESTORED! Gas: ${receipt.gasUsed}\n`);

  const newWindow = await resolutionManager.getDisputeWindow();
  console.log(`New window: ${newWindow}s (${Number(newWindow) / 3600}h)\n`);

  if (Number(newWindow) === PRODUCTION_WINDOW) {
    console.log("✅ Production settings restored!\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

const hre = require("hardhat");

async function main() {
    console.log("🧪 Testing CurveRegistry on Clean Hardhat Network\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    // Step 1: Deploy minimal dependencies
    console.log("\n1. Deploying MasterRegistry...");
    const MasterRegistry = await hre.ethers.getContractFactory("MasterRegistry");
    const masterRegistry = await MasterRegistry.deploy();
    await masterRegistry.waitForDeployment();
    console.log("   ✅ MasterRegistry:", await masterRegistry.getAddress());
    
    console.log("\n2. Deploying AccessControlManager...");
    const AccessControlManager = await hre.ethers.getContractFactory("AccessControlManager");
    const accessControl = await AccessControlManager.deploy(await masterRegistry.getAddress());
    await accessControl.waitForDeployment();
    console.log("   ✅ AccessControlManager:", await accessControl.getAddress());
    
    // Check if deployer has admin role (likely already has it)
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const hasRole = await accessControl.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    console.log("   ℹ️  Deployer has admin role:", hasRole);
    
    console.log("\n3. Deploying LMSRBondingCurve...");
    const LMSRBondingCurve = await hre.ethers.getContractFactory("LMSRBondingCurve");
    const lmsr = await LMSRBondingCurve.deploy();
    await lmsr.waitForDeployment();
    const lmsrAddress = await lmsr.getAddress();
    console.log("   ✅ LMSR:", lmsrAddress);
    
    console.log("\n4. Deploying CurveRegistry...");
    const CurveRegistry = await hre.ethers.getContractFactory("CurveRegistry");
    const registry = await CurveRegistry.deploy(await masterRegistry.getAddress());
    await registry.waitForDeployment();
    console.log("   ✅ CurveRegistry:", await registry.getAddress());
    
    // Step 2: Test registration
    console.log("\n5. Testing registerCurveUnsafe...");
    try {
        const tx = await registry.registerCurveUnsafe(
            lmsrAddress,
            "v1.0.0",
            "LMSR Test",
            "Logarithmic",
            "",
            ["test"],
            { gasLimit: 5000000 }
        );
        await tx.wait();
        console.log("   ✅ SUCCESS! Registration worked on clean network!");
        
        const isRegistered = await registry.isCurveRegistered(lmsrAddress);
        console.log("   ✅ Verified registered:", isRegistered);
        
        const curveInfo = await registry.getCurveInfo(lmsrAddress);
        console.log("   ✅ Curve name:", curveInfo.curveType);
        
    } catch (error) {
        console.log("   ❌ FAILED on clean network too!");
        console.log("   Error:", error.message);
        if (error.reason) console.log("   Reason:", error.reason);
        if (error.data) console.log("   Data:", error.data);
    }
    
    console.log("\n✅ Test complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

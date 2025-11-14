const { ethers } = require("hardhat");

async function main() {
    console.log("\n🔍 SECURITY VERIFICATION: Checking Existing Deployments\n");

    // Contract addresses from explorer (3h ago deployment)
    const addresses = [
        "0xfebB4A8EC23f0aEA7E60dC1796C2c73A09BfbB4A",
        "0xe68e7a52d66F1C82c30E9c29E8fD2c89EB78e7a",
        "0xd1D90BD3dFb7B69A68829e14Ec33a5BE4717D90B",
        "0xDe96d8fBef1d8CFf7AA8A99d4E5D4e8652De590a",
        "0x379aE8e6cABb8a00Cbfeb3B9BC6FDE1c89F78f8",
        "0x93bbDe9A6f01F39dDc1eF48c98D41Dc8E9938321",
        "0x3D8Ed83DedBdaE0BeaEF11c8aFDcd2dE2F79A5f"
    ];

    console.log("Checking deployed contracts for M-1 security fix...\n");

    const results = [];

    for (const address of addresses) {
        try {
            const code = await ethers.provider.getCode(address);

            if (code === "0x") {
                console.log(`❌ ${address} - No contract found`);
                results.push({ address, type: "Not Found", hasM1: false });
                continue;
            }

            console.log(`✅ ${address} - Contract exists`);

            // Try to identify contract type
            let contractType = "Unknown";
            let hasM1Fix = false;

            // Check if it's MasterRegistry (has acceptOwnership for M-1)
            try {
                const registry = await ethers.getContractAt("MasterRegistry", address);
                const owner = await registry.owner();
                console.log(`   Type: MasterRegistry`);
                console.log(`   Owner: ${owner}`);

                // CRITICAL: Check M-1 fix
                try {
                    const pendingOwner = await registry.pendingOwner();
                    console.log(`   ✅ M-1 FIX PRESENT: pendingOwner = ${pendingOwner}`);
                    hasM1Fix = true;
                } catch (e) {
                    console.log(`   ❌ M-1 FIX MISSING: No pendingOwner variable`);
                }

                contractType = "MasterRegistry";
                results.push({ address, type: contractType, hasM1Fix, owner });
                console.log();
                continue;
            } catch (e) {}

            // Check other contract types
            try {
                const acm = await ethers.getContractAt("AccessControlManager", address);
                await acm.DEFAULT_ADMIN_ROLE();
                console.log(`   Type: AccessControlManager`);
                contractType = "AccessControlManager";
                results.push({ address, type: contractType, hasM1Fix: false });
                console.log();
                continue;
            } catch (e) {}

            try {
                const params = await ethers.getContractAt("ParameterStorage", address);
                await params.experimentalMode();
                console.log(`   Type: ParameterStorage`);
                contractType = "ParameterStorage";
                results.push({ address, type: contractType, hasM1Fix: false });
                console.log();
                continue;
            } catch (e) {}

            try {
                const factory = await ethers.getContractAt("FlexibleMarketFactory", address);
                await factory.minCreatorBond();
                console.log(`   Type: FlexibleMarketFactory`);
                contractType = "FlexibleMarketFactory";
                results.push({ address, type: contractType, hasM1Fix: false });
                console.log();
                continue;
            } catch (e) {}

            console.log(`   Type: Unknown contract`);
            results.push({ address, type: "Unknown", hasM1Fix: false });
            console.log();

        } catch (error) {
            console.log(`❌ ${address} - Error: ${error.message}`);
            results.push({ address, type: "Error", hasM1Fix: false, error: error.message });
            console.log();
        }
    }

    console.log("\n" + "=".repeat(80));
    console.log("VERIFICATION SUMMARY");
    console.log("=".repeat(80) + "\n");

    let foundRegistry = false;
    let registryHasM1 = false;

    for (const result of results) {
        const typeStr = result.type.padEnd(30, ' ');
        const m1Status = result.hasM1Fix ? "✅ M-1" : "";
        console.log(`${typeStr} ${result.address} ${m1Status}`);

        if (result.type === "MasterRegistry") {
            foundRegistry = true;
            registryHasM1 = result.hasM1Fix;
        }
    }

    console.log("\n" + "=".repeat(80));
    console.log("SECURITY ASSESSMENT");
    console.log("=".repeat(80) + "\n");

    if (foundRegistry && registryHasM1) {
        console.log("✅ MasterRegistry found WITH M-1 security fix");
        console.log("✅ SAFE TO USE EXISTING DEPLOYMENT");
        console.log("\nRecommendation: Use existing contracts, no redeployment needed");
    } else if (foundRegistry && !registryHasM1) {
        console.log("❌ MasterRegistry found WITHOUT M-1 security fix");
        console.log("🚨 INSECURE - MUST REDEPLOY");
        console.log("\nRecommendation: Deploy fresh contracts with all security fixes");
    } else {
        console.log("⚠️  No MasterRegistry identified in existing deployments");
        console.log("Recommendation: Deploy fresh contracts");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ VERIFICATION FAILED:", error);
        process.exit(1);
    });

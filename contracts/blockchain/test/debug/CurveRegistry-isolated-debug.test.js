const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * DAYS 21-22: ISOLATED CURVEREGISTRY DEBUG TESTS
 *
 * Purpose: Systematically isolate the bug in CurveRegistry.registerCurve()
 *
 * Strategy:
 * 1. Test EnumerableSet.add() in isolation
 * 2. Test struct creation in isolation
 * 3. Test mapping assignment in isolation
 * 4. Test full registerCurve() flow step-by-step
 *
 * Expected outcome: Identify exact line/operation causing revert
 */

describe("CurveRegistry - Isolated Debug Tests", function() {
    let curveRegistry;
    let lmsrCurve;
    let masterRegistry;
    let paramStorage;
    let accessControl;
    let owner;

    beforeEach(async function() {
        [owner] = await ethers.getSigners();

        // Deploy infrastructure
        const MasterRegistry = await ethers.getContractFactory("MasterRegistry");
        masterRegistry = await MasterRegistry.deploy();

        const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
        paramStorage = await ParameterStorage.deploy(await masterRegistry.getAddress());

        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        accessControl = await AccessControlManager.deploy(await masterRegistry.getAddress());

        // Register in master registry
        await masterRegistry.setContract(
            ethers.id("ParameterStorage"),
            await paramStorage.getAddress()
        );
        await masterRegistry.setContract(
            ethers.id("AccessControlManager"),
            await accessControl.getAddress()
        );

        // Deploy CurveRegistry (pass AccessControlManager, not MasterRegistry!)
        const CurveRegistry = await ethers.getContractFactory("CurveRegistry");
        curveRegistry = await CurveRegistry.deploy(await accessControl.getAddress());

        // Deploy LMSR
        const LMSRBondingCurve = await ethers.getContractFactory("LMSRBondingCurve");
        lmsrCurve = await LMSRBondingCurve.deploy();

        // Grant admin role if not already granted
        const hasRole = await accessControl.hasRole(ethers.ZeroHash, owner.address);
        if (!hasRole) {
            await accessControl.grantRole(ethers.ZeroHash, owner.address);
        }
    });

    describe("🔍 Test 1: Basic Setup Validation", function() {
        it("Should have all contracts deployed", async function() {
            expect(await masterRegistry.getAddress()).to.not.equal(ethers.ZeroAddress);
            expect(await curveRegistry.getAddress()).to.not.equal(ethers.ZeroAddress);
            expect(await lmsrCurve.getAddress()).to.not.equal(ethers.ZeroAddress);
            console.log("✅ All contracts deployed successfully");
        });

        it("Should have admin role granted", async function() {
            const hasRole = await accessControl.hasRole(ethers.ZeroHash, owner.address);
            expect(hasRole).to.be.true;
            console.log("✅ Admin role verified");
        });

        it("Should be able to call curveName() on LMSR", async function() {
            const name = await lmsrCurve.curveName();
            expect(name).to.equal("LMSR (Logarithmic Market Scoring Rule)");
            console.log(`✅ LMSR curveName(): "${name}"`);
        });
    });

    describe("🔍 Test 2: EnumerableSet Operations", function() {
        it("Should test if registeredCurves.add() works in isolation", async function() {
            // This tests whether EnumerableSet.add() itself is the problem
            const lmsrAddress = await lmsrCurve.getAddress();

            console.log("\n🔍 Testing EnumerableSet.add() operation...");
            console.log(`   Curve address: ${lmsrAddress}`);

            // Try to register with minimal parameters
            try {
                const tx = await curveRegistry.registerCurve(
                    lmsrAddress,
                    "v1.0.0",
                    "Test description",
                    "DeFi",
                    "",
                    []
                );
                await tx.wait();
                console.log("✅ EnumerableSet.add() succeeded!");

                // Verify it was added
                const curves = await curveRegistry.getAllRegisteredCurves();
                expect(curves.length).to.equal(1);
                expect(curves[0]).to.equal(lmsrAddress);
                console.log("✅ Curve successfully added to set");
            } catch (error) {
                console.log("❌ EnumerableSet.add() FAILED!");
                console.log(`   Error: ${error.message}`);

                // Extract revert reason if available
                if (error.data) {
                    console.log(`   Error data: ${error.data}`);
                }

                throw error; // Re-throw to fail the test
            }
        });
    });

    describe("🔍 Test 3: Struct Creation", function() {
        it("Should test if CurveMetadata struct creation works", async function() {
            const lmsrAddress = await lmsrCurve.getAddress();

            console.log("\n🔍 Testing struct creation...");

            try {
                await curveRegistry.registerCurve(
                    lmsrAddress,
                    "v1.0.0",
                    "Test",
                    "DeFi",
                    "",
                    []
                );
                console.log("✅ Struct creation succeeded!");
            } catch (error) {
                console.log("❌ Struct creation FAILED!");
                console.log(`   Error: ${error.message}`);
                throw error;
            }
        });
    });

    describe("🔍 Test 4: Mapping Assignment", function() {
        it("Should test if curveByName mapping works", async function() {
            const lmsrAddress = await lmsrCurve.getAddress();
            const curveName = await lmsrCurve.curveName();

            console.log("\n🔍 Testing mapping assignment...");
            console.log(`   Curve name: "${curveName}"`);

            try {
                await curveRegistry.registerCurve(
                    lmsrAddress,
                    "v1.0.0",
                    "Test",
                    "DeFi",
                    "",
                    []
                );

                // Verify mapping
                const retrievedAddress = await curveRegistry.getCurveByName(curveName);
                expect(retrievedAddress).to.equal(lmsrAddress);
                console.log("✅ Mapping assignment succeeded!");
            } catch (error) {
                console.log("❌ Mapping assignment FAILED!");
                console.log(`   Error: ${error.message}`);
                throw error;
            }
        });
    });

    describe("🔍 Test 5: Gas Analysis", function() {
        it("Should measure gas usage for registration", async function() {
            const lmsrAddress = await lmsrCurve.getAddress();

            console.log("\n🔍 Measuring gas usage...");

            try {
                const tx = await curveRegistry.registerCurve(
                    lmsrAddress,
                    "v1.0.0",
                    "Test description",
                    "DeFi",
                    "",
                    []
                );
                const receipt = await tx.wait();

                console.log(`✅ Gas used: ${receipt.gasUsed.toString()}`);
                console.log(`   Block gas limit: ${(await ethers.provider.getBlock(receipt.blockNumber)).gasLimit.toString()}`);

                // Check if we're hitting gas limits
                if (receipt.gasUsed > 8000000n) {
                    console.log("⚠️  WARNING: Gas usage very high!");
                }
            } catch (error) {
                console.log("❌ Gas measurement FAILED!");
                console.log(`   Error: ${error.message}`);
                throw error;
            }
        });
    });

    describe("🔍 Test 6: Step-by-Step Registration", function() {
        it("Should test each validation step individually", async function() {
            const lmsrAddress = await lmsrCurve.getAddress();

            console.log("\n🔍 Step-by-step validation...");

            // Step 1: Check if already registered
            console.log("   Step 1: Checking if already registered...");
            const isRegistered = await curveRegistry.isRegistered(lmsrAddress);
            expect(isRegistered).to.be.false;
            console.log("   ✅ Not registered yet");

            // Step 2: Get curve name
            console.log("   Step 2: Getting curve name...");
            const curveName = await lmsrCurve.curveName();
            expect(curveName.length).to.be.greaterThan(0);
            console.log(`   ✅ Curve name: "${curveName}"`);

            // Step 3: Check if name already used
            console.log("   Step 3: Checking if name already used...");
            const existingAddress = await curveRegistry.getCurveByName(curveName);
            expect(existingAddress).to.equal(ethers.ZeroAddress);
            console.log("   ✅ Name not used");

            // Step 4: Attempt full registration
            console.log("   Step 4: Attempting full registration...");
            try {
                await curveRegistry.registerCurve(
                    lmsrAddress,
                    "v1.0.0",
                    "Test",
                    "DeFi",
                    "",
                    []
                );
                console.log("   ✅ Registration succeeded!");
            } catch (error) {
                console.log("   ❌ Registration FAILED at this step!");
                console.log(`      Error: ${error.message}`);
                throw error;
            }
        });
    });

    describe("🔍 Test 7: Compare with Working Contract", function() {
        it("Should test if a simpler version works", async function() {
            // Deploy a minimal test contract that just uses EnumerableSet
            const SimpleSetTest = await ethers.getContractFactory("contracts/test/SimpleSetTest.sol:SimpleSetTest");
            let simpleTest;

            try {
                simpleTest = await SimpleSetTest.deploy();
                await simpleTest.waitForDeployment();
                console.log("✅ SimpleSetTest deployed");

                const lmsrAddress = await lmsrCurve.getAddress();
                await simpleTest.addAddress(lmsrAddress);
                console.log("✅ Address added to EnumerableSet in simple contract");

                const addresses = await simpleTest.getAllAddresses();
                expect(addresses.length).to.equal(1);
                console.log("✅ Simple contract EnumerableSet works correctly");
            } catch (error) {
                console.log("❌ Even simple EnumerableSet test failed!");
                console.log(`   Error: ${error.message}`);

                // This tells us if it's an EnumerableSet issue or something specific to CurveRegistry
                throw error;
            }
        });
    });
});

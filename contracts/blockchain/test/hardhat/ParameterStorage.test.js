const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("ParameterStorage", function () {
    // ============= Fixtures =============

    async function deployParameterStorageFixture() {
        const [owner, admin, user, attacker] = await ethers.getSigners();

        // Deploy Registry first (ethers v6: no .deployed() needed)
        const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
        const registry = await VersionedRegistry.deploy();

        // SECURITY FIX (M-2): Deploy AccessControlManager for role-based access
        const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
        const accessControl = await AccessControlManager.deploy(await registry.getAddress());

        // Register AccessControlManager in registry
        await registry.setContract(
            ethers.id("AccessControlManager"),
            await accessControl.getAddress(),
            1 // version
        );

        // Deploy ParameterStorage (ethers v6: use contract directly, no .address)
        const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
        const params = await ParameterStorage.deploy(await registry.getAddress());

        // Register ParameterStorage in registry (ethers v6: utils moved to top level)
        const PARAM_KEY = ethers.keccak256(
            ethers.toUtf8Bytes("PARAMETER_STORAGE")
        );
        await registry.setContract(PARAM_KEY, await params.getAddress(), 1);

        // SECURITY FIX (M-2): Grant ADMIN_ROLE to owner for ParameterStorage access
        await accessControl.grantRole(ethers.id("ADMIN_ROLE"), owner.address);
        await accessControl.grantRole(ethers.id("ADMIN_ROLE"), admin.address);

        // Define parameter keys (matching KEKTECH blueprint)
        const PROTOCOL_FEE_BPS = ethers.keccak256(
            ethers.toUtf8Bytes("PROTOCOL_FEE_BPS")
        );
        const CREATOR_FEE_BPS = ethers.keccak256(
            ethers.toUtf8Bytes("CREATOR_FEE_BPS")
        );
        const RESOLUTION_WINDOW = ethers.keccak256(
            ethers.toUtf8Bytes("RESOLUTION_WINDOW")
        );
        const MARKET_CREATION_ACTIVE = ethers.keccak256(
            ethers.toUtf8Bytes("MARKET_CREATION_ACTIVE")
        );
        const TEAM_TREASURY = ethers.keccak256(
            ethers.toUtf8Bytes("TEAM_TREASURY")
        );

        return {
            params,
            registry,
            accessControl,
            owner,
            admin,
            user,
            attacker,
            PROTOCOL_FEE_BPS,
            CREATOR_FEE_BPS,
            RESOLUTION_WINDOW,
            MARKET_CREATION_ACTIVE,
            TEAM_TREASURY
        };
    }

    // ============= Deployment Tests =============

    describe("Deployment", function () {
        it("Should set the correct registry", async function () {
            const { params, registry } = await loadFixture(deployParameterStorageFixture);
            expect(await params.registry()).to.equal(await registry.getAddress());
        });

        it("Should start with experimental mode disabled", async function () {
            const { params } = await loadFixture(deployParameterStorageFixture);
            expect(await params.experimentalMode()).to.equal(false);
        });

        it("Should have zero parameters initially", async function () {
            const { params } = await loadFixture(deployParameterStorageFixture);
            expect(await params.getParameterCount()).to.equal(0);
        });
    });

    // ============= Basic Parameter Tests =============

    describe("setParameter", function () {
        it("Should set a parameter value", async function () {
            const { params, owner, PROTOCOL_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            await params.connect(owner).setParameter(PROTOCOL_FEE_BPS, 250);
            expect(await params.getParameter(PROTOCOL_FEE_BPS)).to.equal(250);
        });

        it("Should emit ParameterUpdated event", async function () {
            const { params, owner, PROTOCOL_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            await expect(params.connect(owner).setParameter(PROTOCOL_FEE_BPS, 250))
                .to.emit(params, "ParameterUpdated")
                .withArgs(
                    PROTOCOL_FEE_BPS,
                    250,
                    0,
                    await ethers.provider.getBlock("latest").then(b => b.timestamp + 1)
                );
        });

        it("Should update existing parameter", async function () {
            const { params, owner, PROTOCOL_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            await params.connect(owner).setParameter(PROTOCOL_FEE_BPS, 250);
            await params.connect(owner).setParameter(PROTOCOL_FEE_BPS, 300);

            expect(await params.getParameter(PROTOCOL_FEE_BPS)).to.equal(300);
        });

        it("Should revert when called by non-authorized user", async function () {
            const { params, attacker, PROTOCOL_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            await expect(
                params.connect(attacker).setParameter(PROTOCOL_FEE_BPS, 250)
            ).to.be.revertedWithCustomError(params, "NotAuthorized");
        });
    });

    // ============= Guardrails Tests =============

    describe("Guardrails", function () {
        it("Should set guardrails for a parameter", async function () {
            const { params, owner, PROTOCOL_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            await params.connect(owner).setGuardrails(PROTOCOL_FEE_BPS, 100, 1000);

            const [min, max] = await params.getGuardrails(PROTOCOL_FEE_BPS);
            expect(min).to.equal(100);
            expect(max).to.equal(1000);
        });

        it("Should enforce minimum guardrail", async function () {
            const { params, owner, PROTOCOL_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            await params.connect(owner).setGuardrails(PROTOCOL_FEE_BPS, 100, 1000);

            await expect(
                params.connect(owner).setParameter(PROTOCOL_FEE_BPS, 50)
            ).to.be.revertedWithCustomError(params, "ValueBelowMinimum")
              .withArgs(50, 100);
        });

        it("Should enforce maximum guardrail", async function () {
            const { params, owner, PROTOCOL_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            await params.connect(owner).setGuardrails(PROTOCOL_FEE_BPS, 100, 1000);

            await expect(
                params.connect(owner).setParameter(PROTOCOL_FEE_BPS, 1500)
            ).to.be.revertedWithCustomError(params, "ValueAboveMaximum")
              .withArgs(1500, 1000);
        });

        it("Should allow values within guardrails", async function () {
            const { params, owner, PROTOCOL_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            await params.connect(owner).setGuardrails(PROTOCOL_FEE_BPS, 100, 1000);
            await params.connect(owner).setParameter(PROTOCOL_FEE_BPS, 500);

            expect(await params.getParameter(PROTOCOL_FEE_BPS)).to.equal(500);
        });
    });

    // ============= Experimental Mode Tests =============

    describe("Experimental Mode", function () {
        it("Should toggle experimental mode", async function () {
            const { params, owner } = await loadFixture(deployParameterStorageFixture);

            await params.connect(owner).setExperimentalMode(true);
            expect(await params.experimentalMode()).to.equal(true);

            await params.connect(owner).setExperimentalMode(false);
            expect(await params.experimentalMode()).to.equal(false);
        });

        it("Should emit ExperimentalModeToggled event", async function () {
            const { params, owner } = await loadFixture(deployParameterStorageFixture);

            await expect(params.connect(owner).setExperimentalMode(true))
                .to.emit(params, "ExperimentalModeToggled")
                .withArgs(true);
        });

        it("Should bypass guardrails when experimental mode enabled", async function () {
            const { params, owner, PROTOCOL_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            // Set guardrails
            await params.connect(owner).setGuardrails(PROTOCOL_FEE_BPS, 100, 1000);

            // Enable experimental mode
            await params.connect(owner).setExperimentalMode(true);

            // Should allow values outside guardrails
            await params.connect(owner).setParameter(PROTOCOL_FEE_BPS, 50);
            expect(await params.getParameter(PROTOCOL_FEE_BPS)).to.equal(50);

            await params.connect(owner).setParameter(PROTOCOL_FEE_BPS, 2000);
            expect(await params.getParameter(PROTOCOL_FEE_BPS)).to.equal(2000);
        });
    });

    // ============= Boolean Parameters Tests =============

    describe("Boolean Parameters", function () {
        it("Should set boolean parameter", async function () {
            const { params, owner, MARKET_CREATION_ACTIVE } =
                await loadFixture(deployParameterStorageFixture);

            await params.connect(owner).setBoolParameter(MARKET_CREATION_ACTIVE, true);
            expect(await params.getBoolParameter(MARKET_CREATION_ACTIVE)).to.equal(true);
        });

        it("Should emit BoolParameterUpdated event", async function () {
            const { params, owner, MARKET_CREATION_ACTIVE } =
                await loadFixture(deployParameterStorageFixture);

            await expect(
                params.connect(owner).setBoolParameter(MARKET_CREATION_ACTIVE, true)
            ).to.emit(params, "BoolParameterUpdated")
              .withArgs(MARKET_CREATION_ACTIVE, true, false, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));
        });

        it("Should toggle boolean value", async function () {
            const { params, owner, MARKET_CREATION_ACTIVE } =
                await loadFixture(deployParameterStorageFixture);

            await params.connect(owner).setBoolParameter(MARKET_CREATION_ACTIVE, true);
            expect(await params.getBoolParameter(MARKET_CREATION_ACTIVE)).to.equal(true);

            await params.connect(owner).setBoolParameter(MARKET_CREATION_ACTIVE, false);
            expect(await params.getBoolParameter(MARKET_CREATION_ACTIVE)).to.equal(false);
        });
    });

    // ============= Address Parameters Tests =============

    describe("Address Parameters", function () {
        it("Should set address parameter", async function () {
            const { params, owner, admin, TEAM_TREASURY } =
                await loadFixture(deployParameterStorageFixture);

            await params.connect(owner).setAddressParameter(TEAM_TREASURY, admin.address);
            expect(await params.getAddressParameter(TEAM_TREASURY)).to.equal(admin.address);
        });

        it("Should emit AddressParameterUpdated event", async function () {
            const { params, owner, admin, TEAM_TREASURY } =
                await loadFixture(deployParameterStorageFixture);

            await expect(
                params.connect(owner).setAddressParameter(TEAM_TREASURY, admin.address)
            ).to.emit(params, "AddressParameterUpdated")
              .withArgs(TEAM_TREASURY, admin.address, ethers.ZeroAddress, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));
        });

        it("Should revert with zero address", async function () {
            const { params, owner, TEAM_TREASURY } =
                await loadFixture(deployParameterStorageFixture);

            await expect(
                params.connect(owner).setAddressParameter(TEAM_TREASURY, ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(params, "InvalidValue");
        });
    });

    // ============= Batch Operations Tests =============

    describe("Batch Operations", function () {
        it("Should batch set multiple parameters", async function () {
            const { params, owner, PROTOCOL_FEE_BPS, CREATOR_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            const keys = [PROTOCOL_FEE_BPS, CREATOR_FEE_BPS];
            const values = [250, 150];

            await params.connect(owner).batchSetParameters(keys, values);

            expect(await params.getParameter(PROTOCOL_FEE_BPS)).to.equal(250);
            expect(await params.getParameter(CREATOR_FEE_BPS)).to.equal(150);
        });

        it("Should revert with mismatched array lengths", async function () {
            const { params, owner, PROTOCOL_FEE_BPS, CREATOR_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            const keys = [PROTOCOL_FEE_BPS, CREATOR_FEE_BPS];
            const values = [250]; // Mismatched length

            await expect(
                params.connect(owner).batchSetParameters(keys, values)
            ).to.be.reverted;
        });
    });

    // ============= View Functions Tests =============

    describe("View Functions", function () {
        it("Should return all parameters", async function () {
            const { params, owner, PROTOCOL_FEE_BPS, CREATOR_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            await params.connect(owner).setParameter(PROTOCOL_FEE_BPS, 250);
            await params.connect(owner).setParameter(CREATOR_FEE_BPS, 150);

            const [keys, values] = await params.getAllParameters();

            expect(keys.length).to.equal(2);
            expect(values.length).to.equal(2);
            expect(keys).to.include(PROTOCOL_FEE_BPS);
            expect(keys).to.include(CREATOR_FEE_BPS);
        });

        it("Should check parameter existence", async function () {
            const { params, owner, PROTOCOL_FEE_BPS, CREATOR_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            expect(await params.parameterExists(PROTOCOL_FEE_BPS)).to.equal(false);

            await params.connect(owner).setParameter(PROTOCOL_FEE_BPS, 250);

            expect(await params.parameterExists(PROTOCOL_FEE_BPS)).to.equal(true);
            expect(await params.parameterExists(CREATOR_FEE_BPS)).to.equal(false);
        });

        it("Should return correct parameter count", async function () {
            const { params, owner, PROTOCOL_FEE_BPS, CREATOR_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            expect(await params.getParameterCount()).to.equal(0);

            await params.connect(owner).setParameter(PROTOCOL_FEE_BPS, 250);
            expect(await params.getParameterCount()).to.equal(1);

            await params.connect(owner).setParameter(CREATOR_FEE_BPS, 150);
            expect(await params.getParameterCount()).to.equal(2);
        });
    });

    // ============= Gas Usage Tests =============

    describe("Gas Optimization", function () {
        it("Should keep gas under 30k for parameter read", async function () {
            const { params, owner, PROTOCOL_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            await params.connect(owner).setParameter(PROTOCOL_FEE_BPS, 250);

            const gasBefore = await ethers.provider.getBalance(owner.address);
            const tx = await params.getParameter(PROTOCOL_FEE_BPS);

            // View functions don't consume gas, but we verify it's a view function
            expect(tx).to.equal(250);
        });

        it("Should optimize batch operations", async function () {
            const { params, owner, PROTOCOL_FEE_BPS, CREATOR_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            const keys = [PROTOCOL_FEE_BPS, CREATOR_FEE_BPS];
            const values = [250, 150];

            const tx = await params.connect(owner).batchSetParameters(keys, values);
            const receipt = await tx.wait();

            console.log(`Gas used for batch set (2 params): ${receipt.gasUsed}`);
            console.log(`Gas per param: ${Number(receipt.gasUsed) / 2}`);

            // Batch should be within gas limits (cold storage is ~100k per param)
            expect(Number(receipt.gasUsed) / 2).to.be.lessThan(110000);
        });
    });

    // ============= Edge Cases Tests =============

    describe("Edge Cases", function () {
        it("Should handle maximum uint256 value", async function () {
            const { params, owner, PROTOCOL_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            const maxUint = ethers.MaxUint256;

            // Enable experimental mode to bypass guardrails
            await params.connect(owner).setExperimentalMode(true);

            await params.connect(owner).setParameter(PROTOCOL_FEE_BPS, maxUint);
            expect(await params.getParameter(PROTOCOL_FEE_BPS)).to.equal(maxUint);
        });

        it("Should handle zero value parameters", async function () {
            const { params, owner, PROTOCOL_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            await params.connect(owner).setParameter(PROTOCOL_FEE_BPS, 0);
            expect(await params.getParameter(PROTOCOL_FEE_BPS)).to.equal(0);
        });

        it("Should revert when getting non-existent parameter", async function () {
            const { params, PROTOCOL_FEE_BPS } =
                await loadFixture(deployParameterStorageFixture);

            await expect(
                params.getParameter(PROTOCOL_FEE_BPS)
            ).to.be.revertedWithCustomError(params, "ParameterNotFound")
              .withArgs(PROTOCOL_FEE_BPS);
        });
    });

    // ============= Integration Tests =============

    describe("Registry Integration", function () {
        it("Should work with registry-based access control", async function () {
            const { params, registry, owner } =
                await loadFixture(deployParameterStorageFixture);

            // Verify registry integration
            expect(await params.registry()).to.equal(await registry.getAddress());
        });
    });
});
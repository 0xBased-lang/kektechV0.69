const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("CurveRegistry", function () {
  // Fixture for deploying contracts
  async function deployCurveRegistryFixture() {
    const [owner, admin, operator, user1] = await ethers.getSigners();

    // Deploy VersionedRegistry (required by AccessControlManager)
    const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
    const masterRegistry = await VersionedRegistry.deploy();
    await masterRegistry.waitForDeployment();

    // Deploy AccessControlManager
    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    const accessControl = await AccessControlManager.deploy(await masterRegistry.getAddress());
    await accessControl.waitForDeployment();

    // Deploy CurveRegistry
    const CurveRegistry = await ethers.getContractFactory("CurveRegistry");
    const registry = await CurveRegistry.deploy(await accessControl.getAddress());
    await accessControl.waitForDeployment();

    // Deploy Mock Curves for testing
    const MockCurve = await ethers.getContractFactory("MockBondingCurve");
    const lmsrCurve = await MockCurve.deploy("LMSR");
    const linearCurve = await MockCurve.deploy("Linear");
    const invalidCurve = await MockCurve.deploy("Invalid"); // For negative testing

    await lmsrCurve.waitForDeployment();
    await linearCurve.waitForDeployment();
    await invalidCurve.waitForDeployment();

    return {
      registry,
      accessControl,
      lmsrCurve,
      linearCurve,
      invalidCurve,
      owner,
      admin,
      operator,
      user1,
    };
  }

  describe("Deployment", function () {
    it("Should deploy with correct access control", async function () {
      const { registry, accessControl } = await loadFixture(deployCurveRegistryFixture);

      expect(await registry.accessControl()).to.equal(await accessControl.getAddress());
    });

    it("Should revert if access control is zero address", async function () {
      const CurveRegistry = await ethers.getContractFactory("CurveRegistry");

      await expect(CurveRegistry.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        CurveRegistry,
        "InvalidCurveAddress"
      );
    });
  });

  describe("Curve Registration", function () {
    it("Should register a valid curve", async function () {
      const { registry, lmsrCurve, owner } = await loadFixture(deployCurveRegistryFixture);

      const tx = await registry.registerCurve(
        await lmsrCurve.getAddress(),
        "1.0.0",
        "LMSR bonding curve"
      );

      await expect(tx)
        .to.emit(registry, "CurveRegistered")
        .withArgs(await lmsrCurve.getAddress(), "LMSR", "1.0.0", "LMSR bonding curve");

      // Verify registration
      const [isRegistered, isActive] = await registry.isCurveActive(await lmsrCurve.getAddress());
      expect(isRegistered).to.be.true;
      expect(isActive).to.be.true;
    });

    it("Should get curve by name", async function () {
      const { registry, lmsrCurve } = await loadFixture(deployCurveRegistryFixture);

      await registry.registerCurve(await lmsrCurve.getAddress(), "1.0.0", "LMSR bonding curve");

      const curveAddress = await registry.getCurveByName("LMSR");
      expect(curveAddress).to.equal(await lmsrCurve.getAddress());
    });

    it("Should revert if curve already registered", async function () {
      const { registry, lmsrCurve } = await loadFixture(deployCurveRegistryFixture);

      await registry.registerCurve(await lmsrCurve.getAddress(), "1.0.0", "LMSR bonding curve");

      await expect(
        registry.registerCurve(await lmsrCurve.getAddress(), "1.0.1", "Updated LMSR")
      ).to.be.revertedWithCustomError(registry, "CurveAlreadyRegistered");
    });

    it("Should revert if caller is not admin", async function () {
      const { registry, lmsrCurve, user1 } = await loadFixture(deployCurveRegistryFixture);

      await expect(
        registry.connect(user1).registerCurve(await lmsrCurve.getAddress(), "1.0.0", "LMSR")
      ).to.be.revertedWithCustomError(registry, "Unauthorized");
    });

    it("Should revert if curve address is zero", async function () {
      const { registry } = await loadFixture(deployCurveRegistryFixture);

      await expect(
        registry.registerCurve(ethers.ZeroAddress, "1.0.0", "Invalid")
      ).to.be.revertedWithCustomError(registry, "InvalidCurveAddress");
    });

    it("Should revert if curve name is duplicate", async function () {
      const { registry, lmsrCurve } = await loadFixture(deployCurveRegistryFixture);

      await registry.registerCurve(await lmsrCurve.getAddress(), "1.0.0", "LMSR bonding curve");

      // Deploy another curve with same name
      const MockCurve = await ethers.getContractFactory("MockBondingCurve");
      const duplicateCurve = await MockCurve.deploy("LMSR"); // Same name!
      await duplicateCurve.waitForDeployment();

      await expect(
        registry.registerCurve(await duplicateCurve.getAddress(), "1.0.0", "Duplicate LMSR")
      ).to.be.revertedWithCustomError(registry, "CurveAlreadyRegistered");
    });
  });

  describe("Curve Status Management", function () {
    it("Should enable/disable curve", async function () {
      const { registry, lmsrCurve } = await loadFixture(deployCurveRegistryFixture);

      await registry.registerCurve(await lmsrCurve.getAddress(), "1.0.0", "LMSR");

      // Disable curve
      const tx = await registry.setCurveStatus(await lmsrCurve.getAddress(), false);
      await expect(tx)
        .to.emit(registry, "CurveStatusChanged")
        .withArgs(await lmsrCurve.getAddress(), "LMSR", false);

      const [isRegistered, isActive] = await registry.isCurveActive(await lmsrCurve.getAddress());
      expect(isRegistered).to.be.true;
      expect(isActive).to.be.false;

      // Re-enable curve
      await registry.setCurveStatus(await lmsrCurve.getAddress(), true);
      const [, isActiveAfter] = await registry.isCurveActive(await lmsrCurve.getAddress());
      expect(isActiveAfter).to.be.true;
    });

    it("Should revert if curve not registered when setting status", async function () {
      const { registry, lmsrCurve } = await loadFixture(deployCurveRegistryFixture);

      await expect(
        registry.setCurveStatus(await lmsrCurve.getAddress(), false)
      ).to.be.revertedWithCustomError(registry, "CurveNotRegistered");
    });

    it("Should revert if not admin when setting status", async function () {
      const { registry, lmsrCurve, user1 } = await loadFixture(deployCurveRegistryFixture);

      await registry.registerCurve(await lmsrCurve.getAddress(), "1.0.0", "LMSR");

      await expect(
        registry.connect(user1).setCurveStatus(await lmsrCurve.getAddress(), false)
      ).to.be.revertedWithCustomError(registry, "Unauthorized");
    });
  });

  describe("Curve Removal", function () {
    it("Should remove curve", async function () {
      const { registry, lmsrCurve } = await loadFixture(deployCurveRegistryFixture);

      await registry.registerCurve(await lmsrCurve.getAddress(), "1.0.0", "LMSR");

      const tx = await registry.removeCurve(await lmsrCurve.getAddress());
      await expect(tx)
        .to.emit(registry, "CurveRemoved")
        .withArgs(await lmsrCurve.getAddress(), "LMSR");

      const [isRegistered] = await registry.isCurveActive(await lmsrCurve.getAddress());
      expect(isRegistered).to.be.false;
    });

    it("Should revert if curve not registered when removing", async function () {
      const { registry, lmsrCurve } = await loadFixture(deployCurveRegistryFixture);

      await expect(
        registry.removeCurve(await lmsrCurve.getAddress())
      ).to.be.revertedWithCustomError(registry, "CurveNotRegistered");
    });

    it("Should revert if not admin when removing", async function () {
      const { registry, lmsrCurve, user1 } = await loadFixture(deployCurveRegistryFixture);

      await registry.registerCurve(await lmsrCurve.getAddress(), "1.0.0", "LMSR");

      await expect(
        registry.connect(user1).removeCurve(await lmsrCurve.getAddress())
      ).to.be.revertedWithCustomError(registry, "Unauthorized");
    });
  });

  describe("Curve Queries", function () {
    it("Should get all curves", async function () {
      const { registry, lmsrCurve, linearCurve } = await loadFixture(deployCurveRegistryFixture);

      await registry.registerCurve(await lmsrCurve.getAddress(), "1.0.0", "LMSR");
      await registry.registerCurve(await linearCurve.getAddress(), "1.0.0", "Linear");

      const allCurves = await registry.getAllCurves();
      expect(allCurves.length).to.equal(2);
      expect(allCurves).to.include(await lmsrCurve.getAddress());
      expect(allCurves).to.include(await linearCurve.getAddress());
    });

    it("Should get only active curves", async function () {
      const { registry, lmsrCurve, linearCurve } = await loadFixture(deployCurveRegistryFixture);

      await registry.registerCurve(await lmsrCurve.getAddress(), "1.0.0", "LMSR");
      await registry.registerCurve(await linearCurve.getAddress(), "1.0.0", "Linear");

      // Disable linear curve
      await registry.setCurveStatus(await linearCurve.getAddress(), false);

      const activeCurves = await registry.getActiveCurves();
      expect(activeCurves.length).to.equal(1);
      expect(activeCurves[0]).to.equal(await lmsrCurve.getAddress());
    });

    it("Should get curve info", async function () {
      const { registry, lmsrCurve } = await loadFixture(deployCurveRegistryFixture);

      await registry.registerCurve(await lmsrCurve.getAddress(), "1.0.0", "LMSR bonding curve");

      const [metadata, curveName] = await registry.getCurveInfo(await lmsrCurve.getAddress());

      expect(metadata.isActive).to.be.true;
      expect(metadata.version).to.equal("1.0.0");
      expect(metadata.description).to.equal("LMSR bonding curve");
      expect(curveName).to.equal("LMSR");
    });

    it("Should revert when getting curve by name if not registered", async function () {
      const { registry } = await loadFixture(deployCurveRegistryFixture);

      await expect(registry.getCurveByName("NonExistent")).to.be.revertedWithCustomError(
        registry,
        "CurveNotRegistered"
      );
    });

    it("Should revert when getting curve by name if not active", async function () {
      const { registry, lmsrCurve } = await loadFixture(deployCurveRegistryFixture);

      await registry.registerCurve(await lmsrCurve.getAddress(), "1.0.0", "LMSR");
      await registry.setCurveStatus(await lmsrCurve.getAddress(), false);

      await expect(registry.getCurveByName("LMSR")).to.be.revertedWithCustomError(
        registry,
        "CurveNotActive"
      );
    });
  });

  describe("Curve Validation", function () {
    it("Should validate curve implementation on registration", async function () {
      const { registry, lmsrCurve } = await loadFixture(deployCurveRegistryFixture);

      // This should succeed because MockBondingCurve implements validation correctly
      await expect(registry.registerCurve(await lmsrCurve.getAddress(), "1.0.0", "LMSR")).to.not.be
        .reverted;
    });

    it("Should handle empty curve name", async function () {
      const { registry } = await loadFixture(deployCurveRegistryFixture);

      // Deploy curve with empty name
      const MockCurve = await ethers.getContractFactory("MockBondingCurve");
      const emptyCurve = await MockCurve.deploy(""); // Empty name
      await emptyCurve.waitForDeployment();

      await expect(
        registry.registerCurve(await emptyCurve.getAddress(), "1.0.0", "Empty name curve")
      ).to.be.revertedWithCustomError(registry, "InvalidCurveName");
    });
  });

  describe("Multiple Curves Workflow", function () {
    it("Should manage multiple curves simultaneously", async function () {
      const { registry, lmsrCurve, linearCurve } = await loadFixture(deployCurveRegistryFixture);

      // Register both curves
      await registry.registerCurve(await lmsrCurve.getAddress(), "1.0.0", "LMSR");
      await registry.registerCurve(await linearCurve.getAddress(), "1.0.0", "Linear");

      // Verify both active
      const activeCurves = await registry.getActiveCurves();
      expect(activeCurves.length).to.equal(2);

      // Disable one
      await registry.setCurveStatus(await linearCurve.getAddress(), false);

      // Verify only one active
      const activeCurvesAfter = await registry.getActiveCurves();
      expect(activeCurvesAfter.length).to.equal(1);
      expect(activeCurvesAfter[0]).to.equal(await lmsrCurve.getAddress());

      // Both should still be registered
      const allCurves = await registry.getAllCurves();
      expect(allCurves.length).to.equal(2);
    });
  });
});

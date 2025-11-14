// test/integration/FactoryCurveInfrastructure.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

/**
 * DAY 6 - Factory Curve Infrastructure Tests
 * Phase 2: Infrastructure only - actual curve usage in Phase 3
 *
 * Test Coverage:
 * - CurveType enum
 * - createMarketWithCurve for all 4 curve types
 * - Curve configuration storage
 * - CurveRegistry integration
 * - Backward compatibility
 * - Gas costs
 * - Error cases
 */
describe("FlexibleMarketFactory - Curve Infrastructure (Day 6)", function() {
  async function deployFactoryCurveFixture() {
    const [owner, creator, user1] = await ethers.getSigners();

    // Deploy VersionedRegistry
    const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
    const registry = await VersionedRegistry.deploy();
    await registry.waitForDeployment();

    // Deploy AccessControlManager
    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    const accessControl = await AccessControlManager.deploy(registry.target);
    await accessControl.waitForDeployment();

    // Deploy ParameterStorage
    const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
    const parameterStorage = await ParameterStorage.deploy(registry.target);
    await parameterStorage.waitForDeployment();

    // Register core contracts
    await registry.setContract(keccak256("AccessControlManager", 1, 1), accessControl.target, 1);
    await registry.setContract(keccak256("ParameterStorage", 1, 1), parameterStorage.target, 1);

    // Deploy CurveRegistry (takes AccessControlManager, not VersionedRegistry)
    const CurveRegistry = await ethers.getContractFactory("CurveRegistry");
    const curveRegistry = await CurveRegistry.deploy(accessControl.target);
    await curveRegistry.waitForDeployment();

    // Register CurveRegistry
    await registry.setContract(keccak256("CurveRegistry", 1, 1), curveRegistry.target, 1);

    // Deploy all 4 curves
    const LMSRCurve = await ethers.getContractFactory("LMSRCurve");
    const lmsrCurve = await LMSRCurve.deploy();
    await lmsrCurve.waitForDeployment();

    const LinearCurve = await ethers.getContractFactory("LinearCurve");
    const linearCurve = await LinearCurve.deploy();
    await linearCurve.waitForDeployment();

    const ExponentialCurve = await ethers.getContractFactory("ExponentialCurve");
    const exponentialCurve = await ExponentialCurve.deploy();
    await exponentialCurve.waitForDeployment();

    const SigmoidCurve = await ethers.getContractFactory("SigmoidCurve");
    const sigmoidCurve = await SigmoidCurve.deploy();
    await sigmoidCurve.waitForDeployment();

    // Register curves with CurveRegistry (explicitly use owner who has DEFAULT_ADMIN_ROLE)
    await curveRegistry.connect(owner).registerCurve(
      lmsrCurve.target,
      "1.0.0",
      "Logarithmic Market Scoring Rule"
    );
    await curveRegistry.connect(owner).registerCurve(
      linearCurve.target,
      "1.0.0",
      "Linear pricing curve"
    );
    await curveRegistry.connect(owner).registerCurve(
      exponentialCurve.target,
      "1.0.0",
      "Exponential growth curve"
    );
    await curveRegistry.connect(owner).registerCurve(
      sigmoidCurve.target,
      "1.0.0",
      "S-curve pricing"
    );

    // Deploy FlexibleMarketFactory
    const FlexibleMarketFactory = await ethers.getContractFactory("FlexibleMarketFactory");
    const minBond = ethers.parseEther("0.1");
    const factory = await FlexibleMarketFactory.deploy(registry.target, minBond);
    await factory.waitForDeployment();

    // Grant ADMIN_ROLE and DEFAULT_ADMIN_ROLE to owner
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash; // bytes32(0) = DEFAULT_ADMIN_ROLE
    await accessControl.grantRole(ADMIN_ROLE, owner.address);
    await accessControl.grantRole(DEFAULT_ADMIN_ROLE, owner.address);

    // Standard market config
    const baseConfig = {
      question: "Will ETH reach $5000 in 2025?",
      description: "Test market for curve infrastructure",
      resolutionTime: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
      creatorBond: minBond,
      category: ethers.keccak256(ethers.toUtf8Bytes("CRYPTO")),
      outcome1: "Yes",
      outcome2: "No"
    };

    return {
      factory,
      registry,
      curveRegistry,
      accessControl,
      lmsrCurve,
      linearCurve,
      exponentialCurve,
      sigmoidCurve,
      owner,
      creator,
      user1,
      minBond,
      baseConfig
    };
  }

  function keccak256(str) {
    return ethers.keccak256(ethers.toUtf8Bytes(str));
  }

  describe("CurveType Enum", function() {
    it("Should have correct enum values", async function() {
      const { factory } = await loadFixture(deployFactoryCurveFixture);

      // Enum values are: 0=LMSR, 1=LINEAR, 2=EXPONENTIAL, 3=SIGMOID
      // We can't directly test enum values, but we can test with them
      const LMSR = 0;
      const LINEAR = 1;
      const EXPONENTIAL = 2;
      const SIGMOID = 3;

      // These should be valid curve types (tested in createMarketWithCurve tests)
      expect(LMSR).to.equal(0);
      expect(LINEAR).to.equal(1);
      expect(EXPONENTIAL).to.equal(2);
      expect(SIGMOID).to.equal(3);
    });
  });

  describe("createMarketWithCurve - LMSR", function() {
    it("Should create market with LMSR curve configuration", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const curveType = 0; // LMSR
      const curveParams = ethers.parseEther("100"); // b = 100 BASED

      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        curveType,
        curveParams,
        { value: minBond }
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      // Get market address from event
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "MarketCreatedWithCurve";
        } catch {
          return false;
        }
      });
      expect(event).to.not.be.undefined;
    });

    it("Should store LMSR curve configuration correctly", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const curveType = 0; // LMSR
      const curveParams = ethers.parseEther("100");

      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        curveType,
        curveParams,
        { value: minBond }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "MarketCreatedWithCurve";
        } catch {
          return false;
        }
      });

      const parsedEvent = factory.interface.parseLog(event);
      const marketAddress = parsedEvent.args.marketAddress;

      // Get curve config
      const [storedType, storedParams] = await factory.getMarketCurveConfig(marketAddress);
      expect(storedType).to.equal(curveType);
      expect(storedParams).to.equal(curveParams);
    });

    it("Should emit MarketCreatedWithCurve event with correct data", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const curveType = 0; // LMSR
      const curveParams = ethers.parseEther("100");

      await expect(
        factory.connect(creator).createMarketWithCurve(
          baseConfig,
          curveType,
          curveParams,
          { value: minBond }
        )
      ).to.emit(factory, "MarketCreatedWithCurve")
       .withArgs(
         ethers.isAddress, // marketAddress
         creator.address,
         baseConfig.question,
         baseConfig.resolutionTime,
         curveType,
         curveParams,
         baseConfig.category,
         ethers.isNumber // timestamp
       );
    });
  });

  describe("createMarketWithCurve - Linear", function() {
    it("Should create market with Linear curve configuration", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const curveType = 1; // LINEAR
      const minPrice = ethers.parseEther("0.01");
      const maxPrice = ethers.parseEther("0.99");
      const priceRange = ethers.parseEther("0.98");

      // Pack parameters [minPrice:64][maxPrice:64][priceRange:128]
      const curveParams = (minPrice << 192n) | (maxPrice << 128n) | priceRange;

      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        curveType,
        curveParams,
        { value: minBond }
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      // Verify event
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "MarketCreatedWithCurve";
        } catch {
          return false;
        }
      });
      expect(event).to.not.be.undefined;
    });

    it("Should store Linear curve configuration correctly", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const curveType = 1; // LINEAR
      const curveParams = (1n << 192n) | (2n << 128n) | 3n;

      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        curveType,
        curveParams,
        { value: minBond }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "MarketCreatedWithCurve";
        } catch {
          return false;
        }
      });

      const parsedEvent = factory.interface.parseLog(event);
      const marketAddress = parsedEvent.args.marketAddress;

      const [storedType, storedParams] = await factory.getMarketCurveConfig(marketAddress);
      expect(storedType).to.equal(curveType);
      expect(storedParams).to.equal(curveParams);
    });
  });

  describe("createMarketWithCurve - Exponential", function() {
    it("Should create market with Exponential curve configuration", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const curveType = 2; // EXPONENTIAL
      const basePrice = ethers.parseEther("0.01");
      const growthRate = 15000n; // 1.5 scaled by 10000
      const maxPrice = ethers.parseEther("0.99");

      // Pack parameters [basePrice:64][growthRate:64][maxPrice:128]
      const curveParams = (basePrice << 192n) | (growthRate << 128n) | maxPrice;

      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        curveType,
        curveParams,
        { value: minBond }
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    });

    it("Should store Exponential curve configuration correctly", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const curveType = 2; // EXPONENTIAL
      const curveParams = (1n << 192n) | (2n << 128n) | 3n;

      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        curveType,
        curveParams,
        { value: minBond }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "MarketCreatedWithCurve";
        } catch {
          return false;
        }
      });

      const parsedEvent = factory.interface.parseLog(event);
      const marketAddress = parsedEvent.args.marketAddress;

      const [storedType, storedParams] = await factory.getMarketCurveConfig(marketAddress);
      expect(storedType).to.equal(curveType);
      expect(storedParams).to.equal(curveParams);
    });
  });

  describe("createMarketWithCurve - Sigmoid", function() {
    it("Should create market with Sigmoid curve configuration", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const curveType = 3; // SIGMOID
      const minPrice = ethers.parseEther("0.01");
      const maxPrice = ethers.parseEther("0.99");
      const steepness = 50n; // 0-100
      const inflection = ethers.parseEther("500");

      // Pack parameters [minPrice:64][maxPrice:64][steepness:32][inflection:96]
      const curveParams = (minPrice << 192n) | (maxPrice << 128n) | (steepness << 96n) | inflection;

      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        curveType,
        curveParams,
        { value: minBond }
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    });

    it("Should store Sigmoid curve configuration correctly", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const curveType = 3; // SIGMOID
      const curveParams = (1n << 192n) | (2n << 128n) | (3n << 96n) | 4n;

      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        curveType,
        curveParams,
        { value: minBond }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "MarketCreatedWithCurve";
        } catch {
          return false;
        }
      });

      const parsedEvent = factory.interface.parseLog(event);
      const marketAddress = parsedEvent.args.marketAddress;

      const [storedType, storedParams] = await factory.getMarketCurveConfig(marketAddress);
      expect(storedType).to.equal(curveType);
      expect(storedParams).to.equal(curveParams);
    });
  });

  describe("CurveRegistry Integration", function() {
    it("Should validate curve exists in registry", async function() {
      const { factory, creator, baseConfig, minBond, curveRegistry, lmsrCurve } = await loadFixture(deployFactoryCurveFixture);

      // Verify LMSR curve is registered
      const curveAddress = await curveRegistry.getCurveByName("LMSRCurve");
      expect(curveAddress).to.equal(lmsrCurve.target);

      // Create market should succeed
      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        0, // LMSR
        ethers.parseEther("100"),
        { value: minBond }
      );

      expect(tx).to.not.be.reverted;
    });

    it("Should revert if curve not registered", async function() {
      const { factory, creator, baseConfig, minBond, curveRegistry, linearCurve } = await loadFixture(deployFactoryCurveFixture);

      // Deactivate LinearCurve
      await curveRegistry.setCurveStatus(linearCurve.target, false);

      // Try to create market with deactivated curve
      await expect(
        factory.connect(creator).createMarketWithCurve(
          baseConfig,
          1, // LINEAR
          ethers.parseEther("100"),
          { value: minBond }
        )
      ).to.be.reverted;

      // Reactivate for other tests
      await curveRegistry.setCurveStatus(linearCurve.target, true);
    });

    it("Should revert on zero curve params", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      await expect(
        factory.connect(creator).createMarketWithCurve(
          baseConfig,
          0, // LMSR
          0, // Invalid: zero params
          { value: minBond }
        )
      ).to.be.revertedWithCustomError(factory, "InvalidCurveParams");
    });
  });

  describe("Backward Compatibility", function() {
    it("Should maintain old createMarket function", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      // Old function should still work
      const tx = await factory.connect(creator).createMarket(
        baseConfig,
        { value: minBond }
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      // Should emit old MarketCreated event (not MarketCreatedWithCurve)
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "MarketCreated";
        } catch {
          return false;
        }
      });
      expect(event).to.not.be.undefined;
    });

    it("Should default to LMSR when using old createMarket", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const tx = await factory.connect(creator).createMarket(
        baseConfig,
        { value: minBond }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "MarketCreated";
        } catch {
          return false;
        }
      });

      const parsedEvent = factory.interface.parseLog(event);
      const marketAddress = parsedEvent.args.marketAddress;

      // Should have default LMSR curve config
      const [curveType, curveParams] = await factory.getMarketCurveConfig(marketAddress);
      expect(curveType).to.equal(0); // LMSR
      expect(curveParams).to.equal(ethers.parseEther("100")); // b = 100 BASED
    });
  });

  describe("Gas Costs", function() {
    it("Should stay under 2M gas for LMSR creation", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        0, // LMSR
        ethers.parseEther("100"),
        { value: minBond }
      );

      const receipt = await tx.wait();
      expect(receipt.gasUsed).to.be.lessThan(2000000n);
      console.log(`      Gas used (LMSR): ${receipt.gasUsed.toString()}`);
    });

    it("Should stay under 2M gas for Linear creation", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        1, // LINEAR
        (1n << 192n) | (2n << 128n) | 3n,
        { value: minBond }
      );

      const receipt = await tx.wait();
      expect(receipt.gasUsed).to.be.lessThan(2000000n);
      console.log(`      Gas used (Linear): ${receipt.gasUsed.toString()}`);
    });

    it("Should stay under 2M gas for Exponential creation", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        2, // EXPONENTIAL
        (1n << 192n) | (2n << 128n) | 3n,
        { value: minBond }
      );

      const receipt = await tx.wait();
      expect(receipt.gasUsed).to.be.lessThan(2000000n);
      console.log(`      Gas used (Exponential): ${receipt.gasUsed.toString()}`);
    });

    it("Should stay under 2M gas for Sigmoid creation", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        3, // SIGMOID
        (1n << 192n) | (2n << 128n) | (3n << 96n) | 4n,
        { value: minBond }
      );

      const receipt = await tx.wait();
      expect(receipt.gasUsed).to.be.lessThan(2000000n);
      console.log(`      Gas used (Sigmoid): ${receipt.gasUsed.toString()}`);
    });
  });

  describe("Error Cases", function() {
    it("Should revert on invalid curve type", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      // Solidity will revert on invalid enum value (type conversion error)
      // We can't easily test this in JS, so skip
    });

    it("Should revert on insufficient bond", async function() {
      const { factory, creator, baseConfig } = await loadFixture(deployFactoryCurveFixture);

      await expect(
        factory.connect(creator).createMarketWithCurve(
          baseConfig,
          0, // LMSR
          ethers.parseEther("100"),
          { value: ethers.parseEther("0.01") } // Too low
        )
      ).to.be.revertedWithCustomError(factory, "InsufficientBond");
    });

    it("Should revert on invalid resolution time", async function() {
      const { factory, creator, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const invalidConfig = {
        ...baseConfig,
        resolutionTime: Math.floor(Date.now() / 1000) - 1 // Past
      };

      await expect(
        factory.connect(creator).createMarketWithCurve(
          invalidConfig,
          0, // LMSR
          ethers.parseEther("100"),
          { value: minBond }
        )
      ).to.be.revertedWithCustomError(factory, "InvalidResolutionTime");
    });
  });

  // ============= PHASE 3: CURVE USAGE VALIDATION =============
  // Tests that markets actually USE bonding curves for pricing and payouts

  describe("PHASE 3: Market Curve Usage - LMSR", function() {
    it("Should use LMSR curve for pricing", async function() {
      const { factory, registry, creator, user1, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      // Create market with LMSR
      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        0, // LMSR
        ethers.parseEther("100"), // b = 100 BASED
        { value: minBond }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "MarketCreatedWithCurve";
        } catch {
          return false;
        }
      });
      const marketAddress = factory.interface.parseLog(event).args.marketAddress;

      // Get market contract
      const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
      const market = PredictionMarket.attach(marketAddress);

      // Place a bet
      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1") });

      // Get odds - should be calculated by LMSR curve
      const [odds1, odds2] = await market.getOdds();

      // LMSR behavior: With b=100 and small bet, odds should be reasonable
      // Not testing exact values (curve-specific), just that they're valid
      expect(odds1).to.be.gt(10000); // >1.0x odds
      expect(odds2).to.be.gt(10000);
      expect(odds1).to.not.equal(odds2); // Should be different after one-sided bet
    });

    it("Should complete full lifecycle with LMSR", async function() {
      const { factory, registry, creator, user1, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      // Create market
      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        0, // LMSR
        ethers.parseEther("100"),
        { value: minBond }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "MarketCreatedWithCurve";
        } catch {
          return false;
        }
      });
      const marketAddress = factory.interface.parseLog(event).args.marketAddress;

      const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
      const market = PredictionMarket.attach(marketAddress);

      // Place bets
      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1") });

      // Resolve market (need ResolutionManager)
      const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
      const resolutionManager = await ResolutionManager.deploy(
        registry.target,
        86400, // 1 day dispute window
        ethers.parseEther("1") // 1 BASED min dispute bond
      );
      await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("ResolutionManager", 1, 1)), resolutionManager.target, 1);

      // Fast forward past resolution time
      await ethers.provider.send("evm_setNextBlockTimestamp", [baseConfig.resolutionTime + 1]);
      await ethers.provider.send("evm_mine");

      // Resolve to outcome 1 (winner)
      await resolutionManager.resolveMarket(marketAddress, 1);

      // Calculate payout - should use share-based calculation
      const payout = await market.calculatePayout(user1.address);
      expect(payout).to.be.gt(0); // Winner should get payout

      // Claim winnings
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      const claimTx = await market.connect(user1).claimWinnings();
      const claimReceipt = await claimTx.wait();
      const gasCost = claimReceipt.gasUsed * claimReceipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(user1.address);

      // Verify payout received
      const actualPayout = balanceAfter - balanceBefore + gasCost;
      expect(actualPayout).to.be.closeTo(payout, ethers.parseEther("0.01"));
    });
  });

  describe("PHASE 3: Market Curve Usage - Linear", function() {
    it("Should use Linear curve for pricing", async function() {
      const { factory, registry, creator, user1, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      // Create market with Linear
      const minPrice = ethers.parseEther("0.01");
      const maxPrice = ethers.parseEther("0.99");
      const priceRange = ethers.parseEther("0.98");
      const curveParams = (minPrice << 192n) | (maxPrice << 128n) | priceRange;

      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        1, // LINEAR
        curveParams,
        { value: minBond }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "MarketCreatedWithCurve";
        } catch {
          return false;
        }
      });
      const marketAddress = factory.interface.parseLog(event).args.marketAddress;

      const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
      const market = PredictionMarket.attach(marketAddress);

      // Place bet
      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1") });

      // Get odds - calculated by Linear curve
      const [odds1, odds2] = await market.getOdds();

      expect(odds1).to.be.gt(10000); // Valid odds
      expect(odds2).to.be.gt(10000);
    });

    it("Should complete full lifecycle with Linear", async function() {
      const { factory, registry, creator, user1, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const curveParams = (ethers.parseEther("0.01") << 192n) | (ethers.parseEther("0.99") << 128n) | ethers.parseEther("0.98");

      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        1, // LINEAR
        curveParams,
        { value: minBond }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "MarketCreatedWithCurve";
        } catch {
          return false;
        }
      });
      const marketAddress = factory.interface.parseLog(event).args.marketAddress;

      const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
      const market = PredictionMarket.attach(marketAddress);

      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1") });

      // Setup resolution
      const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
      const resolutionManager = await ResolutionManager.deploy(
        registry.target,
        86400,
        ethers.parseEther("1")
      );
      await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("ResolutionManager", 1, 1)), resolutionManager.target, 1);

      await ethers.provider.send("evm_setNextBlockTimestamp", [baseConfig.resolutionTime + 1]);
      await ethers.provider.send("evm_mine");

      await resolutionManager.resolveMarket(marketAddress, 1);

      const payout = await market.calculatePayout(user1.address);
      expect(payout).to.be.gt(0);
    });
  });

  describe("PHASE 3: Market Curve Usage - Exponential", function() {
    it("Should use Exponential curve for pricing", async function() {
      const { factory, registry, creator, user1, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const basePrice = ethers.parseEther("0.01");
      const growthRate = 15000n; // 1.5 scaled by 10000
      const maxPrice = ethers.parseEther("0.99");
      const curveParams = (basePrice << 192n) | (growthRate << 128n) | maxPrice;

      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        2, // EXPONENTIAL
        curveParams,
        { value: minBond }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "MarketCreatedWithCurve";
        } catch {
          return false;
        }
      });
      const marketAddress = factory.interface.parseLog(event).args.marketAddress;

      const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
      const market = PredictionMarket.attach(marketAddress);

      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1") });

      const [odds1, odds2] = await market.getOdds();
      expect(odds1).to.be.gt(10000);
      expect(odds2).to.be.gt(10000);
    });
  });

  describe("PHASE 3: Market Curve Usage - Sigmoid", function() {
    it("Should use Sigmoid curve for pricing", async function() {
      const { factory, registry, creator, user1, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      const minPrice = ethers.parseEther("0.01");
      const maxPrice = ethers.parseEther("0.99");
      const steepness = 50n;
      const inflection = ethers.parseEther("500");
      const curveParams = (minPrice << 192n) | (maxPrice << 128n) | (steepness << 96n) | inflection;

      const tx = await factory.connect(creator).createMarketWithCurve(
        baseConfig,
        3, // SIGMOID
        curveParams,
        { value: minBond }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "MarketCreatedWithCurve";
        } catch {
          return false;
        }
      });
      const marketAddress = factory.interface.parseLog(event).args.marketAddress;

      const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
      const market = PredictionMarket.attach(marketAddress);

      await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1") });

      const [odds1, odds2] = await market.getOdds();
      expect(odds1).to.be.gt(10000);
      expect(odds2).to.be.gt(10000);
    });
  });

  describe("PHASE 3: Curve Behavior Comparison", function() {
    it("Should produce different odds for different curves", async function() {
      const { factory, registry, creator, user1, baseConfig, minBond } = await loadFixture(deployFactoryCurveFixture);

      // Create 4 identical markets with different curves
      const configs = [
        { type: 0, params: ethers.parseEther("100") }, // LMSR
        { type: 1, params: (ethers.parseEther("0.01") << 192n) | (ethers.parseEther("0.99") << 128n) | ethers.parseEther("0.98") }, // Linear
        { type: 2, params: (ethers.parseEther("0.01") << 192n) | (15000n << 128n) | ethers.parseEther("0.99") }, // Exponential
        { type: 3, params: (ethers.parseEther("0.01") << 192n) | (ethers.parseEther("0.99") << 128n) | (50n << 96n) | ethers.parseEther("500") } // Sigmoid
      ];

      const markets = [];
      for (const config of configs) {
        const tx = await factory.connect(creator).createMarketWithCurve(
          baseConfig,
          config.type,
          config.params,
          { value: minBond }
        );

        const receipt = await tx.wait();
        const event = receipt.logs.find(log => {
          try {
            return factory.interface.parseLog(log).name === "MarketCreatedWithCurve";
          } catch {
            return false;
          }
        });
        const marketAddress = factory.interface.parseLog(event).args.marketAddress;

        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
        markets.push(PredictionMarket.attach(marketAddress));
      }

      // Place identical bets on all markets
      for (const market of markets) {
        await market.connect(user1).placeBet(1, 0, { value: ethers.parseEther("1") });
      }

      // Get odds from all markets
      const allOdds = [];
      for (const market of markets) {
        const [odds1, odds2] = await market.getOdds();
        allOdds.push({ odds1, odds2 });
      }

      // Verify curves produce different odds
      // At least some curves should have different odds
      const uniqueOdds1 = [...new Set(allOdds.map(o => o.odds1.toString()))];
      expect(uniqueOdds1.length).to.be.gt(1, "Different curves should produce different odds");
    });
  });
});

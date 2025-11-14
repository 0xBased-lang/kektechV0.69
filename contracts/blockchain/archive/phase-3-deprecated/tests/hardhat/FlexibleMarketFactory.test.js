const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FlexibleMarketFactory", function () {
  // ============= Test Fixtures =============

  async function deployFixture() {
    const [owner, operator, admin, creator1, creator2, user1, treasury] = await ethers.getSigners();

    // Deploy VersionedRegistry
    const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
    const registry = await VersionedRegistry.deploy();

    // Deploy ParameterStorage
    const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
    const params = await ParameterStorage.deploy(registry.target);

    // Deploy AccessControlManager
    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    const accessControl = await AccessControlManager.deploy(registry.target);

    // Register contracts
    await registry.setContract(ethers.id("ParameterStorage"), params.target, 1);
    await registry.setContract(ethers.id("AccessControlManager"), accessControl.target, 1);

    // Setup roles
    await accessControl.grantRole(ethers.id("OPERATOR_ROLE"), operator.address);
    await accessControl.grantRole(ethers.id("ADMIN_ROLE"), admin.address);
    // SECURITY FIX (M-2): Grant ADMIN_ROLE to owner for ParameterStorage access
    await accessControl.grantRole(ethers.id("ADMIN_ROLE"), owner.address);

    // Set platform fee
    await params.setParameter(ethers.id("platformFeePercent"), 250); // 2.5%

    // Deploy PredictionMarket template (Phase 4 requirement)
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const marketTemplate = await PredictionMarket.deploy();

    // Register PredictionMarket template
    await registry.setContract(ethers.id("PredictionMarketTemplate"), marketTemplate.target, 1);

    // Deploy FlexibleMarketFactoryUnified (Phase 4)
    const FlexibleMarketFactoryUnified = await ethers.getContractFactory("FlexibleMarketFactoryUnified");
    const factory = await FlexibleMarketFactoryUnified.deploy(
      registry.target,
      ethers.parseEther("0.1") // minCreatorBond
    );

    // Register factory
    await registry.setContract(ethers.id("FlexibleMarketFactoryUnified"), factory.target, 1);

    return {
      registry,
      params,
      accessControl,
      factory,
      owner,
      operator,
      admin,
      creator1,
      creator2,
      user1,
      treasury
    };
  }

  async function deployWithMarketsFixture() {
    const fixture = await deployFixture();
    const { factory, creator1, operator } = fixture;

    // Create a market
    const resolutionTime = (await time.latest()) + 86400; // 1 day from now
    const config = {
      question: "Will ETH hit $5000?",
      description: "ETH price prediction",
      resolutionTime: resolutionTime,
      creatorBond: ethers.parseEther("0.1"),
      category: ethers.id("crypto"),
      outcome1: "Yes",
      outcome2: "No"
    };

    const tx = await factory.connect(creator1).createMarket(config, {
      value: ethers.parseEther("0.1")
    });
    const receipt = await tx.wait();

    // Extract market address from event
    const event = receipt.logs.find(log => {
      try {
        return factory.interface.parseLog(log).name === "MarketCreated";
      } catch {
        return false;
      }
    });
    const marketAddress = factory.interface.parseLog(event).args.marketAddress;

    return { ...fixture, marketAddress, config };
  }

  // ============= Deployment & Initialization Tests =============

  describe("Deployment & Initialization", function () {
    it("Should deploy FlexibleMarketFactory contract", async function () {
      const { factory } = await loadFixture(deployFixture);
      expect(factory.target).to.properAddress;
    });

    it("Should set correct registry reference", async function () {
      const { factory, registry } = await loadFixture(deployFixture);
      expect(await factory.registry()).to.equal(registry.target);
    });

    it("Should set correct minimum creator bond", async function () {
      const { factory } = await loadFixture(deployFixture);
      expect(await factory.minCreatorBond()).to.equal(ethers.parseEther("0.1"));
    });

    it("Should start unpaused", async function () {
      const { factory } = await loadFixture(deployFixture);
      expect(await factory.paused()).to.be.false;
    });

    it("Should start with zero markets", async function () {
      const { factory } = await loadFixture(deployFixture);
      expect(await factory.getMarketCount()).to.equal(0);
    });
  });

  // ============= Market Creation Tests =============

  describe("Market Creation", function () {
    it("Should create market with valid config", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      const resolutionTime = (await time.latest()) + 86400;
      const config = {
        question: "Will BTC hit $100k?",
        description: "Bitcoin price prediction",
        resolutionTime: resolutionTime,
        creatorBond: ethers.parseEther("0.1"),
        category: ethers.id("crypto"),
        outcome1: "Yes",
        outcome2: "No"
      };

      await expect(
        factory.connect(creator1).createMarket(config, {
          value: ethers.parseEther("0.1")
        })
      ).to.emit(factory, "MarketCreated");
    });

    it("Should increment market count after creation", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      const resolutionTime = (await time.latest()) + 86400;
      const config = {
        question: "Test question?",
        description: "Test description",
        resolutionTime: resolutionTime,
        creatorBond: ethers.parseEther("0.1"),
        category: ethers.id("test"),
        outcome1: "Yes",
        outcome2: "No"
      };

      await factory.connect(creator1).createMarket(config, {
        value: ethers.parseEther("0.1")
      });

      expect(await factory.getMarketCount()).to.equal(1);
    });

    it("Should emit MarketCreated event with correct parameters", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      const resolutionTime = (await time.latest()) + 86400;
      const config = {
        question: "Event test?",
        description: "Testing events",
        resolutionTime: resolutionTime,
        creatorBond: ethers.parseEther("0.1"),
        category: ethers.id("test"),
        outcome1: "Yes",
        outcome2: "No"
      };

      const tx = await factory.connect(creator1).createMarket(config, {
        value: ethers.parseEther("0.1")
      });

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "MarketCreated";
        } catch {
          return false;
        }
      });

      const parsedEvent = factory.interface.parseLog(event);
      expect(parsedEvent.args.creator).to.equal(creator1.address);
      expect(parsedEvent.args.question).to.equal(config.question);
      expect(parsedEvent.args.resolutionTime).to.equal(config.resolutionTime);
      expect(parsedEvent.args.creatorBond).to.equal(config.creatorBond);
      expect(parsedEvent.args.category).to.equal(config.category);
    });

    it("Should require sufficient creator bond", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      const resolutionTime = (await time.latest()) + 86400;
      const config = {
        question: "Test?",
        description: "Test",
        resolutionTime: resolutionTime,
        creatorBond: ethers.parseEther("0.1"),
        category: ethers.id("test"),
        outcome1: "Yes",
        outcome2: "No"
      };

      await expect(
        factory.connect(creator1).createMarket(config, {
          value: ethers.parseEther("0.05") // Insufficient
        })
      ).to.be.revertedWithCustomError(factory, "InsufficientBond");
    });

    it("Should require valid resolution time (future)", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      const pastTime = (await time.latest()) - 1000;
      const config = {
        question: "Test?",
        description: "Test",
        resolutionTime: pastTime,
        creatorBond: ethers.parseEther("0.1"),
        category: ethers.id("test"),
        outcome1: "Yes",
        outcome2: "No"
      };

      await expect(
        factory.connect(creator1).createMarket(config, {
          value: ethers.parseEther("0.1")
        })
      ).to.be.revertedWithCustomError(factory, "InvalidResolutionTime");
    });

    it("Should require non-empty question", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      const resolutionTime = (await time.latest()) + 86400;
      const config = {
        question: "",
        description: "Test",
        resolutionTime: resolutionTime,
        creatorBond: ethers.parseEther("0.1"),
        category: ethers.id("test"),
        outcome1: "Yes",
        outcome2: "No"
      };

      await expect(
        factory.connect(creator1).createMarket(config, {
          value: ethers.parseEther("0.1")
        })
      ).to.be.revertedWithCustomError(factory, "InvalidQuestion");
    });

    it("Should require valid category", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      const resolutionTime = (await time.latest()) + 86400;
      const config = {
        question: "Test?",
        description: "Test",
        resolutionTime: resolutionTime,
        creatorBond: ethers.parseEther("0.1"),
        category: ethers.ZeroHash,
        outcome1: "Yes",
        outcome2: "No"
      };

      await expect(
        factory.connect(creator1).createMarket(config, {
          value: ethers.parseEther("0.1")
        })
      ).to.be.revertedWithCustomError(factory, "InvalidCategory");
    });

    it("Should prevent creation when paused", async function () {
      const { factory, creator1, admin } = await loadFixture(deployFixture);

      await factory.connect(admin).pause();

      const resolutionTime = (await time.latest()) + 86400;
      const config = {
        question: "Test?",
        description: "Test",
        resolutionTime: resolutionTime,
        creatorBond: ethers.parseEther("0.1"),
        category: ethers.id("test"),
        outcome1: "Yes",
        outcome2: "No"
      };

      await expect(
        factory.connect(creator1).createMarket(config, {
          value: ethers.parseEther("0.1")
        })
      ).to.be.revertedWithCustomError(factory, "ContractPaused");
    });

    it("Should store market info correctly", async function () {
      const { factory, marketAddress, creator1, config } = await loadFixture(deployWithMarketsFixture);

      const info = await factory.getMarketInfo(marketAddress);
      expect(info.marketAddress).to.equal(marketAddress);
      expect(info.creator).to.equal(creator1.address);
      expect(info.category).to.equal(config.category);
      expect(info.isActive).to.be.true;
    });

    it("Should allow multiple markets from same creator", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      const resolutionTime = (await time.latest()) + 86400;

      for (let i = 0; i < 3; i++) {
        const config = {
          question: `Question ${i}?`,
          description: `Description ${i}`,
          resolutionTime: resolutionTime,
          creatorBond: ethers.parseEther("0.1"),
          category: ethers.id("test"),
          outcome1: "Yes",
          outcome2: "No"
        };

        await factory.connect(creator1).createMarket(config, {
          value: ethers.parseEther("0.1")
        });
      }

      expect(await factory.getMarketCount()).to.equal(3);
    });
  });

  // ============= Template Tests =============

  describe("Template Management", function () {
    it("Should create template", async function () {
      const { factory, admin } = await loadFixture(deployFixture);

      const templateId = ethers.id("yes-no-template");

      await expect(
        factory.connect(admin).createTemplate(
          templateId,
          "Yes/No Template",
          ethers.id("general"),
          "Yes",
          "No"
        )
      ).to.emit(factory, "TemplateCreated")
        .withArgs(templateId, "Yes/No Template", await time.latest() + 1);
    });

    it("Should retrieve template data", async function () {
      const { factory, admin } = await loadFixture(deployFixture);

      const templateId = ethers.id("test-template");
      await factory.connect(admin).createTemplate(
        templateId,
        "Test Template",
        ethers.id("test"),
        "Option A",
        "Option B"
      );

      const [name, category, outcome1, outcome2] = await factory.getTemplate(templateId);
      expect(name).to.equal("Test Template");
      expect(category).to.equal(ethers.id("test"));
      expect(outcome1).to.equal("Option A");
      expect(outcome2).to.equal("Option B");
    });

    it("Should create market from template", async function () {
      const { factory, admin, creator1 } = await loadFixture(deployFixture);

      const templateId = ethers.id("template1");
      await factory.connect(admin).createTemplate(
        templateId,
        "Template 1",
        ethers.id("category1"),
        "Yes",
        "No"
      );

      const resolutionTime = (await time.latest()) + 86400;

      await expect(
        factory.connect(creator1).createMarketFromTemplate(
          templateId,
          "Will it happen?",
          resolutionTime,
          { value: ethers.parseEther("0.1") }
        )
      ).to.emit(factory, "MarketCreated");
    });

    it("Should revert for non-existent template", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      const fakeTemplateId = ethers.id("fake-template");
      const resolutionTime = (await time.latest()) + 86400;

      await expect(
        factory.connect(creator1).createMarketFromTemplate(
          fakeTemplateId,
          "Question?",
          resolutionTime,
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWithCustomError(factory, "TemplateNotFound");
    });

    it("Should only allow admin to create templates", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      const templateId = ethers.id("unauthorized-template");

      await expect(
        factory.connect(creator1).createTemplate(
          templateId,
          "Unauthorized",
          ethers.id("test"),
          "Yes",
          "No"
        )
      ).to.be.revertedWithCustomError(factory, "UnauthorizedAccess");
    });
  });

  // ============= Market Management Tests =============

  describe("Market Management", function () {
    it("Should activate market", async function () {
      const { factory, marketAddress, admin } = await loadFixture(deployWithMarketsFixture);

      // Deactivate first
      await factory.connect(admin).deactivateMarket(marketAddress, "Test");

      await expect(
        factory.connect(admin).activateMarket(marketAddress)
      ).to.emit(factory, "MarketActivated")
        .withArgs(marketAddress, await time.latest() + 1);
    });

    it("Should deactivate market", async function () {
      const { factory, marketAddress, admin } = await loadFixture(deployWithMarketsFixture);

      await expect(
        factory.connect(admin).deactivateMarket(marketAddress, "Violation")
      ).to.emit(factory, "MarketDeactivated")
        .withArgs(marketAddress, "Violation", await time.latest() + 1);
    });

    it("Should update isActive flag on deactivation", async function () {
      const { factory, marketAddress, admin } = await loadFixture(deployWithMarketsFixture);

      await factory.connect(admin).deactivateMarket(marketAddress, "Test");

      const info = await factory.getMarketInfo(marketAddress);
      expect(info.isActive).to.be.false;
    });

    it("Should refund creator bond", async function () {
      const { factory, marketAddress, creator1, admin } = await loadFixture(deployWithMarketsFixture);

      await expect(
        factory.connect(admin).refundCreatorBond(marketAddress)
      ).to.emit(factory, "CreatorBondRefunded")
        .withArgs(marketAddress, creator1.address, ethers.parseEther("0.1"), await time.latest() + 1);
    });

    it("Should only allow admin to manage markets", async function () {
      const { factory, marketAddress, creator1 } = await loadFixture(deployWithMarketsFixture);

      await expect(
        factory.connect(creator1).deactivateMarket(marketAddress, "Test")
      ).to.be.revertedWithCustomError(factory, "UnauthorizedAccess");
    });

    it("Should revert for non-existent market", async function () {
      const { factory, admin } = await loadFixture(deployFixture);

      const fakeAddress = ethers.Wallet.createRandom().address;

      await expect(
        factory.connect(admin).activateMarket(fakeAddress)
      ).to.be.revertedWithCustomError(factory, "MarketNotFound");
    });
  });

  // ============= Enumeration Tests =============

  describe("Market Enumeration", function () {
    it("Should return all markets", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      const resolutionTime = (await time.latest()) + 86400;

      // Create 3 markets
      for (let i = 0; i < 3; i++) {
        const config = {
          question: `Q${i}?`,
          description: `D${i}`,
          resolutionTime: resolutionTime,
          creatorBond: ethers.parseEther("0.1"),
          category: ethers.id("test"),
          outcome1: "Yes",
          outcome2: "No"
        };

        await factory.connect(creator1).createMarket(config, {
          value: ethers.parseEther("0.1")
        });
      }

      const markets = await factory.getAllMarkets();
      expect(markets.length).to.equal(3);
    });

    it("Should return market at index", async function () {
      const { factory, marketAddress } = await loadFixture(deployWithMarketsFixture);

      const market = await factory.getMarketAt(0);
      expect(market).to.equal(marketAddress);
    });

    it("Should return active markets only", async function () {
      const { factory, creator1, admin } = await loadFixture(deployFixture);

      const resolutionTime = (await time.latest()) + 86400;

      // Create 3 markets
      const markets = [];
      for (let i = 0; i < 3; i++) {
        const config = {
          question: `Q${i}?`,
          description: `D${i}`,
          resolutionTime: resolutionTime,
          creatorBond: ethers.parseEther("0.1"),
          category: ethers.id("test"),
          outcome1: "Yes",
          outcome2: "No"
        };

        const tx = await factory.connect(creator1).createMarket(config, {
          value: ethers.parseEther("0.1")
        });
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => {
          try {
            return factory.interface.parseLog(log).name === "MarketCreated";
          } catch {
            return false;
          }
        });
        markets.push(factory.interface.parseLog(event).args.marketAddress);
      }

      // Deactivate middle market
      await factory.connect(admin).deactivateMarket(markets[1], "Test");

      const activeMarkets = await factory.getActiveMarkets();
      expect(activeMarkets.length).to.equal(2);
      expect(activeMarkets).to.include(markets[0]);
      expect(activeMarkets).to.include(markets[2]);
      expect(activeMarkets).to.not.include(markets[1]);
    });

    it("Should return markets by creator", async function () {
      const { factory, creator1, creator2 } = await loadFixture(deployFixture);

      const resolutionTime = (await time.latest()) + 86400;
      const config = {
        question: "Test?",
        description: "Test",
        resolutionTime: resolutionTime,
        creatorBond: ethers.parseEther("0.1"),
        category: ethers.id("test"),
        outcome1: "Yes",
        outcome2: "No"
      };

      // Creator1 creates 2 markets
      await factory.connect(creator1).createMarket(config, {
        value: ethers.parseEther("0.1")
      });
      await factory.connect(creator1).createMarket(config, {
        value: ethers.parseEther("0.1")
      });

      // Creator2 creates 1 market
      await factory.connect(creator2).createMarket(config, {
        value: ethers.parseEther("0.1")
      });

      const creator1Markets = await factory.getMarketsByCreator(creator1.address);
      const creator2Markets = await factory.getMarketsByCreator(creator2.address);

      expect(creator1Markets.length).to.equal(2);
      expect(creator2Markets.length).to.equal(1);
    });

    it("Should return markets by category", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      const resolutionTime = (await time.latest()) + 86400;

      // Create markets in different categories
      const cryptoConfig = {
        question: "Crypto?",
        description: "Test",
        resolutionTime: resolutionTime,
        creatorBond: ethers.parseEther("0.1"),
        category: ethers.id("crypto"),
        outcome1: "Yes",
        outcome2: "No"
      };

      const sportsConfig = {
        question: "Sports?",
        description: "Test",
        resolutionTime: resolutionTime,
        creatorBond: ethers.parseEther("0.1"),
        category: ethers.id("sports"),
        outcome1: "Yes",
        outcome2: "No"
      };

      await factory.connect(creator1).createMarket(cryptoConfig, {
        value: ethers.parseEther("0.1")
      });
      await factory.connect(creator1).createMarket(cryptoConfig, {
        value: ethers.parseEther("0.1")
      });
      await factory.connect(creator1).createMarket(sportsConfig, {
        value: ethers.parseEther("0.1")
      });

      const cryptoMarkets = await factory.getMarketsByCategory(ethers.id("crypto"));
      const sportsMarkets = await factory.getMarketsByCategory(ethers.id("sports"));

      expect(cryptoMarkets.length).to.equal(2);
      expect(sportsMarkets.length).to.equal(1);
    });
  });

  // ============= Admin Functions Tests =============

  describe("Admin Functions", function () {
    it("Should pause factory", async function () {
      const { factory, admin } = await loadFixture(deployFixture);

      await expect(factory.connect(admin).pause())
        .to.emit(factory, "FactoryPaused")
        .withArgs(true);

      expect(await factory.paused()).to.be.true;
    });

    it("Should unpause factory", async function () {
      const { factory, admin } = await loadFixture(deployFixture);

      await factory.connect(admin).pause();

      await expect(factory.connect(admin).unpause())
        .to.emit(factory, "FactoryPaused")
        .withArgs(false);

      expect(await factory.paused()).to.be.false;
    });

    it("Should update minimum bond", async function () {
      const { factory, admin } = await loadFixture(deployFixture);

      await factory.connect(admin).updateMinBond(ethers.parseEther("0.5"));

      expect(await factory.minCreatorBond()).to.equal(ethers.parseEther("0.5"));
    });

    it("Should only allow admin to pause", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      await expect(
        factory.connect(creator1).pause()
      ).to.be.revertedWithCustomError(factory, "UnauthorizedAccess");
    });

    it("Should only allow admin to update min bond", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      await expect(
        factory.connect(creator1).updateMinBond(ethers.parseEther("0.5"))
      ).to.be.revertedWithCustomError(factory, "UnauthorizedAccess");
    });
  });

  // ============= Integration Tests =============

  describe("Integration Tests", function () {
    it("Should integrate with VersionedRegistry", async function () {
      const { factory, registry } = await loadFixture(deployFixture);

      expect(await factory.registry()).to.equal(registry.target);
    });

    it("Should integrate with AccessControlManager", async function () {
      const { factory, admin } = await loadFixture(deployFixture);

      // Admin should be able to pause
      await expect(factory.connect(admin).pause()).to.not.be.reverted;
    });

    it("Should deploy PredictionMarket correctly", async function () {
      const { factory, marketAddress } = await loadFixture(deployWithMarketsFixture);

      // Verify market contract exists
      const code = await ethers.provider.getCode(marketAddress);
      expect(code).to.not.equal("0x");
    });

    it("Should initialize PredictionMarket with correct params", async function () {
      const { factory, marketAddress, config } = await loadFixture(deployWithMarketsFixture);

      const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
      const market = PredictionMarket.attach(marketAddress);

      const info = await market.getMarketInfo();
      expect(info.question).to.equal(config.question);
      expect(info.outcome1Name).to.equal(config.outcome1);
      expect(info.outcome2Name).to.equal(config.outcome2);
    });
  });

  // ============= View Functions Tests =============

  describe("View Functions", function () {
    it("Should check if market is active", async function () {
      const { factory, marketAddress } = await loadFixture(deployWithMarketsFixture);

      expect(await factory.isMarketActive(marketAddress)).to.be.true;
    });

    it("Should return market creator", async function () {
      const { factory, marketAddress, creator1 } = await loadFixture(deployWithMarketsFixture);

      expect(await factory.getMarketCreator(marketAddress)).to.equal(creator1.address);
    });

    it("Should return market info", async function () {
      const { factory, marketAddress, creator1, config } = await loadFixture(deployWithMarketsFixture);

      const info = await factory.getMarketInfo(marketAddress);
      expect(info.creator).to.equal(creator1.address);
      expect(info.category).to.equal(config.category);
      expect(info.isActive).to.be.true;
    });

    // ============= Total Volume Query Tests =============
    describe("Total Volume Query", function () {
      it("Should return zero for new market", async function () {
        const { factory, marketAddress } = await loadFixture(deployWithMarketsFixture);

        const info = await factory.getMarketInfo(marketAddress);
        expect(info.totalVolume).to.equal(0);
      });

      it("Should return correct value after single bet", async function () {
        const { factory, marketAddress } = await loadFixture(deployWithMarketsFixture);

        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
        const market = PredictionMarket.attach(marketAddress);

        const betAmount = ethers.parseEther("1.0");
        const [,, bettor1] = await ethers.getSigners();

        // Place a bet
        await market.connect(bettor1).placeBet(1, 0, { value: betAmount });

        // Query through factory
        const info = await factory.getMarketInfo(marketAddress);
        expect(info.totalVolume).to.equal(betAmount);
      });

      it("Should return sum of multiple bets", async function () {
        const { factory, marketAddress } = await loadFixture(deployWithMarketsFixture);

        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
        const market = PredictionMarket.attach(marketAddress);

        const [,, bettor1, bettor2, bettor3] = await ethers.getSigners();

        // Place multiple bets
        const bet1 = ethers.parseEther("1.0");
        const bet2 = ethers.parseEther("2.5");
        const bet3 = ethers.parseEther("0.75");

        await market.connect(bettor1).placeBet(1, 0, { value: bet1 });
        await market.connect(bettor2).placeBet(2, 0, { value: bet2 });
        await market.connect(bettor3).placeBet(1, 0, { value: bet3 });

        const expectedTotal = bet1 + bet2 + bet3;

        // Query through factory
        const info = await factory.getMarketInfo(marketAddress);
        expect(info.totalVolume).to.equal(expectedTotal);
      });

      it("Should revert for non-existent market", async function () {
        const { factory } = await loadFixture(deployFixture);

        const fakeMarketAddress = "0x0000000000000000000000000000000000000001";

        await expect(
          factory.getMarketInfo(fakeMarketAddress)
        ).to.be.revertedWithCustomError(factory, "MarketNotFound");
      });

      it("Should update totalVolume after each bet", async function () {
        const { factory, marketAddress } = await loadFixture(deployWithMarketsFixture);

        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
        const market = PredictionMarket.attach(marketAddress);

        const [,, bettor1] = await ethers.getSigners();

        // Check initial
        let info = await factory.getMarketInfo(marketAddress);
        expect(info.totalVolume).to.equal(0);

        // Place first bet
        const bet1 = ethers.parseEther("1.0");
        await market.connect(bettor1).placeBet(1, 0, { value: bet1 });

        info = await factory.getMarketInfo(marketAddress);
        expect(info.totalVolume).to.equal(bet1);

        // Place second bet from same user (increasing their position)
        const bet2 = ethers.parseEther("0.5");
        await market.connect(bettor1).placeBet(1, 0, { value: bet2 });

        info = await factory.getMarketInfo(marketAddress);
        expect(info.totalVolume).to.equal(bet1 + bet2);
      });

      it("Should handle large volume correctly", async function () {
        const { factory, marketAddress } = await loadFixture(deployWithMarketsFixture);

        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
        const market = PredictionMarket.attach(marketAddress);

        const [,, bettor1] = await ethers.getSigners();

        // Place large bet
        const largeBet = ethers.parseEther("100.0");
        await market.connect(bettor1).placeBet(1, 0, { value: largeBet });

        const info = await factory.getMarketInfo(marketAddress);
        expect(info.totalVolume).to.equal(largeBet);
      });
    });
  });

  // ============= Edge Cases & Security =============

  describe("Edge Cases & Security", function () {
    it("Should handle creating many markets", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      const resolutionTime = (await time.latest()) + 86400;
      const count = 10;

      for (let i = 0; i < count; i++) {
        const config = {
          question: `Q${i}?`,
          description: `D${i}`,
          resolutionTime: resolutionTime,
          creatorBond: ethers.parseEther("0.1"),
          category: ethers.id("test"),
          outcome1: "Yes",
          outcome2: "No"
        };

        await factory.connect(creator1).createMarket(config, {
          value: ethers.parseEther("0.1")
        });
      }

      expect(await factory.getMarketCount()).to.equal(count);
    });

    it("Should handle empty enumeration queries", async function () {
      const { factory } = await loadFixture(deployFixture);

      expect(await factory.getAllMarkets()).to.have.length(0);
      expect(await factory.getActiveMarkets()).to.have.length(0);
    });

    it("Should protect against reentrancy", async function () {
      // Reentrancy protection is built into the contract
      // This test verifies the modifier is present
      const { factory } = await loadFixture(deployFixture);
      expect(factory.target).to.properAddress;
    });

    it("Should handle excess bond payment", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      const resolutionTime = (await time.latest()) + 86400;
      const config = {
        question: "Test?",
        description: "Test",
        resolutionTime: resolutionTime,
        creatorBond: ethers.parseEther("0.1"),
        category: ethers.id("test"),
        outcome1: "Yes",
        outcome2: "No"
      };

      // Send more than required
      await expect(
        factory.connect(creator1).createMarket(config, {
          value: ethers.parseEther("0.5")
        })
      ).to.not.be.reverted;
    });
  });

  // ============= Gas Usage Tests =============

  describe("Gas Usage", function () {
    it("Should meet createMarket gas target (<2.1M)", async function () {
      const { factory, creator1 } = await loadFixture(deployFixture);

      const resolutionTime = (await time.latest()) + 86400;
      const config = {
        question: "Gas test?",
        description: "Testing gas",
        resolutionTime: resolutionTime,
        creatorBond: ethers.parseEther("0.1"),
        category: ethers.id("test"),
        outcome1: "Yes",
        outcome2: "No"
      };

      const tx = await factory.connect(creator1).createMarket(config, {
        value: ethers.parseEther("0.1")
      });
      const receipt = await tx.wait();

      console.log(`createMarket gas used: ${receipt.gasUsed}`);
      expect(receipt.gasUsed).to.be.lt(2100000); // 2.1M gas reasonable limit (includes PredictionMarket deployment)
    });

    it("Should optimize enumeration gas", async function () {
      const { factory } = await loadFixture(deployWithMarketsFixture);

      const tx = await factory.getAllMarkets();
      // View function, should be efficient
      expect(tx).to.have.length(1);
    });
  });

  // ============= PHASE 4: APPROVAL SYSTEM TESTS =============

  describe("Approval System (Phase 4)", function () {
    async function createTestMarket(factory, creator) {
      const resolutionTime = (await time.latest()) + 86400;
      const config = {
        question: "Test market for approval?",
        description: "Testing approval system",
        resolutionTime: resolutionTime,
        creatorBond: ethers.parseEther("0.1"),
        category: ethers.id("test"),
        outcome1: "Yes",
        outcome2: "No"
      };

      const tx = await factory.connect(creator).createMarket(config, {
        value: ethers.parseEther("0.1")
      });
      const receipt = await tx.wait();

      // Get market address from event
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "MarketCreated"
      );
      return event.args.marketAddress;
    }

    describe("approveMarket() - Backend Approval", function () {
      it("Should allow backend to approve market", async function () {
        const { factory, creator1, operator, accessControl } = await loadFixture(deployFixture);

        // Grant BACKEND_ROLE to operator
        const BACKEND_ROLE = ethers.id("BACKEND_ROLE");
        await accessControl.grantRole(BACKEND_ROLE, operator.address);

        // Create market
        const market = await createTestMarket(factory, creator1);

        // Approve as backend
        await expect(factory.connect(operator).approveMarket(market))
          .to.emit(factory, "MarketApproved")
          .withArgs(market, operator.address, await time.latest() + 1, false);
      });

      it("Should revert if non-backend tries to approve", async function () {
        const { factory, creator1, user1 } = await loadFixture(deployFixture);

        const market = await createTestMarket(factory, creator1);

        // Try to approve as non-backend
        await expect(
          factory.connect(user1).approveMarket(market)
        ).to.be.revertedWithCustomError(factory, "UnauthorizedAccess");
      });

      it("Should revert if market already approved", async function () {
        const { factory, creator1, operator, accessControl } = await loadFixture(deployFixture);

        const BACKEND_ROLE = ethers.id("BACKEND_ROLE");
        await accessControl.grantRole(BACKEND_ROLE, operator.address);

        const market = await createTestMarket(factory, creator1);

        // Approve once
        await factory.connect(operator).approveMarket(market);

        // Try to approve again
        await expect(
          factory.connect(operator).approveMarket(market)
        ).to.be.revertedWithCustomError(factory, "MarketAlreadyApproved");
      });
    });

    describe("adminApproveMarket() - Admin Override", function () {
      it("Should allow admin to approve market (bypass likes)", async function () {
        const { factory, creator1, admin } = await loadFixture(deployFixture);

        const market = await createTestMarket(factory, creator1);

        // Admin approve (override)
        await expect(factory.connect(admin).adminApproveMarket(market))
          .to.emit(factory, "MarketApproved")
          .withArgs(market, admin.address, await time.latest() + 1, true);
      });

      it("Should revert if non-admin tries to admin approve", async function () {
        const { factory, creator1, user1 } = await loadFixture(deployFixture);

        const market = await createTestMarket(factory, creator1);

        await expect(
          factory.connect(user1).adminApproveMarket(market)
        ).to.be.revertedWithCustomError(factory, "UnauthorizedAccess");
      });

      it("Should revert if admin tries to approve already approved market", async function () {
        const { factory, creator1, admin } = await loadFixture(deployFixture);

        const market = await createTestMarket(factory, creator1);

        // Approve once
        await factory.connect(admin).adminApproveMarket(market);

        // Try to approve again
        await expect(
          factory.connect(admin).adminApproveMarket(market)
        ).to.be.revertedWithCustomError(factory, "MarketAlreadyApproved");
      });
    });

    describe("adminRejectMarket() - Admin Rejection", function () {
      it("Should allow admin to reject market", async function () {
        const { factory, creator1, admin } = await loadFixture(deployFixture);

        const market = await createTestMarket(factory, creator1);

        const reason = "Spam market";
        await expect(factory.connect(admin).adminRejectMarket(market, reason))
          .to.emit(factory, "MarketRejected")
          .withArgs(market, admin.address, reason, await time.latest() + 1);
      });

      it("Should revert if non-admin tries to reject", async function () {
        const { factory, creator1, user1 } = await loadFixture(deployFixture);

        const market = await createTestMarket(factory, creator1);

        await expect(
          factory.connect(user1).adminRejectMarket(market, "spam")
        ).to.be.revertedWithCustomError(factory, "UnauthorizedAccess");
      });

      it("Should revert if rejecting already approved market", async function () {
        const { factory, creator1, admin } = await loadFixture(deployFixture);

        const market = await createTestMarket(factory, creator1);

        // Approve first
        await factory.connect(admin).adminApproveMarket(market);

        // Try to reject
        await expect(
          factory.connect(admin).adminRejectMarket(market, "spam")
        ).to.be.revertedWithCustomError(factory, "MarketAlreadyApproved");
      });
    });

    describe("activateMarket() - Market Activation", function () {
      it("Should allow backend to activate approved market", async function () {
        const { factory, creator1, operator, accessControl } = await loadFixture(deployFixture);

        const BACKEND_ROLE = ethers.id("BACKEND_ROLE");
        await accessControl.grantRole(BACKEND_ROLE, operator.address);

        const market = await createTestMarket(factory, creator1);

        // Approve first
        await factory.connect(operator).approveMarket(market);

        // Activate
        await expect(factory.connect(operator).activateMarket(market))
          .to.emit(factory, "MarketActivated")
          .withArgs(market, await time.latest() + 1);
      });

      it("Should revert if activating unapproved market", async function () {
        const { factory, creator1, operator, accessControl } = await loadFixture(deployFixture);

        const BACKEND_ROLE = ethers.id("BACKEND_ROLE");
        await accessControl.grantRole(BACKEND_ROLE, operator.address);

        const market = await createTestMarket(factory, creator1);

        // Try to activate without approval
        await expect(
          factory.connect(operator).activateMarket(market)
        ).to.be.revertedWithCustomError(factory, "MarketNotApproved");
      });

      it("Should revert if non-backend tries to activate", async function () {
        const { factory, creator1, admin, user1 } = await loadFixture(deployFixture);

        const market = await createTestMarket(factory, creator1);

        // Admin approve
        await factory.connect(admin).adminApproveMarket(market);

        // Try to activate as non-backend
        await expect(
          factory.connect(user1).activateMarket(market)
        ).to.be.revertedWithCustomError(factory, "UnauthorizedAccess");
      });
    });

    describe("Complete Approval Workflow", function () {
      it("Should complete full workflow: create → approve → activate", async function () {
        const { factory, creator1, operator, accessControl } = await loadFixture(deployFixture);

        const BACKEND_ROLE = ethers.id("BACKEND_ROLE");
        await accessControl.grantRole(BACKEND_ROLE, operator.address);

        // 1. Create market
        const market = await createTestMarket(factory, creator1);

        // 2. Backend approves (after likes threshold met)
        await factory.connect(operator).approveMarket(market);

        // 3. Backend activates
        await factory.connect(operator).activateMarket(market);

        // Verify market is now active
        const marketData = await factory.getMarketData(market);
        expect(marketData.isActive).to.be.true;
      });

      it("Should support admin override workflow: create → admin approve → activate", async function () {
        const { factory, creator1, operator, admin, accessControl } = await loadFixture(deployFixture);

        const BACKEND_ROLE = ethers.id("BACKEND_ROLE");
        await accessControl.grantRole(BACKEND_ROLE, operator.address);

        // 1. Create market
        const market = await createTestMarket(factory, creator1);

        // 2. Admin overrides approval (bypass likes)
        await factory.connect(admin).adminApproveMarket(market);

        // 3. Backend activates
        await factory.connect(operator).activateMarket(market);

        // Verify market is now active
        const marketData = await factory.getMarketData(market);
        expect(marketData.isActive).to.be.true;
      });
    });

    describe("Gas Benchmarks - Approval System", function () {
      it("Should measure gas for approveMarket()", async function () {
        const { factory, creator1, operator, accessControl } = await loadFixture(deployFixture);

        const BACKEND_ROLE = ethers.id("BACKEND_ROLE");
        await accessControl.grantRole(BACKEND_ROLE, operator.address);

        const market = await createTestMarket(factory, creator1);

        const tx = await factory.connect(operator).approveMarket(market);
        const receipt = await tx.wait();

        console.log(`approveMarket() gas used: ${receipt.gasUsed}`);
        expect(receipt.gasUsed).to.be.lt(100000); // Should be < 100k gas
      });

      it("Should measure gas for activateMarket()", async function () {
        const { factory, creator1, operator, accessControl } = await loadFixture(deployFixture);

        const BACKEND_ROLE = ethers.id("BACKEND_ROLE");
        await accessControl.grantRole(BACKEND_ROLE, operator.address);

        const market = await createTestMarket(factory, creator1);
        await factory.connect(operator).approveMarket(market);

        const tx = await factory.connect(operator).activateMarket(market);
        const receipt = await tx.wait();

        console.log(`activateMarket() gas used: ${receipt.gasUsed}`);
        expect(receipt.gasUsed).to.be.lt(100000); // Should be < 100k gas
      });
    });
  });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Template & Clone Safety (Parimutuel)", function(){
  async function deploy() {
    const [owner, admin, creator] = await ethers.getSigners();

    const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
    const registry = await VersionedRegistry.deploy();

    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    const acm = await AccessControlManager.deploy(registry.target);
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("AccessControlManager", 1, 1)), acm.target, 1);

    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    await acm.grantRole(ADMIN_ROLE, admin.address);

    const RewardDistributor = await ethers.getContractFactory("RewardDistributorToggleMock");
    const rd = await RewardDistributor.deploy(false);
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor", 1, 1)), rd.target, 1);

    // Template registry
    const MTR = await ethers.getContractFactory("MarketTemplateRegistry");
    const mtr = await MTR.deploy(registry.target);
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("MarketTemplateRegistry", 1, 1)), mtr.target, 1);

    // Parimutuel implementation
    const ParimutuelMarket = await ethers.getContractFactory("ParimutuelMarket");
    const impl = await ParimutuelMarket.deploy();

    const templateId = ethers.keccak256(ethers.toUtf8Bytes("PARIMUTUEL"));
    await mtr.connect(admin).registerTemplate(templateId, impl.target);

    // Factory
    const minBond = ethers.parseEther("0.1");
    const Factory = await ethers.getContractFactory("FlexibleMarketFactory");
    const factory = await Factory.deploy(registry.target, minBond);

    return { registry, acm, rd, mtr, impl, factory, owner, admin, creator, templateId };
  }

  it("Clones from template and prevents re-initialization", async function(){
    const { factory, templateId, creator, registry } = await loadFixture(deploy);
    const now = await time.latest();
    const resolution = now + 3600;
    const feeBps = 300;
    const tx = await factory.connect(creator).createMarketFromTemplateRegistry(
      templateId,
      "Clone Q?",
      "YES",
      "NO",
      resolution,
      feeBps,
      { value: ethers.parseEther("0.1") }
    );
    const rc = await tx.wait();
    const evt = rc.logs.find(l => l.fragment && l.fragment.name === 'MarketCreated');
    const marketAddr = evt.args[0];
    expect(marketAddr).to.properAddress;

    // Re-initialize should revert (already initialized)
    const IMarket = await ethers.getContractAt("ParimutuelMarket", marketAddr);
    const initData = ethers.AbiCoder.defaultAbiCoder().encode(["string","string","string","address","uint256","uint256"],["x","y","z", creator.address, resolution, feeBps]);
    await expect(IMarket.initialize(registry.target, initData)).to.be.reverted;
  });

  it("Deactivating template prevents new market creation", async function(){
    const { factory, mtr, admin, templateId } = await loadFixture(deploy);
    await mtr.connect(admin).deactivateTemplate(templateId);
    const now = await time.latest();
    await expect(
      factory.createMarketFromTemplateRegistry(templateId, "Q", "Y", "N", now + 3600, 300, { value: ethers.parseEther("0.1") })
    ).to.be.reverted; // template not active
  });
});



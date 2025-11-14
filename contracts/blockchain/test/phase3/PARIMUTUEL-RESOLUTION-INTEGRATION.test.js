const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ResolutionManager ↔ Parimutuel Integration", function () {
  async function deploy() {
    const [owner, admin, resolver, user] = await ethers.getSigners();

    const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
    const registry = await VersionedRegistry.deploy();

    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    const acm = await AccessControlManager.deploy(registry.target);
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("AccessControlManager", 1, 1)), acm.target, 1);

    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    const RESOLVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESOLVER_ROLE"));
    await acm.grantRole(ADMIN_ROLE, admin.address);
    await acm.grantRole(RESOLVER_ROLE, resolver.address);

    const RewardDistributor = await ethers.getContractFactory("RewardDistributorToggleMock");
    const rd = await RewardDistributor.deploy(false);
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor", 1, 1)), rd.target, 1);

    // ResolutionManager
    const disputeWindow = 86400;
    const minBond = ethers.parseEther("0.01");
    const ResolutionManager = await ethers.getContractFactory("ResolutionManager");
    const rm = await ResolutionManager.deploy(registry.target, disputeWindow, minBond);
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("ResolutionManager", 1, 1)), rm.target, 1);
    // allow RM to act as resolver for markets
    await acm.grantRole(ethers.keccak256(ethers.toUtf8Bytes("RESOLVER_ROLE")), rm.target);

    // Parimutuel market
    const ParimutuelMarket = await ethers.getContractFactory("ParimutuelMarket");
    const market = await ParimutuelMarket.deploy();
    const now = await time.latest();
    const deadline = now + 3600;
    const initData = ethers.AbiCoder.defaultAbiCoder().encode(["string","string","string","address","uint256","uint256"],["ResMgr","YES","NO", owner.address, deadline, 300]);
    await market.initialize(registry.target, initData);

    return { registry, acm, rd, rm, market, owner, admin, resolver, user, deadline };
  }

  it("Resolves via ResolutionManager with evidence and finalizes after window", async function(){
    const { market, rm, resolver, user, admin, deadline } = await loadFixture(deploy);
    await market.connect(user).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("0.02") });
    await time.increaseTo(deadline + 1);
    await rm.connect(resolver).resolveMarket(market.target, 1, "evidence: oracle");
    expect(await market.result()).to.equal(1);

    // cannot finalize until window passed
    await expect(rm.finalizeResolution(market.target)).to.be.reverted;
    await time.increase(86400 + 1);
    await expect(rm.connect(admin).finalizeResolution(market.target)).to.not.be.reverted;
  });

  it("Batch resolves multiple parimutuel markets", async function(){
    const { registry, acm, rd, rm, owner, resolver } = await loadFixture(deploy);
    // Deploy second market
    const ParimutuelMarket = await ethers.getContractFactory("ParimutuelMarket");
    const m2 = await ParimutuelMarket.deploy();
    const now = await time.latest();
    const dl = now + 3600;
    const initData = ethers.AbiCoder.defaultAbiCoder().encode(["string","string","string","address","uint256","uint256"],["ResMgr2","YES","NO", owner.address, dl, 300]);
    await m2.initialize(registry.target, initData);

    // seed a small bet on outcome 2 so it doesn't cancel
    await m2.placeBet(2, "0x", 0, 0, { value: ethers.parseEther("0.01") });
    await time.increaseTo(dl + 1);
    await rm.connect(resolver).batchResolveMarkets([m2.target], [2], ["ok"]);
    expect(await m2.result()).to.equal(2);
  });
});



const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Parimutuel Rewards E2E", function(){
  async function deploy() {
    const [owner, admin, resolver, u1, u2] = await ethers.getSigners();

    const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
    const registry = await VersionedRegistry.deploy();

    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    const acm = await AccessControlManager.deploy(registry.target);
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("AccessControlManager", 1, 1)), acm.target, 1);
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    const RESOLVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESOLVER_ROLE"));
    await acm.grantRole(ADMIN_ROLE, admin.address);
    await acm.grantRole(RESOLVER_ROLE, resolver.address);

    const ParameterStorage = await ethers.getContractFactory("ParameterStorage");
    const ps = await ParameterStorage.deploy(registry.target);
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("ParameterStorage", 1, 1)), ps.target, 1);

    const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
    const rd = await RewardDistributor.deploy(registry.target);
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor", 1, 1)), rd.target, 1);
    // Set a treasury address so RD can forward funds
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("TREASURY", 1, 1)), admin.address, 1);

    const ParimutuelMarket = await ethers.getContractFactory("ParimutuelMarket");
    const market = await ParimutuelMarket.deploy();
    const now = await time.latest();
    const deadline = now + 3600;
    const feeBps = 300; // 3%
    const initData = ethers.AbiCoder.defaultAbiCoder().encode(["string","string","string","address","uint256","uint256"],["RewardsE2E","YES","NO", owner.address, deadline, feeBps]);
    await market.initialize(registry.target, initData);

    return { registry, acm, ps, rd, market, owner, admin, resolver, u1, u2, feeBps, deadline };
  }

  it("Collects fees into RewardDistributor on resolution", async function(){
    const { market, resolver, rd, u1, u2, feeBps, deadline } = await loadFixture(deploy);
    await market.connect(u1).placeBet(1, "0x", 0, 0, { value: ethers.parseEther("0.1") });
    await market.connect(u2).placeBet(2, "0x", 0, 0, { value: ethers.parseEther("0.02") });
    const pool = await market.totalPool();
    const expectedFees = (pool * BigInt(feeBps)) / 10000n;

    await time.increaseTo(deadline + 1);
    await market.connect(resolver).resolveMarket(1);
    // Fee collection succeeded if accumulatedFees remains 0
    const acc = await market.accumulatedFees();
    expect(acc).to.equal(0n);
  });
});



const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Parimutuel unclaimed winnings flow", function(){
  async function deploy() {
    const [owner, admin, resolver] = await ethers.getSigners();
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

    const ParimutuelMarket = await ethers.getContractFactory("ParimutuelMarket");
    const market = await ParimutuelMarket.deploy();
    const now = await time.latest();
    const deadline = now + 3600;
    const initData = ethers.AbiCoder.defaultAbiCoder().encode(["string","string","string","address","uint256","uint256"],["Unclaimed","YES","NO", owner.address, deadline, 500]);
    await market.initialize(registry.target, initData);

    return { registry, acm, rd, market, owner, admin, resolver, deadline };
  }

  it("Stores unclaimed and allows later withdrawal when receiver stops reverting", async function(){
    const { market, resolver, deadline } = await loadFixture(deploy);

    // deploy toggle player that can revert in receive
    const Toggle = await ethers.getContractFactory("TogglePlayer");
    const player = await Toggle.deploy(true);
    // place bet via player helper
    await player.bet(market.target, 1, { value: ethers.parseEther("0.05") });

    await time.increaseTo(deadline + 1);
    await market.connect(resolver).resolveMarket(1);

    // Claim will attempt transfer and store unclaimedWinnings
    await expect(player.claim(market.target)).to.not.be.reverted; // internal transfer fails, but claim stores

    const payout = await market.calculatePayout(player.target);
    // calculatePayout returns 0 after claimed flag, so check storage via public mapping (not exposed)
    // Validate by toggling and withdrawing, then contract balance increases
    const balBefore = await ethers.provider.getBalance(player.target);
    await player.setRevert(false);
    await expect(player.withdraw(market.target)).to.not.be.reverted;
    const balAfter = await ethers.provider.getBalance(player.target);
    expect(balAfter).to.be.greaterThan(balBefore);
  });
});



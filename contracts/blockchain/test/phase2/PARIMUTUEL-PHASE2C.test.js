const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PARIMUTUEL PHASE 2C: Cancellation & Stress", function () {
  async function deploy() {
    const [owner, admin, resolver, ...users] = await ethers.getSigners();

    const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
    const registry = await VersionedRegistry.deploy();

    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    const acm = await AccessControlManager.deploy(registry.target);
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("AccessControlManager", 1, 1)), acm.target, 1);

    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    const RESOLVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESOLVER_ROLE"));
    await acm.grantRole(ADMIN_ROLE, admin.address);
    await acm.grantRole(RESOLVER_ROLE, resolver.address);

    // Non-reverting RD
    const RDMock = await ethers.getContractFactory("RewardDistributorToggleMock");
    const rd = await RDMock.deploy(false);
    await registry.setContract(ethers.keccak256(ethers.toUtf8Bytes("RewardDistributor", 1, 1)), rd.target, 1);

    const ParimutuelMarket = await ethers.getContractFactory("ParimutuelMarket");
    const market = await ParimutuelMarket.deploy();
    const now = await time.latest();
    const deadline = now + 3600;
    const initData = ethers.AbiCoder.defaultAbiCoder().encode([
      "string","string","string","address","uint256","uint256"
    ],[
      "Stress Suite","YES","NO", owner.address, deadline, 500 // 5%
    ]);
    await market.initialize(registry.target, initData);

    return { registry, acm, rd, market, owner, admin, resolver, users, deadline };
  }

  it("Cancellation refunds invariant: sum of payouts == total pool", async function(){
    const { market, resolver, users, deadline } = await loadFixture(deploy);
    // Place bets only on outcome 2 (NO)
    const n = Math.min(10, users.length);
    const bettors = [];
    for (let i=0;i<n;i++) {
      const u = users[i];
      const pool = await market.totalPool();
      const max = pool === 0n ? ethers.parseEther("0.02") : (pool * 2000n) / 10000n;
      const signer = await ethers.getSigner(u.address);
      await market.connect(signer).placeBet(2, "0x", 0, 0, { value: max });
      bettors.push(signer.address);
    }
    await time.increaseTo(deadline + 1);
    // Resolve as OUTCOME1 (no one bet on it) -> CANCELLED
    await market.connect(resolver).resolveMarket(1);
    expect(await market.result()).to.equal(3);

    const pool = await market.totalPool();
    let sum = 0n;
    for (let i=0;i<bettors.length;i++) {
      sum += await market.calculatePayout(bettors[i]);
    }
    expect(sum).to.equal(pool);

    // Claim all and ensure contract drained
    for (let i=0;i<bettors.length;i++) {
      const signer = await ethers.getSigner(bettors[i]);
      await market.connect(signer).claimWinnings();
    }
    expect(await ethers.provider.getBalance(market.target)).to.equal(0);
  });

  it("Emergency withdraw after 90 days post-deadline", async function(){
    const { market, admin, resolver, deadline } = await loadFixture(deploy);
    // Normal market: both sides have bets
    await market.placeBet(1, "0x", 0, 0, { value: ethers.parseEther("0.05") });
    // 20% cap on second bet after 0.05 pool is 0.01; use 0.005
    await market.placeBet(2, "0x", 0, 0, { value: ethers.parseEther("0.005") });
    await time.increaseTo(deadline + 1);
    await market.connect(resolver).resolveMarket(1);

    // Fast-forward > 90 days
    await time.increaseTo(deadline + (90 * 24 * 60 * 60) + 10);

    // Only admin can call emergencyWithdraw
    await expect(market.emergencyWithdraw()).to.be.revertedWith("Only admin");
    await expect(market.connect(admin).emergencyWithdraw()).to.not.be.reverted;
  });

  it("Multi-claimer stress: 25 winners claim, double claim blocked, drained", async function(){
    const { market, resolver, users, deadline } = await loadFixture(deploy);
    const winners = users.slice(0, 25);
    // all winners bet on outcome 1
    for (let i=0;i<winners.length;i++) {
      const pool = await market.totalPool();
      const max = pool === 0n ? ethers.parseEther("0.02") : (pool * 2000n) / 10000n;
      await market.connect(winners[i]).placeBet(1, "0x", 0, 0, { value: max });
    }
    await time.increaseTo(deadline + 1);
    await market.connect(resolver).resolveMarket(1);

    for (let i=0;i<winners.length;i++) {
      await market.connect(winners[i]).claimWinnings();
      await expect(market.connect(winners[i]).claimWinnings()).to.be.revertedWithCustomError(market, "AlreadyClaimed");
    }
    expect(await ethers.provider.getBalance(market.target)).to.equal(0);
  });
});



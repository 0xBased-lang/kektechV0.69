const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LMSR Diagnostic", function() {
  it("Should deploy LMSRCurve and call curveName", async function() {
    const LMSRCurve = await ethers.getContractFactory("LMSRCurve");
    const lmsrCurve = await LMSRCurve.deploy();
    await lmsrCurve.waitForDeployment();

    console.log("LMSRCurve deployed at:", lmsrCurve.target);

    const name = await lmsrCurve.curveName();
    console.log("curveName():", name);

    expect(name).to.equal("LMSRCurve");
  });

  it("Should call getPrices with zero supplies", async function() {
    const LMSRCurve = await ethers.getContractFactory("LMSRCurve");
    const lmsrCurve = await LMSRCurve.deploy();
    await lmsrCurve.waitForDeployment();

    const [yesPrice, noPrice] = await lmsrCurve.getPrices(
      ethers.parseEther("1"),  // b = 1 ETH
      0,  // qYes = 0
      0   // qNo = 0
    );

    console.log("Prices with (0, 0):", yesPrice.toString(), noPrice.toString());
    expect(yesPrice + noPrice).to.be.closeTo(10000n, 10n);
  });

  it("Should call validateParams", async function() {
    const LMSRCurve = await ethers.getContractFactory("LMSRCurve");
    const lmsrCurve = await LMSRCurve.deploy();
    await lmsrCurve.waitForDeployment();

    const [valid, reason] = await lmsrCurve.validateParams(ethers.parseEther("1"));
    console.log("validateParams(1 ETH):", valid, reason);

    expect(valid).to.be.true;
  });

  it("Should call calculateCost (from _validateCurve)", async function() {
    const LMSRCurve = await ethers.getContractFactory("LMSRCurve");
    const lmsrCurve = await LMSRCurve.deploy();
    await lmsrCurve.waitForDeployment();

    const cost = await lmsrCurve.calculateCost(
      ethers.parseEther("1"),  // params (b)
      0,  // currentYes
      0,  // currentNo
      true,  // outcome (YES)
      ethers.parseEther("1")  // shares
    );

    console.log("calculateCost(1e18, 0, 0, true, 1e18):", cost.toString());
    expect(cost).to.be.gt(0);
  });

  it("Should call calculateRefund (from _validateCurve)", async function() {
    const LMSRCurve = await ethers.getContractFactory("LMSRCurve");
    const lmsrCurve = await LMSRCurve.deploy();
    await lmsrCurve.waitForDeployment();

    const refund = await lmsrCurve.calculateRefund(
      ethers.parseEther("1"),  // params (b)
      ethers.parseEther("1"),  // currentYes
      0,  // currentNo
      true,  // outcome (YES)
      ethers.parseEther("1")  // shares
    );

    console.log("calculateRefund(1e18, 1e18, 0, true, 1e18):", refund.toString());
  });
});

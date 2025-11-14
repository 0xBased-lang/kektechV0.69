const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("KektvVouchersOffers - Comprehensive Test Suite", function () {
  // Test fixture for deployment
  async function deployOffersFixture() {
    const [owner, buyer, seller, other] = await ethers.getSigners();

    // Deploy mock KEKTV Vouchers (ERC-1155)
    const MockERC1155 = await ethers.getContractFactory("MockERC1155");
    const vouchers = await MockERC1155.deploy();

    // Deploy mock TECH token (ERC-20)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const techToken = await MockERC20.deploy("Kektech Token", "TECH");

    // Deploy Offers contract
    const KektvVouchersOffers = await ethers.getContractFactory("KektvVouchersOffers");
    const minOfferValue = ethers.parseEther("1"); // 1 TECH minimum
    const offers = await KektvVouchersOffers.deploy(
      await vouchers.getAddress(),
      await techToken.getAddress(),
      minOfferValue
    );

    // Mint vouchers to seller
    const tokenId = 1; // Silver voucher
    const voucherAmount = 5;
    await vouchers.mint(seller.address, tokenId, voucherAmount);

    // Mint TECH tokens to buyer
    const techAmount = ethers.parseEther("1000");
    await techToken.mint(buyer.address, techAmount);

    // Approve offers contract to transfer vouchers
    await vouchers.connect(seller).setApprovalForAll(await offers.getAddress(), true);

    // Approve offers contract to transfer TECH tokens
    await techToken.connect(buyer).approve(await offers.getAddress(), techAmount);

    return { offers, vouchers, techToken, owner, seller, buyer, other, tokenId, voucherAmount, techAmount, minOfferValue };
  }

  describe("Deployment", function () {
    it("Should deploy with correct addresses", async function () {
      const { offers, vouchers, techToken } = await loadFixture(deployOffersFixture);

      expect(await offers.vouchersContract()).to.equal(await vouchers.getAddress());
      expect(await offers.techToken()).to.equal(await techToken.getAddress());
    });

    it("Should set the correct owner", async function () {
      const { offers, owner } = await loadFixture(deployOffersFixture);
      expect(await offers.owner()).to.equal(owner.address);
    });

    it("Should start unpaused", async function () {
      const { offers } = await loadFixture(deployOffersFixture);
      expect(await offers.paused()).to.equal(false);
    });

    it("Should set minimum offer value", async function () {
      const { offers, minOfferValue } = await loadFixture(deployOffersFixture);
      expect(await offers.minOfferValue()).to.equal(minOfferValue);
    });

    it("Should start with zero offers", async function () {
      const { offers } = await loadFixture(deployOffersFixture);
      expect(await offers.getTotalOffers()).to.equal(0); // No offers made yet
    });
  });

  describe("Making Offers", function () {
    it("Should create offer with valid parameters", async function () {
      const { offers, buyer, tokenId, voucherAmount } = await loadFixture(deployOffersFixture);

      const offerPrice = ethers.parseEther("100");

      await expect(
        offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice)
      ).to.emit(offers, "OfferMade");
    });

    it("Should lock TECH tokens in escrow", async function () {
      const { offers, techToken, buyer, tokenId, voucherAmount } = await loadFixture(deployOffersFixture);

      const offerPrice = ethers.parseEther("100");
      const buyerBalanceBefore = await techToken.balanceOf(buyer.address);

      await offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice);

      const buyerBalanceAfter = await techToken.balanceOf(buyer.address);
      const totalPrice = offerPrice * BigInt(voucherAmount);
      expect(buyerBalanceBefore - buyerBalanceAfter).to.equal(totalPrice);
    });

    it("Should return incremented offer ID", async function () {
      const { offers, buyer, tokenId, voucherAmount } = await loadFixture(deployOffersFixture);

      const offerPrice = ethers.parseEther("100");

      const offerId1 = await offers.connect(buyer).makeOffer.staticCall(tokenId, voucherAmount, offerPrice);
      await offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice);

      const offerId2 = await offers.connect(buyer).makeOffer.staticCall(tokenId, voucherAmount, offerPrice);

      expect(offerId2).to.equal(offerId1 + 1n);
    });

    it("Should revert if token ID is invalid", async function () {
      const { offers, buyer, voucherAmount } = await loadFixture(deployOffersFixture);

      const offerPrice = ethers.parseEther("100");

      await expect(
        offers.connect(buyer).makeOffer(999, voucherAmount, offerPrice)
      ).to.be.revertedWithCustomError(offers, "InvalidTokenId");
    });

    it("Should revert if amount is zero", async function () {
      const { offers, buyer, tokenId } = await loadFixture(deployOffersFixture);

      const offerPrice = ethers.parseEther("100");

      await expect(
        offers.connect(buyer).makeOffer(tokenId, 0, offerPrice)
      ).to.be.revertedWithCustomError(offers, "InvalidAmount");
    });

    it("Should revert if price is zero", async function () {
      const { offers, buyer, tokenId, voucherAmount } = await loadFixture(deployOffersFixture);

      await expect(
        offers.connect(buyer).makeOffer(tokenId, voucherAmount, 0)
      ).to.be.revertedWithCustomError(offers, "InvalidOfferPrice");
    });

    it("Should revert if total price below minimum", async function () {
      const { offers, buyer, tokenId } = await loadFixture(deployOffersFixture);

      // 0.5 TECH total (below 1 TECH minimum)
      const offerPrice = ethers.parseEther("0.5");
      const amount = 1;

      await expect(
        offers.connect(buyer).makeOffer(tokenId, amount, offerPrice)
      ).to.be.revertedWithCustomError(offers, "OfferBelowMinimum");
    });

    it("Should revert if insufficient TECH balance", async function () {
      const { offers, other, tokenId, voucherAmount } = await loadFixture(deployOffersFixture);

      const offerPrice = ethers.parseEther("100");

      await expect(
        offers.connect(other).makeOffer(tokenId, voucherAmount, offerPrice)
      ).to.be.revertedWithCustomError(offers, "InsufficientBalance");
    });

    it("Should store offer correctly", async function () {
      const { offers, buyer, tokenId, voucherAmount } = await loadFixture(deployOffersFixture);

      const offerPrice = ethers.parseEther("100");

      const offerId = await offers.connect(buyer).makeOffer.staticCall(tokenId, voucherAmount, offerPrice);
      await offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice);

      const offer = await offers.getOffer(offerId);

      expect(offer.offerer).to.equal(buyer.address);
      expect(offer.voucherOwner).to.equal(ethers.ZeroAddress); // Not accepted yet
      expect(offer.tokenId).to.equal(tokenId);
      expect(offer.amount).to.equal(voucherAmount);
      expect(offer.offerPrice).to.equal(offerPrice);
      expect(offer.active).to.equal(true);
    });
  });

  describe("Accepting Offers", function () {
    async function makeOfferFixture() {
      const fixture = await loadFixture(deployOffersFixture);
      const { offers, buyer, tokenId, voucherAmount } = fixture;

      const offerPrice = ethers.parseEther("100");

      const offerId = await offers.connect(buyer).makeOffer.staticCall(tokenId, voucherAmount, offerPrice);
      await offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice);

      return { ...fixture, offerPrice, offerId };
    }

    it("Should accept valid offer", async function () {
      const { offers, seller, offerId } = await loadFixture(makeOfferFixture);

      await expect(
        offers.connect(seller).acceptOffer(offerId)
      ).to.emit(offers, "OfferAccepted");
    });

    it("Should transfer vouchers to buyer", async function () {
      const { offers, vouchers, seller, buyer, tokenId, voucherAmount, offerId } = await loadFixture(makeOfferFixture);

      const buyerBalanceBefore = await vouchers.balanceOf(buyer.address, tokenId);

      await offers.connect(seller).acceptOffer(offerId);

      const buyerBalanceAfter = await vouchers.balanceOf(buyer.address, tokenId);
      expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(voucherAmount);
    });

    it("Should transfer TECH tokens to seller", async function () {
      const { offers, techToken, seller, offerPrice, voucherAmount, offerId } = await loadFixture(makeOfferFixture);

      const sellerBalanceBefore = await techToken.balanceOf(seller.address);

      await offers.connect(seller).acceptOffer(offerId);

      const sellerBalanceAfter = await techToken.balanceOf(seller.address);
      const totalPrice = offerPrice * BigInt(voucherAmount);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(totalPrice);
    });

    it("Should mark offer as inactive", async function () {
      const { offers, seller, offerId } = await loadFixture(makeOfferFixture);

      await offers.connect(seller).acceptOffer(offerId);

      const offer = await offers.getOffer(offerId);
      expect(offer.active).to.equal(false);
    });

    it("Should set voucher owner", async function () {
      const { offers, seller, offerId } = await loadFixture(makeOfferFixture);

      await offers.connect(seller).acceptOffer(offerId);

      const offer = await offers.getOffer(offerId);
      expect(offer.voucherOwner).to.equal(seller.address);
    });

    it("Should revert if offer not active", async function () {
      const { offers, seller, offerId } = await loadFixture(makeOfferFixture);

      await offers.connect(seller).acceptOffer(offerId);

      await expect(
        offers.connect(seller).acceptOffer(offerId)
      ).to.be.revertedWithCustomError(offers, "OfferNotActive");
    });

    it("Should revert if insufficient voucher balance", async function () {
      const { offers, other, offerId } = await loadFixture(makeOfferFixture);

      await expect(
        offers.connect(other).acceptOffer(offerId)
      ).to.be.revertedWithCustomError(offers, "InsufficientBalance");
    });

    it("Should revert if vouchers not approved", async function () {
      const { offers, vouchers, seller, tokenId, offerId } = await loadFixture(makeOfferFixture);

      // Remove approval
      await vouchers.connect(seller).setApprovalForAll(await offers.getAddress(), false);

      await expect(
        offers.connect(seller).acceptOffer(offerId)
      ).to.be.revertedWithCustomError(offers, "InsufficientAllowance");
    });
  });

  describe("Canceling Offers", function () {
    async function makeOfferFixture() {
      const fixture = await loadFixture(deployOffersFixture);
      const { offers, buyer, tokenId, voucherAmount } = fixture;

      const offerPrice = ethers.parseEther("100");

      const offerId = await offers.connect(buyer).makeOffer.staticCall(tokenId, voucherAmount, offerPrice);
      await offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice);

      return { ...fixture, offerPrice, offerId };
    }

    it("Should cancel offer by offerer", async function () {
      const { offers, buyer, offerId } = await loadFixture(makeOfferFixture);

      await expect(
        offers.connect(buyer).cancelOffer(offerId)
      ).to.emit(offers, "OfferCancelled");
    });

    it("Should refund TECH tokens to offerer", async function () {
      const { offers, techToken, buyer, offerPrice, voucherAmount, offerId } = await loadFixture(makeOfferFixture);

      const buyerBalanceBefore = await techToken.balanceOf(buyer.address);

      await offers.connect(buyer).cancelOffer(offerId);

      const buyerBalanceAfter = await techToken.balanceOf(buyer.address);
      const totalPrice = offerPrice * BigInt(voucherAmount);
      expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(totalPrice);
    });

    it("Should mark offer as inactive", async function () {
      const { offers, buyer, offerId } = await loadFixture(makeOfferFixture);

      await offers.connect(buyer).cancelOffer(offerId);

      const offer = await offers.getOffer(offerId);
      expect(offer.active).to.equal(false);
    });

    it("Should revert if not the offerer", async function () {
      const { offers, other, offerId } = await loadFixture(makeOfferFixture);

      await expect(
        offers.connect(other).cancelOffer(offerId)
      ).to.be.revertedWithCustomError(offers, "Unauthorized");
    });

    it("Should revert if offer not active", async function () {
      const { offers, buyer, offerId } = await loadFixture(makeOfferFixture);

      await offers.connect(buyer).cancelOffer(offerId);

      await expect(
        offers.connect(buyer).cancelOffer(offerId)
      ).to.be.revertedWithCustomError(offers, "OfferNotActive");
    });
  });

  describe("Rejecting Offers", function () {
    async function makeOfferFixture() {
      const fixture = await loadFixture(deployOffersFixture);
      const { offers, buyer, tokenId, voucherAmount } = fixture;

      const offerPrice = ethers.parseEther("100");

      const offerId = await offers.connect(buyer).makeOffer.staticCall(tokenId, voucherAmount, offerPrice);
      await offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice);

      return { ...fixture, offerPrice, offerId };
    }

    it("Should reject offer", async function () {
      const { offers, seller, offerId } = await loadFixture(makeOfferFixture);

      await expect(
        offers.connect(seller).rejectOffer(offerId)
      ).to.emit(offers, "OfferRejected");
    });

    it("Should refund TECH tokens on rejection", async function () {
      const { offers, techToken, buyer, seller, offerPrice, voucherAmount, offerId } = await loadFixture(makeOfferFixture);

      const buyerBalanceBefore = await techToken.balanceOf(buyer.address);

      await offers.connect(seller).rejectOffer(offerId);

      const buyerBalanceAfter = await techToken.balanceOf(buyer.address);
      const totalPrice = offerPrice * BigInt(voucherAmount);
      expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(totalPrice);
    });

    it("Should mark offer as inactive", async function () {
      const { offers, seller, offerId } = await loadFixture(makeOfferFixture);

      await offers.connect(seller).rejectOffer(offerId);

      const offer = await offers.getOffer(offerId);
      expect(offer.active).to.equal(false);
    });

    it("Should revert if offer not active", async function () {
      const { offers, seller, offerId } = await loadFixture(makeOfferFixture);

      await offers.connect(seller).rejectOffer(offerId);

      await expect(
        offers.connect(seller).rejectOffer(offerId)
      ).to.be.revertedWithCustomError(offers, "OfferNotActive");
    });
  });

  describe("Pausable", function () {
    it("Should pause contract by owner", async function () {
      const { offers, owner } = await loadFixture(deployOffersFixture);

      await offers.connect(owner).pause();
      expect(await offers.paused()).to.equal(true);
    });

    it("Should unpause contract by owner", async function () {
      const { offers, owner } = await loadFixture(deployOffersFixture);

      await offers.connect(owner).pause();
      await offers.connect(owner).unpause();
      expect(await offers.paused()).to.equal(false);
    });

    it("Should revert makeOffer when paused", async function () {
      const { offers, owner, buyer, tokenId, voucherAmount } = await loadFixture(deployOffersFixture);

      await offers.connect(owner).pause();

      const offerPrice = ethers.parseEther("100");

      await expect(
        offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice)
      ).to.be.revertedWithCustomError(offers, "EnforcedPause");
    });

    it("Should revert if non-owner tries to pause", async function () {
      const { offers, buyer } = await loadFixture(deployOffersFixture);

      await expect(
        offers.connect(buyer).pause()
      ).to.be.revertedWithCustomError(offers, "OwnableUnauthorizedAccount");
    });
  });

  describe("Getters", function () {
    it("Should get offer details", async function () {
      const { offers, buyer, tokenId, voucherAmount } = await loadFixture(deployOffersFixture);

      const offerPrice = ethers.parseEther("100");

      const offerId = await offers.connect(buyer).makeOffer.staticCall(tokenId, voucherAmount, offerPrice);
      await offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice);

      const offer = await offers.getOffer(offerId);
      expect(offer.offerer).to.equal(buyer.address);
      expect(offer.tokenId).to.equal(tokenId);
      expect(offer.amount).to.equal(voucherAmount);
      expect(offer.offerPrice).to.equal(offerPrice);
      expect(offer.active).to.equal(true);
    });

    it("Should get token offers", async function () {
      const { offers, buyer, tokenId, voucherAmount } = await loadFixture(deployOffersFixture);

      const offerPrice = ethers.parseEther("100");

      await offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice);
      await offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice);

      const tokenOffers = await offers.getTokenOffers(tokenId);
      expect(tokenOffers.length).to.equal(2);
    });

    it("Should get user offers", async function () {
      const { offers, buyer, tokenId, voucherAmount } = await loadFixture(deployOffersFixture);

      const offerPrice = ethers.parseEther("100");

      await offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice);
      await offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice);

      const userOffers = await offers.getUserOffers(buyer.address);
      expect(userOffers.length).to.equal(2);
    });

    it("Should get received offers", async function () {
      const { offers, buyer, seller, tokenId, voucherAmount } = await loadFixture(deployOffersFixture);

      const offerPrice = ethers.parseEther("100");

      const offerId = await offers.connect(buyer).makeOffer.staticCall(tokenId, voucherAmount, offerPrice);
      await offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice);

      await offers.connect(seller).acceptOffer(offerId);

      const receivedOffers = await offers.getReceivedOffers(seller.address);
      expect(receivedOffers.length).to.equal(1);
      expect(receivedOffers[0]).to.equal(offerId);
    });
  });

  describe("Admin Functions", function () {
    it("Should update minimum offer value", async function () {
      const { offers, owner } = await loadFixture(deployOffersFixture);

      const newMinimum = ethers.parseEther("50");
      await offers.connect(owner).updateMinOfferValue(newMinimum);

      expect(await offers.minOfferValue()).to.equal(newMinimum);
    });

    it("Should revert minimum offer update by non-owner", async function () {
      const { offers, buyer } = await loadFixture(deployOffersFixture);

      const newMinimum = ethers.parseEther("50");
      await expect(
        offers.connect(buyer).updateMinOfferValue(newMinimum)
      ).to.be.revertedWithCustomError(offers, "OwnableUnauthorizedAccount");
    });

    it("Should emit event on minimum value update", async function () {
      const { offers, owner } = await loadFixture(deployOffersFixture);

      const newMinimum = ethers.parseEther("50");

      await expect(
        offers.connect(owner).updateMinOfferValue(newMinimum)
      ).to.emit(offers, "MinOfferValueUpdated");
    });
  });

  describe("Edge Cases & Security", function () {
    it("Should handle multiple offers on same token", async function () {
      const { offers, buyer, other, techToken, tokenId, voucherAmount } = await loadFixture(deployOffersFixture);

      // Mint TECH to other
      await techToken.mint(other.address, ethers.parseEther("1000"));
      await techToken.connect(other).approve(await offers.getAddress(), ethers.parseEther("1000"));

      const offerPrice = ethers.parseEther("100");

      // Create multiple offers on same token
      await offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice);
      await offers.connect(other).makeOffer(tokenId, voucherAmount, offerPrice);

      const tokenOffers = await offers.getTokenOffers(tokenId);
      expect(tokenOffers.length).to.equal(2);
    });

    it("Should handle zero offers gracefully", async function () {
      const { offers, buyer } = await loadFixture(deployOffersFixture);

      const userOffers = await offers.getUserOffers(buyer.address);
      expect(userOffers.length).to.equal(0);

      const receivedOffers = await offers.getReceivedOffers(buyer.address);
      expect(receivedOffers.length).to.equal(0);
    });

    it("Should maintain correct escrow balance", async function () {
      const { offers, techToken, buyer, tokenId, voucherAmount } = await loadFixture(deployOffersFixture);

      const offerPrice = ethers.parseEther("100");
      const totalPrice = offerPrice * BigInt(voucherAmount);

      await offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice);

      const escrowBalance = await techToken.balanceOf(await offers.getAddress());
      expect(escrowBalance).to.equal(totalPrice);
    });

    it("Should clear escrow on accept", async function () {
      const { offers, techToken, buyer, seller, tokenId, voucherAmount } = await loadFixture(deployOffersFixture);

      const offerPrice = ethers.parseEther("100");

      const offerId = await offers.connect(buyer).makeOffer.staticCall(tokenId, voucherAmount, offerPrice);
      await offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice);

      await offers.connect(seller).acceptOffer(offerId);

      const escrowBalance = await techToken.balanceOf(await offers.getAddress());
      expect(escrowBalance).to.equal(0);
    });

    it("Should clear escrow on cancel", async function () {
      const { offers, techToken, buyer, tokenId, voucherAmount } = await loadFixture(deployOffersFixture);

      const offerPrice = ethers.parseEther("100");

      const offerId = await offers.connect(buyer).makeOffer.staticCall(tokenId, voucherAmount, offerPrice);
      await offers.connect(buyer).makeOffer(tokenId, voucherAmount, offerPrice);

      await offers.connect(buyer).cancelOffer(offerId);

      const escrowBalance = await techToken.balanceOf(await offers.getAddress());
      expect(escrowBalance).to.equal(0);
    });
  });
});

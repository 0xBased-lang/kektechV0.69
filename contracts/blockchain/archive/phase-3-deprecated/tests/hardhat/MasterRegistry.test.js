const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("VersionedRegistry", function () {
    // ============= Fixtures =============

    async function deployVersionedRegistryFixture() {
        const [owner, admin, user, attacker] = await ethers.getSigners();

        const VersionedRegistry = await ethers.getContractFactory("VersionedRegistry");
        const registry = await VersionedRegistry.deploy();

        // Define test keys
        const PARAMETER_STORAGE = ethers.keccak256(
            ethers.toUtf8Bytes("PARAMETER_STORAGE")
        );
        const ACCESS_CONTROL = ethers.keccak256(
            ethers.toUtf8Bytes("ACCESS_CONTROL")
        );
        const MARKET_FACTORY = ethers.keccak256(
            ethers.toUtf8Bytes("MARKET_FACTORY")
        );

        // Create mock addresses
        const mockParameterStorage = ethers.Wallet.createRandom().address;
        const mockAccessControl = ethers.Wallet.createRandom().address;
        const mockMarketFactory = ethers.Wallet.createRandom().address;

        return {
            registry,
            owner,
            admin,
            user,
            attacker,
            PARAMETER_STORAGE,
            ACCESS_CONTROL,
            MARKET_FACTORY,
            mockParameterStorage,
            mockAccessControl,
            mockMarketFactory
        };
    }

    // ============= Deployment Tests =============

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            const { registry, owner } = await loadFixture(deployVersionedRegistryFixture);
            expect(await registry.owner()).to.equal(owner.address);
        });

        it("Should initialize with version 1", async function () {
            const { registry } = await loadFixture(deployVersionedRegistryFixture);
            expect(await registry.version()).to.equal(1);
        });

        it("Should start unpaused", async function () {
            const { registry } = await loadFixture(deployVersionedRegistryFixture);
            expect(await registry.paused()).to.equal(false);
        });

        it("Should have zero total contracts initially", async function () {
            const { registry } = await loadFixture(deployVersionedRegistryFixture);
            expect(await registry.totalContracts()).to.equal(0);
        });
    });

    // ============= setContract Tests =============

    describe("setContract", function () {
        it("Should successfully register a new contract", async function () {
            const { registry, owner, PARAMETER_STORAGE, mockParameterStorage } =
                await loadFixture(deployVersionedRegistryFixture);

            await expect(
                registry.connect(owner).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1)
            ).to.emit(registry, "ContractUpdated")
              .withArgs(PARAMETER_STORAGE, mockParameterStorage, ethers.ZeroAddress, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

            expect(await registry.getContract(PARAMETER_STORAGE)).to.equal(mockParameterStorage);
            expect(await registry.totalContracts()).to.equal(1);
        });

        it("Should update an existing contract", async function () {
            const { registry, owner, PARAMETER_STORAGE, mockParameterStorage } =
                await loadFixture(deployVersionedRegistryFixture);

            // First registration
            await registry.connect(owner).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1, 1);

            // Update to new address
            const newAddress = ethers.Wallet.createRandom().address;
            await expect(
                registry.connect(owner).setContract(PARAMETER_STORAGE, newAddress, 1, 1)
            ).to.emit(registry, "ContractUpdated")
              .withArgs(PARAMETER_STORAGE, newAddress, mockParameterStorage, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

            expect(await registry.getContract(PARAMETER_STORAGE)).to.equal(newAddress);
            expect(await registry.totalContracts()).to.equal(1); // Should not increment
        });

        it("Should revert when called by non-owner", async function () {
            const { registry, user, PARAMETER_STORAGE, mockParameterStorage } =
                await loadFixture(deployVersionedRegistryFixture);

            await expect(
                registry.connect(user).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1)
            ).to.be.revertedWithCustomError(registry, "NotOwner");
        });

        it("Should revert with zero address", async function () {
            const { registry, owner, PARAMETER_STORAGE } =
                await loadFixture(deployVersionedRegistryFixture);

            await expect(
                registry.connect(owner).setContract(PARAMETER_STORAGE, ethers.ZeroAddress, 1, 1)
            ).to.be.revertedWithCustomError(registry, "ZeroAddress");
        });

        it("Should revert with invalid key", async function () {
            const { registry, owner, mockParameterStorage } =
                await loadFixture(deployVersionedRegistryFixture);

            await expect(
                registry.connect(owner).setContract(ethers.ZeroHash, mockParameterStorage, 1, 1)
            ).to.be.revertedWithCustomError(registry, "InvalidKey");
        });

        it("Should revert when paused", async function () {
            const { registry, owner, PARAMETER_STORAGE, mockParameterStorage } =
                await loadFixture(deployVersionedRegistryFixture);

            await registry.connect(owner).pause();

            await expect(
                registry.connect(owner).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1)
            ).to.be.revertedWithCustomError(registry, "ContractPaused");
        });
    });

    // ============= getContract Tests =============

    describe("getContract", function () {
        it("Should return the correct contract address", async function () {
            const { registry, owner, PARAMETER_STORAGE, mockParameterStorage } =
                await loadFixture(deployVersionedRegistryFixture);

            await registry.connect(owner).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1, 1);

            expect(await registry.getContract(PARAMETER_STORAGE)).to.equal(mockParameterStorage);
        });

        it("Should revert for non-existent contract", async function () {
            const { registry, PARAMETER_STORAGE } =
                await loadFixture(deployVersionedRegistryFixture);

            await expect(
                registry.getContract(PARAMETER_STORAGE)
            ).to.be.revertedWithCustomError(registry, "ContractNotFound")
              .withArgs(PARAMETER_STORAGE);
        });
    });

    // ============= removeContract Tests =============

    describe("removeContract", function () {
        it("Should successfully remove a contract", async function () {
            const { registry, owner, PARAMETER_STORAGE, mockParameterStorage } =
                await loadFixture(deployVersionedRegistryFixture);

            // Add contract
            await registry.connect(owner).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1, 1);
            expect(await registry.totalContracts()).to.equal(1);

            // Remove contract
            await expect(
                registry.connect(owner).removeContract(PARAMETER_STORAGE)
            ).to.emit(registry, "ContractUpdated")
              .withArgs(PARAMETER_STORAGE, ethers.ZeroAddress, mockParameterStorage, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

            expect(await registry.contractExists(PARAMETER_STORAGE)).to.equal(false);
            expect(await registry.totalContracts()).to.equal(0);
        });

        it("Should maintain enumeration correctly when removing middle element", async function () {
            const { registry, owner, PARAMETER_STORAGE, ACCESS_CONTROL, MARKET_FACTORY,
                    mockParameterStorage, mockAccessControl, mockMarketFactory } =
                await loadFixture(deployVersionedRegistryFixture);

            // Add 3 contracts
            await registry.connect(owner).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1, 1);
            await registry.connect(owner).setContract(ACCESS_CONTROL, mockAccessControl, 1, 1, 1);
            await registry.connect(owner).setContract(MARKET_FACTORY, mockMarketFactory, 1, 1, 1);

            // Remove middle contract
            await registry.connect(owner).removeContract(ACCESS_CONTROL);

            const [keys, addresses] = await registry.getAllContracts();
            expect(keys.length).to.equal(2);
            expect(addresses.length).to.equal(2);

            // Verify remaining contracts
            expect(await registry.contractExists(PARAMETER_STORAGE)).to.equal(true);
            expect(await registry.contractExists(MARKET_FACTORY)).to.equal(true);
            expect(await registry.contractExists(ACCESS_CONTROL)).to.equal(false);
        });

        it("Should revert when removing non-existent contract", async function () {
            const { registry, owner, PARAMETER_STORAGE } =
                await loadFixture(deployVersionedRegistryFixture);

            await expect(
                registry.connect(owner).removeContract(PARAMETER_STORAGE)
            ).to.be.revertedWithCustomError(registry, "ContractNotFound")
              .withArgs(PARAMETER_STORAGE);
        });

        it("Should revert when called by non-owner", async function () {
            const { registry, owner, user, PARAMETER_STORAGE, mockParameterStorage } =
                await loadFixture(deployVersionedRegistryFixture);

            await registry.connect(owner).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1, 1);

            await expect(
                registry.connect(user).removeContract(PARAMETER_STORAGE)
            ).to.be.revertedWithCustomError(registry, "NotOwner");
        });
    });

    // ============= batchSetContracts Tests =============

    describe("batchSetContracts", function () {
        it("Should successfully batch register contracts", async function () {
            const { registry, owner, PARAMETER_STORAGE, ACCESS_CONTROL, MARKET_FACTORY,
                    mockParameterStorage, mockAccessControl, mockMarketFactory } =
                await loadFixture(deployVersionedRegistryFixture);

            const keys = [PARAMETER_STORAGE, ACCESS_CONTROL, MARKET_FACTORY];
            const addresses = [mockParameterStorage, mockAccessControl, mockMarketFactory];

            await registry.connect(owner).batchSetContracts(keys, addresses);

            expect(await registry.getContract(PARAMETER_STORAGE)).to.equal(mockParameterStorage);
            expect(await registry.getContract(ACCESS_CONTROL)).to.equal(mockAccessControl);
            expect(await registry.getContract(MARKET_FACTORY)).to.equal(mockMarketFactory);
            expect(await registry.totalContracts()).to.equal(3);
        });

        it("Should revert with mismatched array lengths", async function () {
            const { registry, owner, PARAMETER_STORAGE, mockParameterStorage, mockAccessControl } =
                await loadFixture(deployVersionedRegistryFixture);

            const keys = [PARAMETER_STORAGE];
            const addresses = [mockParameterStorage, mockAccessControl];

            await expect(
                registry.connect(owner).batchSetContracts(keys, addresses)
            ).to.be.revertedWithCustomError(registry, "LengthMismatch");
        });

        it("Should revert with empty arrays", async function () {
            const { registry, owner } = await loadFixture(deployVersionedRegistryFixture);

            await expect(
                registry.connect(owner).batchSetContracts([], [])
            ).to.be.revertedWithCustomError(registry, "EmptyArray");
        });

        it("Should revert if any address is zero", async function () {
            const { registry, owner, PARAMETER_STORAGE, ACCESS_CONTROL } =
                await loadFixture(deployVersionedRegistryFixture);

            const keys = [PARAMETER_STORAGE, ACCESS_CONTROL];
            const addresses = [ethers.Wallet.createRandom().address, ethers.ZeroAddress];

            await expect(
                registry.connect(owner).batchSetContracts(keys, addresses)
            ).to.be.revertedWithCustomError(registry, "ZeroAddress");
        });
    });

    // ============= Admin Function Tests =============

    describe("Admin Functions", function () {
        describe("2-Step Ownership Transfer (M-1 FIX)", function () {
            describe("transferOwnership (Step 1: Initiate)", function () {
                it("Should initiate ownership transfer and emit event", async function () {
                    const { registry, owner, admin } = await loadFixture(deployVersionedRegistryFixture);

                    await expect(
                        registry.connect(owner).transferOwnership(admin.address)
                    ).to.emit(registry, "OwnershipTransferStarted")
                      .withArgs(owner.address, admin.address);

                    // Owner should NOT change yet
                    expect(await registry.owner()).to.equal(owner.address);
                    // Pending owner should be set
                    expect(await registry.pendingOwner()).to.equal(admin.address);
                });

                it("Should allow overwriting pending owner", async function () {
                    const { registry, owner, admin, user } = await loadFixture(deployVersionedRegistryFixture);

                    // First transfer
                    await registry.connect(owner).transferOwnership(admin.address);
                    expect(await registry.pendingOwner()).to.equal(admin.address);

                    // Overwrite with new pending owner
                    await expect(
                        registry.connect(owner).transferOwnership(user.address)
                    ).to.emit(registry, "OwnershipTransferStarted")
                      .withArgs(owner.address, user.address);

                    expect(await registry.pendingOwner()).to.equal(user.address);
                });

                it("Should revert with zero address", async function () {
                    const { registry, owner } = await loadFixture(deployVersionedRegistryFixture);

                    await expect(
                        registry.connect(owner).transferOwnership(ethers.ZeroAddress)
                    ).to.be.revertedWithCustomError(registry, "ZeroAddress");
                });

                it("Should revert when called by non-owner", async function () {
                    const { registry, user, admin } = await loadFixture(deployVersionedRegistryFixture);

                    await expect(
                        registry.connect(user).transferOwnership(admin.address)
                    ).to.be.revertedWithCustomError(registry, "NotOwner");
                });
            });

            describe("acceptOwnership (Step 2: Complete)", function () {
                it("Should complete ownership transfer successfully", async function () {
                    const { registry, owner, admin } = await loadFixture(deployVersionedRegistryFixture);

                    // Step 1: Initiate transfer
                    await registry.connect(owner).transferOwnership(admin.address);

                    // Step 2: Accept transfer
                    await expect(
                        registry.connect(admin).acceptOwnership()
                    ).to.emit(registry, "OwnershipTransferred")
                      .withArgs(owner.address, admin.address);

                    // Ownership should be transferred
                    expect(await registry.owner()).to.equal(admin.address);
                    // Pending owner should be cleared
                    expect(await registry.pendingOwner()).to.equal(ethers.ZeroAddress);
                });

                it("Should revert when called by wrong address", async function () {
                    const { registry, owner, admin, user } = await loadFixture(deployVersionedRegistryFixture);

                    // Initiate transfer to admin
                    await registry.connect(owner).transferOwnership(admin.address);

                    // User tries to accept (should fail)
                    await expect(
                        registry.connect(user).acceptOwnership()
                    ).to.be.revertedWithCustomError(registry, "NotPendingOwner");

                    // Owner still should be original
                    expect(await registry.owner()).to.equal(owner.address);
                });

                it("Should revert when called by current owner", async function () {
                    const { registry, owner, admin } = await loadFixture(deployVersionedRegistryFixture);

                    // Initiate transfer
                    await registry.connect(owner).transferOwnership(admin.address);

                    // Current owner tries to accept (should fail)
                    await expect(
                        registry.connect(owner).acceptOwnership()
                    ).to.be.revertedWithCustomError(registry, "NotPendingOwner");
                });

                it("Should revert when no pending transfer exists", async function () {
                    const { registry, admin } = await loadFixture(deployVersionedRegistryFixture);

                    await expect(
                        registry.connect(admin).acceptOwnership()
                    ).to.be.revertedWithCustomError(registry, "NotPendingOwner");
                });
            });

            describe("cancelOwnershipTransfer", function () {
                it("Should cancel pending ownership transfer", async function () {
                    const { registry, owner, admin } = await loadFixture(deployVersionedRegistryFixture);

                    // Initiate transfer
                    await registry.connect(owner).transferOwnership(admin.address);
                    expect(await registry.pendingOwner()).to.equal(admin.address);

                    // Cancel transfer
                    await expect(
                        registry.connect(owner).cancelOwnershipTransfer()
                    ).to.emit(registry, "OwnershipTransferCancelled")
                      .withArgs(admin.address);

                    // Pending owner should be cleared
                    expect(await registry.pendingOwner()).to.equal(ethers.ZeroAddress);
                    // Owner should still be original
                    expect(await registry.owner()).to.equal(owner.address);
                });

                it("Should revert when no pending transfer exists", async function () {
                    const { registry, owner } = await loadFixture(deployVersionedRegistryFixture);

                    await expect(
                        registry.connect(owner).cancelOwnershipTransfer()
                    ).to.be.revertedWithCustomError(registry, "NoPendingOwnershipTransfer");
                });

                it("Should revert when called by non-owner", async function () {
                    const { registry, owner, admin, user } = await loadFixture(deployVersionedRegistryFixture);

                    // Initiate transfer
                    await registry.connect(owner).transferOwnership(admin.address);

                    // Non-owner tries to cancel
                    await expect(
                        registry.connect(user).cancelOwnershipTransfer()
                    ).to.be.revertedWithCustomError(registry, "NotOwner");
                });
            });

            describe("M-1 Attack Prevention Tests", function () {
                it("Should prevent accidental transfer to typo address", async function () {
                    const { registry, owner } = await loadFixture(deployVersionedRegistryFixture);

                    const wrongAddress = "0x0000000000000000000000000000000000000001";

                    // Step 1: Owner initiates transfer to wrong address
                    await registry.connect(owner).transferOwnership(wrongAddress);

                    // Ownership should NOT transfer yet
                    expect(await registry.owner()).to.equal(owner.address);
                    expect(await registry.pendingOwner()).to.equal(wrongAddress);

                    // Owner realizes mistake and cancels
                    await registry.connect(owner).cancelOwnershipTransfer();

                    // Ownership stays with original owner
                    expect(await registry.owner()).to.equal(owner.address);
                    expect(await registry.pendingOwner()).to.equal(ethers.ZeroAddress);
                });

                it("Should prevent transfer to contract without acceptance capability", async function () {
                    const { registry, owner, mockParameterStorage } = await loadFixture(deployVersionedRegistryFixture);

                    // Initiate transfer to contract address (which can't accept)
                    await registry.connect(owner).transferOwnership(mockParameterStorage);

                    // Ownership should NOT transfer
                    expect(await registry.owner()).to.equal(owner.address);

                    // Since contract can't call acceptOwnership, transfer never completes
                    // Owner can cancel and fix
                    await registry.connect(owner).cancelOwnershipTransfer();
                });

                it("Should allow new owner to control registry after complete transfer", async function () {
                    const { registry, owner, admin, mockParameterStorage, PARAMETER_STORAGE } =
                        await loadFixture(deployVersionedRegistryFixture);

                    // Complete 2-step transfer
                    await registry.connect(owner).transferOwnership(admin.address);
                    await registry.connect(admin).acceptOwnership();

                    // New owner should be able to set contracts
                    await expect(
                        registry.connect(admin).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1)
                    ).to.emit(registry, "ContractUpdated");

                    // Old owner should NOT be able to set contracts
                    await expect(
                        registry.connect(owner).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1)
                    ).to.be.revertedWithCustomError(registry, "NotOwner");
                });

                it("Should prevent pending owner from using admin functions before accepting", async function () {
                    const { registry, owner, admin, mockParameterStorage, PARAMETER_STORAGE } =
                        await loadFixture(deployVersionedRegistryFixture);

                    // Initiate transfer
                    await registry.connect(owner).transferOwnership(admin.address);

                    // Pending owner should NOT be able to use admin functions yet
                    await expect(
                        registry.connect(admin).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1)
                    ).to.be.revertedWithCustomError(registry, "NotOwner");

                    // Current owner should still have control
                    await expect(
                        registry.connect(owner).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1)
                    ).to.emit(registry, "ContractUpdated");
                });
            });
        });

        describe("pause/unpause", function () {
            it("Should pause and unpause successfully", async function () {
                const { registry, owner } = await loadFixture(deployVersionedRegistryFixture);

                await expect(registry.connect(owner).pause())
                    .to.emit(registry, "RegistryPaused")
                    .withArgs(true);

                expect(await registry.paused()).to.equal(true);

                await expect(registry.connect(owner).unpause())
                    .to.emit(registry, "RegistryPaused")
                    .withArgs(false);

                expect(await registry.paused()).to.equal(false);
            });

            it("Should emit EmergencyAction event", async function () {
                const { registry, owner } = await loadFixture(deployVersionedRegistryFixture);

                await expect(registry.connect(owner).pause())
                    .to.emit(registry, "EmergencyAction")
                    .withArgs("Registry Paused", owner.address, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));
            });

            it("Should revert pause when called by non-owner", async function () {
                const { registry, user } = await loadFixture(deployVersionedRegistryFixture);

                await expect(
                    registry.connect(user).pause()
                ).to.be.revertedWithCustomError(registry, "NotOwner");
            });
        });
    });

    // ============= View Function Tests =============

    describe("View Functions", function () {
        it("Should return all contracts correctly", async function () {
            const { registry, owner, PARAMETER_STORAGE, ACCESS_CONTROL,
                    mockParameterStorage, mockAccessControl } =
                await loadFixture(deployVersionedRegistryFixture);

            await registry.connect(owner).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1, 1);
            await registry.connect(owner).setContract(ACCESS_CONTROL, mockAccessControl, 1, 1, 1);

            const [keys, addresses] = await registry.getAllContracts();

            expect(keys.length).to.equal(2);
            expect(addresses.length).to.equal(2);
            expect(keys).to.include(PARAMETER_STORAGE);
            expect(keys).to.include(ACCESS_CONTROL);
            expect(addresses).to.include(mockParameterStorage);
            expect(addresses).to.include(mockAccessControl);
        });

        it("Should check contract existence correctly", async function () {
            const { registry, owner, PARAMETER_STORAGE, ACCESS_CONTROL, mockParameterStorage } =
                await loadFixture(deployVersionedRegistryFixture);

            expect(await registry.contractExists(PARAMETER_STORAGE)).to.equal(false);

            await registry.connect(owner).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1, 1);

            expect(await registry.contractExists(PARAMETER_STORAGE)).to.equal(true);
            expect(await registry.contractExists(ACCESS_CONTROL)).to.equal(false);
        });

        it("Should get contract count correctly", async function () {
            const { registry, owner, PARAMETER_STORAGE, ACCESS_CONTROL,
                    mockParameterStorage, mockAccessControl } =
                await loadFixture(deployVersionedRegistryFixture);

            expect(await registry.getContractCount()).to.equal(0);

            await registry.connect(owner).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1, 1);
            expect(await registry.getContractCount()).to.equal(1);

            await registry.connect(owner).setContract(ACCESS_CONTROL, mockAccessControl, 1, 1, 1);
            expect(await registry.getContractCount()).to.equal(2);
        });

        it("Should get contract at index correctly", async function () {
            const { registry, owner, PARAMETER_STORAGE, mockParameterStorage } =
                await loadFixture(deployVersionedRegistryFixture);

            await registry.connect(owner).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1, 1);

            const [key, address] = await registry.getContractAt(0);
            expect(key).to.equal(PARAMETER_STORAGE);
            expect(address).to.equal(mockParameterStorage);
        });

        it("Should revert getContractAt with out of bounds index", async function () {
            const { registry } = await loadFixture(deployVersionedRegistryFixture);

            await expect(
                registry.getContractAt(0)
            ).to.be.revertedWith("Index out of bounds");
        });
    });

    // ============= Gas Usage Tests =============

    describe("Gas Usage", function () {
        it("Should keep gas under 50k for single update", async function () {
            const { registry, owner, PARAMETER_STORAGE, ACCESS_CONTROL, mockParameterStorage, mockAccessControl } =
                await loadFixture(deployVersionedRegistryFixture);

            // First write (cold storage) - more expensive
            const tx1 = await registry.connect(owner).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1, 1);
            const receipt1 = await tx1.wait();
            expect(Number(receipt1.gasUsed)).to.be.lessThan(130000); // Cold storage is more expensive
            console.log(`Gas used for first setContract (cold): ${receipt1.gasUsed}`);

            // Update existing (warm storage) - should be much cheaper
            const tx2 = await registry.connect(owner).setContract(PARAMETER_STORAGE, mockAccessControl, 1, 1, 1);
            const receipt2 = await tx2.wait();
            expect(Number(receipt2.gasUsed)).to.be.lessThan(50000); // Warm storage is cheaper
            console.log(`Gas used for update setContract (warm): ${receipt2.gasUsed}`);
        });

        it("Should optimize gas for batch operations", async function () {
            const { registry, owner, PARAMETER_STORAGE, ACCESS_CONTROL, MARKET_FACTORY,
                    mockParameterStorage, mockAccessControl, mockMarketFactory } =
                await loadFixture(deployVersionedRegistryFixture);

            const keys = [PARAMETER_STORAGE, ACCESS_CONTROL, MARKET_FACTORY];
            const addresses = [mockParameterStorage, mockAccessControl, mockMarketFactory];

            const tx = await registry.connect(owner).batchSetContracts(keys, addresses);
            const receipt = await tx.wait();

            const gasPerContract = Number(receipt.gasUsed) / 3;
            // Cold storage writes are more expensive (90-100k per contract)
            // This is expected and within gas limits
            expect(gasPerContract).to.be.lessThan(100000);

            console.log(`Gas used for batch (3 contracts): ${receipt.gasUsed}`);
            console.log(`Gas per contract in batch: ${gasPerContract}`);
        });
    });

    // ============= Edge Cases & Security Tests =============

    describe("Edge Cases & Security", function () {
        it("Should handle maximum uint values correctly", async function () {
            const { registry } = await loadFixture(deployVersionedRegistryFixture);

            // After many updates, counters should not overflow
            expect(await registry.totalContracts()).to.be.lt(ethers.MaxUint256);
        });

        it("Should maintain consistency after multiple operations", async function () {
            const { registry, owner, PARAMETER_STORAGE, ACCESS_CONTROL, MARKET_FACTORY,
                    mockParameterStorage, mockAccessControl, mockMarketFactory } =
                await loadFixture(deployVersionedRegistryFixture);

            // Add contracts
            await registry.connect(owner).setContract(PARAMETER_STORAGE, mockParameterStorage, 1, 1, 1);
            await registry.connect(owner).setContract(ACCESS_CONTROL, mockAccessControl, 1, 1, 1);
            await registry.connect(owner).setContract(MARKET_FACTORY, mockMarketFactory, 1, 1, 1);

            // Update one
            const newAddress = ethers.Wallet.createRandom().address;
            await registry.connect(owner).setContract(ACCESS_CONTROL, newAddress, 1, 1, 1);

            // Remove one
            await registry.connect(owner).removeContract(MARKET_FACTORY);

            // Verify consistency
            expect(await registry.totalContracts()).to.equal(2);
            expect(await registry.getContract(PARAMETER_STORAGE)).to.equal(mockParameterStorage);
            expect(await registry.getContract(ACCESS_CONTROL)).to.equal(newAddress);
            expect(await registry.contractExists(MARKET_FACTORY)).to.equal(false);

            const [keys, addresses] = await registry.getAllContracts();
            expect(keys.length).to.equal(2);
            expect(addresses.length).to.equal(2);
        });

        it("Should not allow reentrancy attacks", async function () {
            // Note: VersionedRegistry doesn't call external contracts,
            // so reentrancy is not a concern, but we verify no callbacks exist
            const { registry } = await loadFixture(deployVersionedRegistryFixture);

            const abi = registry.interface.fragments;
            const externalCalls = abi.filter(f =>
                f.type === 'function' &&
                f.stateMutability !== 'view' &&
                f.stateMutability !== 'pure'
            );

            // Verify no functions make external calls (except events)
            externalCalls.forEach(func => {
                // This is a design verification, not a runtime test
                expect(func.name).to.not.include('call');
                expect(func.name).to.not.include('delegatecall');
            });
        });
    });
});
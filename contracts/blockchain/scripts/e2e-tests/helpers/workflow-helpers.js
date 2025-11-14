const { ethers } = require("hardhat");

/**
 * WORKFLOW HELPERS - Correct State Machine Management
 *
 * These helpers encapsulate the proper Phase 5/6 lifecycle workflow:
 * PROPOSED → APPROVED → ACTIVE → RESOLVING → (DISPUTED?) → FINALIZED
 *
 * Use these instead of direct contract calls to ensure correct state transitions.
 */

const STATE_NAMES = [
  "PROPOSED",   // 0
  "APPROVED",   // 1
  "ACTIVE",     // 2
  "RESOLVING",  // 3
  "DISPUTED",   // 4
  "FINALIZED",  // 5
];

const CONTRACTS = {
  FACTORY: "0x169b4019Fc12c5bD43BFA5d830Fd01A678df6a15",
  ACCESS_CONTROL: "0x4d1afBb8E50e17F24dCbB4Fc3197537be646315A",
  RESOLUTION_MANAGER: "0x10daF33E321ED8977e369a36FcC6Beb3d3d106a0",
};

const GAS_LIMITS = {
  APPROVE: 150000,
  ACTIVATE: 150000,
  PROPOSE: 500000,
  FINALIZE: 500000,
  CLAIM: 300000,
  PLACE_BET_FIRST: 1100000,
  PLACE_BET_SUBSEQUENT: 950000,
};

const GAS_PRICE = ethers.parseUnits("9", "gwei");

/**
 * Get current market state with human-readable name
 * @param {Contract} market - PredictionMarket contract instance
 * @returns {Object} { state: number, name: string }
 */
async function getMarketState(market) {
  const state = await market.currentState();
  const stateNum = Number(state);
  return {
    state: stateNum,
    name: STATE_NAMES[stateNum] || `UNKNOWN(${stateNum})`,
  };
}

/**
 * Ensure market is in ACTIVE state
 * Handles PROPOSED → APPROVED → ACTIVE transitions automatically
 *
 * @param {string} marketAddress - Address of the market to activate
 * @returns {Object} { success: boolean, initialState: string, finalState: string, txHashes: string[] }
 */
async function ensureMarketActive(marketAddress) {
  console.log(`\n🔄 Ensuring market is ACTIVE: ${marketAddress}`);

  const factory = await ethers.getContractAt("FlexibleMarketFactoryUnified", CONTRACTS.FACTORY);
  const market = await ethers.getContractAt("PredictionMarket", marketAddress);

  const initial = await getMarketState(market);
  console.log(`   Initial state: ${initial.name} (${initial.state})`);

  const txHashes = [];

  try {
    // Step 1: PROPOSED → APPROVED
    if (initial.state === 0) {
      console.log("   Approving market...");
      const approveTx = await factory.adminApproveMarket(marketAddress, {
        gasLimit: GAS_LIMITS.APPROVE,
        gasPrice: GAS_PRICE,
      });
      const approveReceipt = await approveTx.wait();
      txHashes.push(approveReceipt.hash);
      console.log(`   ✅ Approved! Gas: ${approveReceipt.gasUsed.toString()}`);
    }

    // Step 2: APPROVED → ACTIVE
    const current = await getMarketState(market);
    if (current.state === 1) {
      console.log("   Activating market...");
      const activateTx = await factory.activateMarket(marketAddress, {
        gasLimit: GAS_LIMITS.ACTIVATE,
        gasPrice: GAS_PRICE,
      });
      const activateReceipt = await activateTx.wait();
      txHashes.push(activateReceipt.hash);
      console.log(`   ✅ Activated! Gas: ${activateReceipt.gasUsed.toString()}`);
    }

    // Verify final state
    const final = await getMarketState(market);
    console.log(`   Final state: ${final.name} (${final.state})`);

    if (final.state !== 2) {
      throw new Error(`Failed to activate market. Final state: ${final.name}`);
    }

    console.log("   ✅ Market is ACTIVE and ready for betting!\n");

    return {
      success: true,
      initialState: initial.name,
      finalState: final.name,
      txHashes,
    };
  } catch (error) {
    console.error(`   ❌ Activation failed: ${error.message}\n`);
    return {
      success: false,
      initialState: initial.name,
      finalState: (await getMarketState(market)).name,
      error: error.message,
      txHashes,
    };
  }
}

/**
 * Propose outcome and finalize market
 * Handles ACTIVE → RESOLVING → FINALIZED transitions
 *
 * @param {string} marketAddress - Address of the market
 * @param {number} winningOutcome - 1 or 2
 * @param {string} evidence - Resolution evidence/reasoning
 * @param {boolean} useAdminOverride - Skip dispute window (for testing)
 * @returns {Object} { success: boolean, initialState: string, finalState: string, txHashes: string[] }
 */
async function proposeAndFinalizeOutcome(marketAddress, winningOutcome, evidence = "Test resolution", useAdminOverride = true) {
  console.log(`\n🎯 Proposing and finalizing outcome for: ${marketAddress}`);
  console.log(`   Winning outcome: ${winningOutcome}`);
  console.log(`   Evidence: ${evidence}`);
  console.log(`   Admin override: ${useAdminOverride ? "Yes (skip dispute window)" : "No (natural flow)"}`);

  const resolutionManager = await ethers.getContractAt("ResolutionManager", CONTRACTS.RESOLUTION_MANAGER);
  const market = await ethers.getContractAt("PredictionMarket", marketAddress);

  const initial = await getMarketState(market);
  console.log(`   Initial state: ${initial.name} (${initial.state})`);

  const txHashes = [];

  try {
    // Verify market is ACTIVE
    if (initial.state !== 2) {
      throw new Error(`Market must be ACTIVE to propose outcome. Current: ${initial.name}`);
    }

    // Verify resolution time reached
    const resolutionTime = await market.resolutionTime();
    const now = Math.floor(Date.now() / 1000);
    if (now < Number(resolutionTime)) {
      const timeLeft = Number(resolutionTime) - now;
      throw new Error(`Resolution time not reached. ${timeLeft}s remaining.`);
    }

    // Step 1: Propose outcome (ACTIVE → RESOLVING)
    console.log("   Proposing outcome...");
    const proposeTx = await resolutionManager.proposeResolution(
      marketAddress,
      winningOutcome,
      evidence,
      {
        gasLimit: GAS_LIMITS.PROPOSE,
        gasPrice: GAS_PRICE,
      }
    );
    const proposeReceipt = await proposeTx.wait();
    txHashes.push(proposeReceipt.hash);
    console.log(`   ✅ Outcome proposed! Gas: ${proposeReceipt.gasUsed.toString()}`);

    const afterPropose = await getMarketState(market);
    console.log(`   State after propose: ${afterPropose.name} (${afterPropose.state})`);

    // Step 2: Finalize (RESOLVING → FINALIZED)
    if (useAdminOverride) {
      console.log("   Using admin override to finalize immediately...");
      const finalizeTx = await resolutionManager.adminResolveMarket(
        marketAddress,
        winningOutcome,
        "Admin approval: test finalization",
        {
          gasLimit: GAS_LIMITS.FINALIZE,
          gasPrice: GAS_PRICE,
        }
      );
      const finalizeReceipt = await finalizeTx.wait();
      txHashes.push(finalizeReceipt.hash);
      console.log(`   ✅ Market finalized! Gas: ${finalizeReceipt.gasUsed.toString()}`);
    } else {
      console.log("   Waiting for natural dispute window to pass...");
      console.log("   (In production, this would be 24-48 hours)");
      // For testing without admin override, you'd wait here or simulate community signals
    }

    // Verify final state
    const final = await getMarketState(market);
    console.log(`   Final state: ${final.name} (${final.state})`);

    if (final.state !== 5) {
      throw new Error(`Failed to finalize market. Final state: ${final.name}`);
    }

    console.log("   ✅ Market is FINALIZED and ready for claims!\n");

    return {
      success: true,
      initialState: initial.name,
      finalState: final.name,
      txHashes,
    };
  } catch (error) {
    console.error(`   ❌ Resolution failed: ${error.message}\n`);
    return {
      success: false,
      initialState: initial.name,
      finalState: (await getMarketState(market)).name,
      error: error.message,
      txHashes,
    };
  }
}

/**
 * Verify state transition is valid
 * @param {string} marketAddress - Address of the market
 * @param {number} expectedState - Expected state number (0-5)
 * @returns {Object} { valid: boolean, expected: string, actual: string }
 */
async function verifyStateTransition(marketAddress, expectedState) {
  const market = await ethers.getContractAt("PredictionMarket", marketAddress);
  const current = await getMarketState(market);

  const valid = current.state === expectedState;
  const expectedName = STATE_NAMES[expectedState] || `UNKNOWN(${expectedState})`;

  if (valid) {
    console.log(`   ✅ State verified: ${current.name} (${current.state})`);
  } else {
    console.log(`   ❌ State mismatch! Expected: ${expectedName}, Got: ${current.name}`);
  }

  return {
    valid,
    expected: expectedName,
    actual: current.name,
  };
}

/**
 * Grant required roles to test accounts
 * @param {string} accountAddress - Address to grant roles to
 * @returns {Object} { success: boolean, rolesGranted: string[], txHashes: string[] }
 */
async function grantTestRoles(accountAddress) {
  console.log(`\n🔑 Granting test roles to: ${accountAddress}`);

  const accessControl = await ethers.getContractAt("AccessControlManager", CONTRACTS.ACCESS_CONTROL);

  const RESOLVER_ROLE = ethers.id("RESOLVER_ROLE");
  const BACKEND_ROLE = ethers.id("BACKEND_ROLE");

  const txHashes = [];
  const rolesGranted = [];

  try {
    // Check if roles already granted
    const hasResolver = await accessControl.hasRole(RESOLVER_ROLE, accountAddress);
    const hasBackend = await accessControl.hasRole(BACKEND_ROLE, accountAddress);

    // Grant RESOLVER_ROLE if needed
    if (!hasResolver) {
      console.log("   Granting RESOLVER_ROLE...");
      const tx1 = await accessControl.grantRole(RESOLVER_ROLE, accountAddress, {
        gasLimit: 150000,
        gasPrice: GAS_PRICE,
      });
      const receipt1 = await tx1.wait();
      txHashes.push(receipt1.hash);
      rolesGranted.push("RESOLVER_ROLE");
      console.log(`   ✅ RESOLVER_ROLE granted! Gas: ${receipt1.gasUsed.toString()}`);
    } else {
      console.log("   ✅ RESOLVER_ROLE already granted");
    }

    // Grant BACKEND_ROLE if needed
    if (!hasBackend) {
      console.log("   Granting BACKEND_ROLE...");
      const tx2 = await accessControl.grantRole(BACKEND_ROLE, accountAddress, {
        gasLimit: 150000,
        gasPrice: GAS_PRICE,
      });
      const receipt2 = await tx2.wait();
      txHashes.push(receipt2.hash);
      rolesGranted.push("BACKEND_ROLE");
      console.log(`   ✅ BACKEND_ROLE granted! Gas: ${receipt2.gasUsed.toString()}`);
    } else {
      console.log("   ✅ BACKEND_ROLE already granted");
    }

    console.log("   ✅ All required roles granted!\n");

    return {
      success: true,
      rolesGranted,
      txHashes,
    };
  } catch (error) {
    console.error(`   ❌ Role grant failed: ${error.message}\n`);
    return {
      success: false,
      rolesGranted,
      error: error.message,
      txHashes,
    };
  }
}

/**
 * Place bet with proper gas limit detection
 * @param {string} marketAddress - Address of the market
 * @param {number} outcome - 1 or 2
 * @param {string} amount - Bet amount in BASED (e.g., "10")
 * @param {number} minOdds - Minimum expected odds (0 = no slippage protection)
 * @param {boolean} isFirstBet - Is this the first bet on the market?
 * @returns {Object} { success: boolean, txHash: string, gasUsed: string, newOdds: [bigint, bigint] }
 */
async function placeBet(marketAddress, outcome, amount, minOdds = 0, isFirstBet = false) {
  console.log(`\n💰 Placing bet on market: ${marketAddress}`);
  console.log(`   Outcome: ${outcome}`);
  console.log(`   Amount: ${amount} BASED`);
  console.log(`   Min odds: ${minOdds}`);
  console.log(`   First bet: ${isFirstBet ? "Yes (1.1M gas)" : "No (950k gas)"}`);

  const market = await ethers.getContractAt("PredictionMarket", marketAddress);

  try {
    // Verify market is ACTIVE
    const state = await getMarketState(market);
    if (state.state !== 2) {
      throw new Error(`Market must be ACTIVE to place bet. Current: ${state.name}`);
    }

    // Get odds before
    const oddsBefore = await market.getOdds();
    console.log(`   Odds before: [${oddsBefore[0].toString()}, ${oddsBefore[1].toString()}]`);

    // Place bet
    const gasLimit = isFirstBet ? GAS_LIMITS.PLACE_BET_FIRST : GAS_LIMITS.PLACE_BET_SUBSEQUENT;
    const betTx = await market.placeBet(outcome, minOdds, {
      value: ethers.parseEther(amount),
      gasLimit,
      gasPrice: GAS_PRICE,
    });

    const betReceipt = await betTx.wait();
    console.log(`   ✅ Bet placed! Gas: ${betReceipt.gasUsed.toString()}`);
    console.log(`   Tx: ${betReceipt.hash}`);

    // Get odds after
    const oddsAfter = await market.getOdds();
    console.log(`   Odds after:  [${oddsAfter[0].toString()}, ${oddsAfter[1].toString()}]`);

    // Calculate odds shift
    const shift0 = Number(oddsAfter[0]) - Number(oddsBefore[0]);
    const shift1 = Number(oddsAfter[1]) - Number(oddsBefore[1]);
    console.log(`   Odds shift: [${shift0 > 0 ? "+" : ""}${shift0}, ${shift1 > 0 ? "+" : ""}${shift1}]`);
    console.log("   ✅ Bet successful!\n");

    return {
      success: true,
      txHash: betReceipt.hash,
      gasUsed: betReceipt.gasUsed.toString(),
      newOdds: [oddsAfter[0], oddsAfter[1]],
      oddsShift: [shift0, shift1],
    };
  } catch (error) {
    console.error(`   ❌ Bet failed: ${error.message}\n`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Claim winnings with validation
 * @param {string} marketAddress - Address of the market
 * @returns {Object} { success: boolean, payout: string, txHash: string, gasUsed: string }
 */
async function claimWinnings(marketAddress) {
  console.log(`\n💎 Claiming winnings from market: ${marketAddress}`);

  const market = await ethers.getContractAt("PredictionMarket", marketAddress);
  const [signer] = await ethers.getSigners();

  try {
    // Verify market is FINALIZED
    const state = await getMarketState(market);
    if (state.state !== 5) {
      throw new Error(`Market must be FINALIZED to claim. Current: ${state.name}`);
    }

    // Check if user has a bet
    const betInfo = await market.getBetInfo(signer.address);
    if (betInfo.amount === 0n) {
      throw new Error("No bet found for this account");
    }

    console.log(`   Bet amount: ${ethers.formatEther(betInfo.amount)} BASED`);
    console.log(`   Bet outcome: ${betInfo.outcome}`);
    console.log(`   Already claimed: ${betInfo.claimed ? "Yes" : "No"}`);

    if (betInfo.claimed) {
      throw new Error("Winnings already claimed");
    }

    // Calculate expected payout
    const expectedPayout = await market.calculatePayout(signer.address);
    console.log(`   Expected payout: ${ethers.formatEther(expectedPayout)} BASED`);

    if (expectedPayout === 0n) {
      throw new Error("No payout available (likely bet on losing outcome)");
    }

    // Claim
    const claimTx = await market.claimWinnings({
      gasLimit: GAS_LIMITS.CLAIM,
      gasPrice: GAS_PRICE,
    });

    const claimReceipt = await claimTx.wait();
    console.log(`   ✅ Winnings claimed! Gas: ${claimReceipt.gasUsed.toString()}`);
    console.log(`   Tx: ${claimReceipt.hash}`);
    console.log(`   Payout: ${ethers.formatEther(expectedPayout)} BASED`);
    console.log("   ✅ Claim successful!\n");

    return {
      success: true,
      payout: ethers.formatEther(expectedPayout),
      txHash: claimReceipt.hash,
      gasUsed: claimReceipt.gasUsed.toString(),
    };
  } catch (error) {
    console.error(`   ❌ Claim failed: ${error.message}\n`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Complete market lifecycle from creation to claims
 * @param {Object} config - Market configuration
 * @param {Array<Object>} bets - Array of bet objects { outcome, amount }
 * @param {number} winningOutcome - 1 or 2
 * @param {number} resolutionTimeMinutes - Minutes until resolution (default: 5)
 * @returns {Object} { success: boolean, marketAddress: string, summary: Object }
 */
async function completeMarketLifecycle(config, bets, winningOutcome, resolutionTimeMinutes = 5) {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║           COMPLETE MARKET LIFECYCLE TEST                    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const summary = {
    steps: [],
    totalGas: 0n,
    totalCost: 0n,
  };

  try {
    // Step 1: Create market
    console.log("═══ STEP 1: CREATE MARKET ═══");
    const factory = await ethers.getContractAt("FlexibleMarketFactoryUnified", CONTRACTS.FACTORY);

    const resolutionTime = Math.floor(Date.now() / 1000) + (resolutionTimeMinutes * 60);
    const marketConfig = {
      ...config,
      resolutionTime,
      creatorBond: ethers.parseEther("10"),
      category: ethers.id("test"),
    };

    const createTx = await factory.createMarket(marketConfig, {
      value: ethers.parseEther("10"),
      gasLimit: 750000,
      gasPrice: GAS_PRICE,
    });

    const createReceipt = await createTx.wait();
    summary.totalGas += createReceipt.gasUsed;

    // Extract market address from events
    const factoryInterface = factory.interface;
    const marketCreatedEvent = createReceipt.logs
      .map((log) => {
        try {
          return factoryInterface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((event) => event && event.name === "MarketCreated");

    const marketAddress = marketCreatedEvent.args.marketAddress;
    console.log(`✅ Market created: ${marketAddress}`);
    console.log(`   Gas: ${createReceipt.gasUsed.toString()}`);
    console.log(`   Resolution in: ${resolutionTimeMinutes} minutes`);
    summary.steps.push({ step: "create", success: true, gas: createReceipt.gasUsed.toString() });

    // Step 2: Activate market
    console.log("\n═══ STEP 2: ACTIVATE MARKET ═══");
    const activateResult = await ensureMarketActive(marketAddress);
    if (!activateResult.success) throw new Error("Activation failed");
    activateResult.txHashes.forEach((hash, i) => {
      summary.steps.push({ step: `activate_${i}`, success: true, txHash: hash });
    });

    // Step 3: Place bets
    console.log("\n═══ STEP 3: PLACE BETS ═══");
    for (let i = 0; i < bets.length; i++) {
      const bet = bets[i];
      const isFirst = i === 0;
      const betResult = await placeBet(marketAddress, bet.outcome, bet.amount.toString(), 0, isFirst);
      if (!betResult.success) throw new Error(`Bet ${i + 1} failed: ${betResult.error}`);
      summary.steps.push({ step: `bet_${i + 1}`, success: true, gas: betResult.gasUsed });
      summary.totalGas += BigInt(betResult.gasUsed);
    }

    // Step 4: Wait for resolution time
    console.log("\n═══ STEP 4: WAIT FOR RESOLUTION ═══");
    const market = await ethers.getContractAt("PredictionMarket", marketAddress);
    const resTime = await market.resolutionTime();
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Number(resTime) - now;

    if (timeLeft > 0) {
      console.log(`   Waiting ${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s...`);
      await new Promise((resolve) => setTimeout(resolve, (timeLeft + 5) * 1000));
      console.log("   ✅ Resolution time reached!");
    }

    // Step 5: Propose and finalize
    console.log("\n═══ STEP 5: PROPOSE & FINALIZE OUTCOME ═══");
    const finalizeResult = await proposeAndFinalizeOutcome(marketAddress, winningOutcome, "Test outcome", true);
    if (!finalizeResult.success) throw new Error("Finalization failed");
    finalizeResult.txHashes.forEach((hash, i) => {
      summary.steps.push({ step: `finalize_${i}`, success: true, txHash: hash });
    });

    // Step 6: Claim winnings
    console.log("\n═══ STEP 6: CLAIM WINNINGS ═══");
    const claimResult = await claimWinnings(marketAddress);
    if (!claimResult.success) {
      console.log(`   ⚠️  Claim skipped: ${claimResult.error}`);
    } else {
      summary.steps.push({ step: "claim", success: true, gas: claimResult.gasUsed });
      summary.totalGas += BigInt(claimResult.gasUsed);
    }

    // Calculate total cost
    summary.totalCost = summary.totalGas * BigInt(9000000000); // 9 gwei

    console.log("\n╔══════════════════════════════════════════════════════════════╗");
    console.log("║                 LIFECYCLE TEST COMPLETE!                     ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");
    console.log(`✅ Market: ${marketAddress}`);
    console.log(`✅ Total gas: ${summary.totalGas.toString()}`);
    console.log(`✅ Total cost: ${ethers.formatEther(summary.totalCost)} BASED\n`);

    return {
      success: true,
      marketAddress,
      summary,
    };
  } catch (error) {
    console.error(`\n❌ Lifecycle test failed: ${error.message}\n`);
    return {
      success: false,
      error: error.message,
      summary,
    };
  }
}

module.exports = {
  // Core helpers
  getMarketState,
  ensureMarketActive,
  proposeAndFinalizeOutcome,
  verifyStateTransition,
  grantTestRoles,
  placeBet,
  claimWinnings,

  // Complete workflow
  completeMarketLifecycle,

  // Constants
  STATE_NAMES,
  CONTRACTS,
  GAS_LIMITS,
  GAS_PRICE,
};

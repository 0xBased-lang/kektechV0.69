/**
 * Contract Size Verification Script
 * Phase 0: Size Verification Tool
 *
 * Usage: node scripts/check-contract-size.js [ContractName]
 * Example: node scripts/check-contract-size.js FlexibleMarketFactory
 */

const fs = require('fs');
const path = require('path');

function checkContractSize(contractName) {
    const artifactPath = path.join(
        __dirname,
        '../artifacts/contracts/core/',
        `${contractName}.sol`,
        `${contractName}.json`
    );

    // Check if artifact exists
    if (!fs.existsSync(artifactPath)) {
        console.error(`❌ ERROR: Artifact not found at ${artifactPath}`);
        console.error('');
        console.error('Please compile contracts first:');
        console.error('  npx hardhat compile');
        process.exit(1);
    }

    // Read artifact
    let artifact;
    try {
        artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    } catch (e) {
        console.error(`❌ ERROR: Failed to parse artifact: ${e.message}`);
        process.exit(1);
    }

    // Get bytecode
    const bytecode = artifact.deployedBytecode;
    if (!bytecode || bytecode === '0x' || bytecode.length <= 2) {
        console.error(`❌ ERROR: No bytecode found in artifact`);
        console.error('Contract may not have been compiled correctly.');
        process.exit(1);
    }

    // Calculate sizes
    const sizeInBytes = (bytecode.length - 2) / 2;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    const limitInBytes = 24576; // 24KB
    const limitInKB = 24.00;
    const remaining = limitInBytes - sizeInBytes;
    const remainingKB = (remaining / 1024).toFixed(2);
    const bufferPct = ((remaining / limitInBytes) * 100).toFixed(1);

    // Output
    console.log('📊 CONTRACT SIZE VERIFICATION');
    console.log('='.repeat(60));
    console.log('');
    console.log(`Contract: ${contractName}`);
    console.log(`Bytecode size: ${sizeInBytes} bytes (${sizeInKB} KB)`);
    console.log(`24KB limit: ${limitInBytes} bytes (${limitInKB} KB)`);
    console.log(`Remaining: ${remaining} bytes (${remainingKB} KB)`);
    console.log('');

    // Status
    if (sizeInBytes < limitInBytes) {
        console.log(`Status: ✅ UNDER LIMIT (${bufferPct}% buffer remaining)`);
        console.log('');
        console.log('='.repeat(60));
        console.log('✅ GO DECISION: Contract size verification PASSED');
        console.log('');

        // Buffer warnings
        if (remaining < 500) {
            console.log('⚠️  WARNING: Buffer < 500 bytes - very tight!');
            console.log('   Consider extracting logic to libraries.');
        } else if (remaining < 1500) {
            console.log('⚠️  CAUTION: Buffer < 1.5KB - limited room for changes.');
            console.log('   Plan library extraction for future features.');
        } else {
            console.log('✅ GOOD: Sufficient buffer for minor changes.');
        }

        process.exit(0);
    } else {
        const excess = sizeInBytes - limitInBytes;
        const excessKB = (excess / 1024).toFixed(2);
        console.log(`Status: ❌ EXCEEDS LIMIT by ${excess} bytes (${excessKB} KB)`);
        console.log('');
        console.log('='.repeat(60));
        console.log('❌ NO-GO DECISION: Contract size verification FAILED');
        console.log('');
        console.log('ACTION REQUIRED: Extract logic to internal libraries');
        console.log('Refer to: docs/migration/PHASE_0_SIZE_VERIFICATION.md (Section 2.4)');
        console.log('');

        // Suggestions
        console.log('Suggested Extractions:');
        console.log('1. createMarketWithCurve → CurveMarketLogic (~1KB savings)');
        console.log('2. createMarketWithTemplate → TemplateMarketLogic (~1KB savings)');
        console.log('3. Approval validation → ApprovalLogic (~500 bytes savings)');
        console.log('');
        console.log(`Estimated new size after extraction: ~${sizeInBytes - 2500} bytes`);

        process.exit(1);
    }
}

// Main execution
const contractName = process.argv[2] || 'FlexibleMarketFactory';
checkContractSize(contractName);

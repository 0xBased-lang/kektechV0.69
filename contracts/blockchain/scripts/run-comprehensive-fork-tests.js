const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * @title Comprehensive Fork Testing Orchestrator
 * @notice Runs complete test suite on BasedAI fork
 */

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    red: "\x1b[31m",
    bright: "\x1b[1m"
};

async function runCommand(command, description) {
    console.log(`${colors.yellow}▶ ${description}...${colors.reset}`);
    try {
        const { stdout, stderr } = await execPromise(command);
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        console.log(`${colors.green}✅ ${description} completed${colors.reset}\n`);
        return { success: true, stdout, stderr };
    } catch (error) {
        console.error(`${colors.red}❌ ${description} failed${colors.reset}`);
        console.error(error.message);
        return { success: false, error };
    }
}

async function main() {
    console.log(`${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════════════╗
║   KEKTECH 3.0 - Comprehensive Fork Testing          ║
║   Complete Feature Validation on BasedAI Fork       ║
╚══════════════════════════════════════════════════════╝
${colors.reset}\n`);

    const testSuite = [
        {
            name: "Market Creation & Lifecycle",
            command: "npx hardhat test test/fork/comprehensive-market-test.js --network forkedBasedAI",
            critical: true
        },
        {
            name: "Access Control & Roles",
            command: "npx hardhat test test/unit/AccessControlManager.test.js --network forkedBasedAI",
            critical: true
        },
        {
            name: "Parameter Storage",
            command: "npx hardhat test test/unit/ParameterStorage.test.js --network forkedBasedAI",
            critical: false
        },
        {
            name: "Gas Usage Analysis",
            command: "REPORT_GAS=true npx hardhat test test/fork/comprehensive-market-test.js --network forkedBasedAI",
            critical: false
        }
    ];

    const results = {
        total: testSuite.length,
        passed: 0,
        failed: 0,
        skipped: 0,
        tests: []
    };

    console.log(`${colors.magenta}📋 Test Suite: ${testSuite.length} test categories${colors.reset}\n`);

    for (const test of testSuite) {
        console.log(`${colors.cyan}${colors.bright}═══ ${test.name} ═══${colors.reset}\n`);

        const result = await runCommand(test.command, test.name);

        results.tests.push({
            name: test.name,
            success: result.success,
            critical: test.critical
        });

        if (result.success) {
            results.passed++;
        } else {
            results.failed++;
            if (test.critical) {
                console.log(`${colors.red}${colors.bright}⚠️  CRITICAL TEST FAILED - Stopping execution${colors.reset}\n`);
                break;
            }
        }

        // Pause between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Generate summary
    console.log(`${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════════════╗
║              TEST SUMMARY                            ║
╚══════════════════════════════════════════════════════╝
${colors.reset}\n`);

    console.log(`${colors.cyan}📊 Results:${colors.reset}`);
    console.log(`   Total Tests: ${results.total}`);
    console.log(`   ${colors.green}Passed: ${results.passed}${colors.reset}`);
    console.log(`   ${colors.red}Failed: ${results.failed}${colors.reset}`);
    console.log(`   ${colors.yellow}Skipped: ${results.skipped}${colors.reset}`);
    console.log('');

    const successRate = ((results.passed / results.total) * 100).toFixed(1);
    console.log(`   Success Rate: ${successRate}%\n`);

    // Detailed results
    console.log(`${colors.cyan}📋 Detailed Results:${colors.reset}\n`);
    results.tests.forEach((test, index) => {
        const icon = test.success ? '✅' : '❌';
        const critical = test.critical ? '[CRITICAL]' : '';
        console.log(`   ${icon} ${index + 1}. ${test.name} ${critical}`);
    });
    console.log('');

    if (results.failed === 0) {
        console.log(`${colors.green}${colors.bright}🎉 ALL TESTS PASSED! 🎉${colors.reset}\n`);
        console.log(`${colors.green}Your KEKTECH 3.0 platform is fully operational on BasedAI fork!${colors.reset}\n`);
    } else {
        console.log(`${colors.yellow}⚠️  Some tests failed. Please review the output above.${colors.reset}\n`);
    }

    process.exit(results.failed > 0 ? 1 : 0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

const fs = require('fs');

function getContractSize(jsonPath, contractName) {
    try {
        const contract = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const bytecode = contract.deployedBytecode.replace('0x', '');
        const bytes = bytecode.length / 2;
        const kb = (bytes / 1024).toFixed(2);
        const underLimit = bytes < 24576;
        const margin = ((24 - parseFloat(kb)) / 24 * 100).toFixed(1);

        console.log(`${contractName}:`);
        console.log(`  Size: ${kb} KB (${bytes} bytes)`);
        console.log(`  Under 24KB: ${underLimit ? '✅ YES' : '❌ NO'}`);
        console.log(`  Margin: ${margin}%\n`);

        return { bytes, kb: parseFloat(kb), underLimit };
    } catch (error) {
        console.log(`${contractName}: Error reading - ${error.message}\n`);
        return null;
    }
}

console.log('=== CONFIG B RESULTS (runs: 50, viaIR: true) ===\n');

const corePath = './artifacts/contracts/core/FlexibleMarketFactoryCore.sol/FlexibleMarketFactoryCore.json';
const extPath = './artifacts/contracts/core/FlexibleMarketFactoryExtensions.sol/FlexibleMarketFactoryExtensions.json';

const coreSize = getContractSize(corePath, 'FlexibleMarketFactoryCore');
const extSize = getContractSize(extPath, 'FlexibleMarketFactoryExtensions');

if (coreSize && extSize) {
    console.log(`Total Combined: ${(coreSize.kb + extSize.kb).toFixed(2)} KB`);
    console.log(`Both under 24KB: ${(coreSize.underLimit && extSize.underLimit) ? '✅ YES' : '❌ NO'}`);
}

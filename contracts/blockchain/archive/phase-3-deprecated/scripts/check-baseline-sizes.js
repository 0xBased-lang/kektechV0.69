const fs = require('fs');
const path = require('path');

function getSize(contractName) {
  try {
    const artifactPath = path.join('artifacts', 'contracts', 'core', `${contractName}.sol`, `${contractName}.json`);
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const bytecode = artifact.deployedBytecode || '0x';
    if (bytecode === '0x' || bytecode.length <= 2) {
      return { name: contractName, error: 'No bytecode found' };
    }
    const sizeInBytes = (bytecode.length - 2) / 2;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    const limit = 24576;
    const remaining = limit - sizeInBytes;
    const status = sizeInBytes < limit ? '✅ UNDER' : '❌ EXCEEDS';
    return { name: contractName, bytes: sizeInBytes, kb: sizeInKB, remaining, status };
  } catch (e) {
    return { name: contractName, error: e.message.substring(0, 50) };
  }
}

const contracts = [
  'FlexibleMarketFactory',
  'FlexibleMarketFactoryCore',
  'FlexibleMarketFactoryExtensions'
];

console.log('📊 PHASE 0: BASELINE FACTORY BYTECODE SIZES');
console.log('='.repeat(80));
console.log('');

let coreBytes = 0;
let extBytes = 0;
let oldUnifiedBytes = 0;

contracts.forEach(contract => {
  const size = getSize(contract);
  if (size.error) {
    console.log(`${contract}:`);
    console.log(`  ERROR: ${size.error}`);
    console.log('');
  } else {
    console.log(`${contract}:`);
    console.log(`  Bytecode size: ${size.bytes} bytes (${size.kb} KB)`);
    console.log(`  24KB limit: 24,576 bytes (24.00 KB)`);
    console.log(`  Remaining: ${size.remaining} bytes (${(size.remaining/1024).toFixed(2)} KB)`);
    console.log(`  Status: ${size.status}`);
    console.log('');

    if (contract === 'FlexibleMarketFactoryCore') coreBytes = size.bytes;
    if (contract === 'FlexibleMarketFactoryExtensions') extBytes = size.bytes;
    if (contract === 'FlexibleMarketFactory') oldUnifiedBytes = size.bytes;
  }
});

console.log('='.repeat(80));
console.log('ANALYSIS:');
console.log('');
console.log(`Old Unified (946 lines):  ${oldUnifiedBytes} bytes (${(oldUnifiedBytes/1024).toFixed(2)} KB)`);
console.log(`Current Split:`);
console.log(`  Core (547 lines):       ${coreBytes} bytes (${(coreBytes/1024).toFixed(2)} KB)`);
console.log(`  Extensions (356 lines): ${extBytes} bytes (${(extBytes/1024).toFixed(2)} KB)`);
console.log(`  Combined:               ${coreBytes + extBytes} bytes (${((coreBytes + extBytes)/1024).toFixed(2)} KB)`);
console.log('');
if (oldUnifiedBytes > 24576) {
  console.log(`The old unified EXCEEDED 24KB limit by: ${oldUnifiedBytes - 24576} bytes`);
  console.log(`This is why it was split into Core + Extensions.`);
} else {
  console.log(`The old unified was UNDER 24KB limit.`);
}
console.log('');
console.log('='.repeat(80));
console.log('PHASE 0 OBJECTIVE:');
console.log('Create NEW unified factory with:');
console.log('- Internal libraries (CurveMarketLogic, TemplateMarketLogic)');
console.log('- NEW approval system (+100-150 lines)');
console.log('- Target: <24KB (ideally <23KB for buffer)');
console.log('');

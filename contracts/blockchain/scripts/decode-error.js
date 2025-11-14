const { ethers } = require("hardhat");

async function main() {
    const errorData = "0xdccef96400000000000000000000000025fd72154857bd204345808a690d51a61a81eb0b";
    const errorSelector = errorData.slice(0, 10);
    
    console.log("Error data:", errorData);
    console.log("Error selector:", errorSelector);
    console.log("");
    
    // Common error selectors
    const errors = {
        "0x82b42900": "Unauthorized()",
        "0xb17bfb59": "MarketNotFound(address)",
        "0x61997ae5": "MarketAlreadyApproved(address)",
        "0xb1f1a672": "MarketAlreadyRejected(address)",
        "0xdccef964": "NotAuthorized(address)", // This is it!
    };
    
    if (errors[errorSelector]) {
        console.log("Decoded error:", errors[errorSelector]);
    } else {
        console.log("Unknown error selector");
    }
    
    // Decode parameter
    const paramData = "0x" + errorData.slice(10);
    console.log("Parameter data:", paramData);
    const decodedAddr = ethers.AbiCoder.defaultAbiCoder().decode(["address"], paramData)[0];
    console.log("Decoded address:", decodedAddr);
}

main().catch(console.error);

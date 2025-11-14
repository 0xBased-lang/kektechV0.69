const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const PARTIAL_STATE_FILE = path.join(__dirname, "../../sepolia-deployment-unified.json");
let state = JSON.parse(fs.readFileSync(PARTIAL_STATE_FILE, "utf8"));

const CONFIG = {
    SAVE_FILE: PARTIAL_STATE_FILE,
    MIN_CREATOR_BOND: ethers.parseEther("0.1"),
    CONFIRMATIONS: 2,
    DELAY_BETWEEN_TXS: 30000
};

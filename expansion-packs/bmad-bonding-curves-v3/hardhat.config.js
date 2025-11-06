require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable for stack too deep resolution
    },
  },

  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: false,
    },

    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    basedai_testnet: {
      url: process.env.BASEDAI_TESTNET_RPC || "https://testnet-rpc.based.ai",
      accounts: process.env.PRIVATE_KEY_TESTNET
        ? [process.env.PRIVATE_KEY_TESTNET]
        : [],
      chainId: 32324,
    },

    basedai_mainnet: {
      url: process.env.BASEDAI_MAINNET_RPC || "https://rpc.based.ai",
      accounts: process.env.PRIVATE_KEY_MAINNET
        ? [process.env.PRIVATE_KEY_MAINNET]
        : [],
      chainId: 32323,
    },
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  mocha: {
    timeout: 40000,
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    // outputFile: "gas-report.txt", // Comment out to show in console
    noColors: false,
    showTimeSpent: true,
  },
};

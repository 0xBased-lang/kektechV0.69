import "@nomicfoundation/hardhat-toolbox";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
            optimizerSteps: "dhfoDgvulfnTUtnIf"
          }
        }
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        // Optional: Fork BasedAI mainnet for testing
        // url: "https://mainnet.basedaibridge.com/rpc",
        // enabled: false
      }
    },
    basedai: {
      url: "https://mainnet.basedaibridge.com/rpc",
      chainId: 32323,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 9000000000, // 9 gwei
      timeout: 120000 // 2 minutes
    }
  },
  etherscan: {
    apiKey: {
      basedai: "no-api-key-needed"
    },
    customChains: [
      {
        network: "basedai",
        chainId: 32323,
        urls: {
          apiURL: "https://explorer.bf1337.org/api",
          browserURL: "https://explorer.bf1337.org"
        }
      }
    ]
  },
  paths: {
    sources: "./",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 60000 // 1 minute per test
  }
};

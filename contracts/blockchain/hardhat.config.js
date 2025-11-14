require("@nomicfoundation/hardhat-toolbox");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 50,  // PRODUCTION CONFIG B (Day 10.5): Optimal balance of size + verification + gas
                // ✅ 100% Etherscan verification achieved
                // ✅ 23% smaller contracts than runs=1
                // ✅ 30% safety margins (vs 9% with runs=1)
                // ✅ Better gas efficiency
                // NOTE: NO custom YUL details - ensures Etherscan compatibility
            },
            viaIR: true // Required to avoid stack too deep compilation errors
        }
    },

    networks: {
        hardhat: {
            chainId: 31337,
            // Use legacy transactions (no EIP-1559) to avoid baseFee issues in tests
            hardfork: "berlin",  // Pre-EIP-1559 for stable testing
            allowUnlimitedContractSize: true,  // Allow large contracts
            accounts: {
                count: 10,
                accountsBalance: "10000000000000000000000" // 10,000 ETH per account
            }
        },

        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337
        },

        // NEW: Ethereum Sepolia for cheap public testing
        sepolia: {
            url: process.env.SEPOLIA_RPC || "https://rpc.sepolia.org",
            chainId: 11155111,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            // 🔥 EXTREME GAS PRICES - Testnet is free, so max out gas to ensure success!
            maxFeePerGas: 1000000000000, // 1000 gwei max (EXTREME!)
            maxPriorityFeePerGas: 50000000000, // 50 gwei priority (EXTREME!)
            timeout: 600000, // 10 minutes timeout
            tags: ["testnet", "public", "extreme-gas"]
        },

        // NEW: Forked BasedAI for realistic mainnet simulation
        forkedBasedAI: {
            url: "http://127.0.0.1:8545",
            chainId: 31337,  // Hardhat fork uses 31337
            allowUnlimitedContractSize: true,  // Allow large contracts on fork
            tags: ["fork", "local", "mainnet-simulation"]
        },

        basedai_testnet: {
            url: process.env.BASEDAI_TESTNET_RPC || "https://testnet-rpc.basedai.io",
            chainId: 32324, // BasedAI Testnet Chain ID
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: "auto",
            gasMultiplier: 1.2,
            timeout: 60000,
            tags: ["testnet", "basedai"]
        },

        basedai_mainnet: {
            url: process.env.BASEDAI_MAINNET_RPC || "https://mainnet.basedaibridge.com/rpc/",
            chainId: 32323, // BasedAI Mainnet Chain ID
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: "auto",
            gasMultiplier: 1.1,
            timeout: 60000,
            tags: ["mainnet", "production", "basedai"]
        }
    },

    gasReporter: {
        enabled: process.env.REPORT_GAS === "true",
        currency: "USD",
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
        token: "BASED",
        gasPriceApi: process.env.BASEDAI_GAS_API || "https://api.basedai.io/gas",
        showTimeSpent: true,
        showMethodSig: true,
        maxMethodDiff: 10,
        remoteContracts: []
    },

    contractSizer: {
        alphaSort: true,
        disambiguatePaths: false,
        runOnCompile: true,
        strict: true,
        only: [':Master', ':Parameter', ':Access', ':Market', ':Proposal', ':Resolution', ':Reward']
    },

    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY || "YOUR_ETHERSCAN_API_KEY", // V2 format - single API key
        customChains: [
            {
                network: "basedai",
                chainId: 32323,
                urls: {
                    apiURL: "https://explorer.basedai.io/api",
                    browserURL: "https://explorer.basedai.io"
                }
            },
            {
                network: "basedai_testnet",
                chainId: 32324,
                urls: {
                    apiURL: "https://testnet-explorer.basedai.io/api",
                    browserURL: "https://testnet-explorer.basedai.io"
                }
            }
        ]
    },

    paths: {
        sources: "./contracts",
        tests: "./test/hardhat",
        cache: "./cache",
        artifacts: "./artifacts",
        deploy: "./scripts/deploy"
    },

    mocha: {
        timeout: 60000,
        reporter: "spec",
        reporterOptions: {
            mochaFile: "./test-results.xml"
        }
    },

    defender: {
        apiKey: process.env.DEFENDER_API_KEY,
        apiSecret: process.env.DEFENDER_API_SECRET
    },

    // Custom KEKTECH Configuration
    kektech: {
        targetGasLimits: {
            placeBet: 100000,
            createMarket: 200000,
            resolveMarket: 150000,
            claimWinnings: 80000,
            updateParameter: 50000
        },

        testnetDeployerAddress: process.env.TESTNET_DEPLOYER || "0x0000000000000000000000000000000000000000",
        mainnetMultisig: process.env.MAINNET_MULTISIG || "0x0000000000000000000000000000000000000000",

        moduleKeys: {
            PARAMETER_STORAGE: "0x" + Buffer.from("PARAMETER_STORAGE").toString('hex').padEnd(64, '0'),
            ACCESS_CONTROL: "0x" + Buffer.from("ACCESS_CONTROL").toString('hex').padEnd(64, '0'),
            MARKET_FACTORY: "0x" + Buffer.from("MARKET_FACTORY").toString('hex').padEnd(64, '0'),
            PROPOSAL_MANAGER: "0x" + Buffer.from("PROPOSAL_MANAGER").toString('hex').padEnd(64, '0'),
            RESOLUTION_MANAGER: "0x" + Buffer.from("RESOLUTION_MANAGER").toString('hex').padEnd(64, '0'),
            REWARD_DISTRIBUTOR: "0x" + Buffer.from("REWARD_DISTRIBUTOR").toString('hex').padEnd(64, '0'),
            TREASURY: "0x" + Buffer.from("TREASURY").toString('hex').padEnd(64, '0')
        },

        defaultParameters: {
            protocolFeeBps: 250,      // 2.5%
            creatorFeeBps: 150,       // 1.5%
            stakerIncentiveBps: 50,   // 0.5%
            treasuryFeeBps: 50,       // 0.5%
            resolutionWindow: 172800, // 48 hours
            creatorBondAmount: "1000000000000000000", // 1 BASED
            minBondAmount: "100000000000000000",      // 0.1 BASED
            marketCreationActive: true,
            experimentalMarketsActive: false,
            emergencyPause: false
        }
    }
};
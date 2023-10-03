/* eslint-disable import/no-extraneous-dependencies */
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-upgradable";
import "@nomicfoundation/hardhat-chai-matchers";
// import "@nomicfoundation/hardhat-verify";
import "@matterlabs/hardhat-zksync-verify";
import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import "dotenv/config";
import "hardhat-gas-reporter";
import { HardhatUserConfig } from "hardhat/config";
import "solidity-docgen";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  zksolc: {
    version: "1.3.14",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    ethereum: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_ID}`,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_ID}`,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    bsc: {
      url: `https://bsc-dataseed1.binance.org`,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    bsctest: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545`,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    polygon: {
      url: `https://polygon-rpc.com`,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    mumbai: {
      url: `https://matic-mumbai.chainstacklabs.com`,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    gnosis: {
      url: `https://rpc.gnosischain.com`,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    arbitrum: {
      url: "https://arbitrum.blockpi.network/v1/rpc/public",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    base: {
      url: "https://base-mainnet.public.blastapi.io",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    optimism: {
      url: "https://optimism-mainnet.public.blastapi.io",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    zksync: {
      url: "https://mainnet.era.zksync.io",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      ethNetwork: `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      verifyURL: "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
      zksync: true
    }
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    showTimeSpent: true
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  docgen: { pages: "files", outputDir: "./docs/contracts", templates: "./docs/templates" }
};

export default config;

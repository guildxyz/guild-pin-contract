import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-upgradable";
import "@nomicfoundation/hardhat-chai-matchers";
import "@matterlabs/hardhat-zksync-verify";
import "@nomicfoundation/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import "@xyrusworx/hardhat-solidity-json";
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
    version: "1.5.7" // Newer versions fail from https://github.com/matter-labs/zksolc-bin
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
      url: `https://polygon-mumbai-pokt.nodies.app`,
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
      url: "https://optimism.llamarpc.com",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    zksync: {
      url: "https://mainnet.era.zksync.io",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      ethNetwork: "ethereum",
      verifyURL: "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
      zksync: true
    },
    cronos: {
      url: "https://cronos.drpc.org",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    mantle: {
      url: "https://rpc.mantle.xyz",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    ontology: {
      url: "https://dappnode2.ont.io:10339",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    linea: {
      url: "https://linea.decubate.com",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    cyber: {
      url: "https://cyber.alt.technology",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    taiko: {
      url: "https://taiko.blockpi.network/v1/rpc/public",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    blast: {
      url: "https://blast.blockpi.network/v1/rpc/public",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    xlayer: {
      url: "https://rpc.xlayer.tech",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    coredao: {
      url: "https://core.public.infstones.com",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    metis: {
      url: "https://metis-pokt.nodies.app",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    neon: {
      url: "https://neon-proxy-mainnet.solana.p2p.org",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    polygonzk: {
      url: "https://zkevm-rpc.com",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    scroll: {
      url: "https://rpc.scroll.io",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    zeta: {
      url: "https://zetachain-evm.blockpi.network/v1/rpc/public",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    mint: {
      url: "https://rpc.mintchain.io",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    mode: {
      url: "https://mode.drpc.org",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    avalanche: {
      url: "https://avax.meowrpc.com",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    lisk: {
      url: "https://rpc.api.lisk.com",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    form: {
      url: "https://rpc.form.network/http",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    ink: {
      url: "https://rpc-gel.inkonchain.com",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    iota: {
      url: "https://json-rpc.evm.iotaledger.net",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    sonic: {
      url: "https://rpc.soniclabs.com/",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      zksync: false
    },
    zero: {
      url: "https://rpc.zerion.io/v1/zero",
      ethNetwork: "mainnet",
      verifyURL: "https://explorer-api.zero.network/verification/contract_verification",
      zksync: true
    }
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    showTimeSpent: true
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      bsc: process.env.BSCSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      gnosis: process.env.GNOSISSCAN_API_KEY || "",
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
      base: process.env.BASESCAN_API_KEY || "",
      optimisticEthereum: process.env.OPTIMISTICSCAN_API_KEY || "",
      cronos: process.env.CRONOSCAN_API_KEY || "",
      mantle: process.env.MANTLESCAN_API_KEY || "",
      // ontology: "", // no etherscan
      linea: process.env.LINEASCAN_API_KEY || "",
      // cyber: "", // no etherscan
      taiko: process.env.TAIKOSCAN_API_KEY || "",
      blast: process.env.BLASTSCAN_API_KEY || "",
      xlayer: process.env.OKLINK_API_KEY || "",
      coredao: process.env.COREDAOSCAN_API_KEY || "",
      metis: "metis",
      neon: "neon",
      polygonZkEVM: process.env.ZKEVM_POLYGONSCAN_API_KEY || "",
      scroll: process.env.SCROLLSCAN_API_KEY || "",
      // zeta: "", // no etherscan
      // mint: "", // no etherscan
      mode: "mode",
      avalanche: "avalanche",
      lisk: "lisk",
      form: "form",
      ink: "ink",
      iota: "iota",
      sonic: process.env.SONICSCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "cronos",
        chainId: 25,
        urls: { apiURL: "https://api.cronoscan.com/api", browserURL: "https://cronoscan.com" }
      },
      {
        network: "mantle",
        chainId: 5000,
        urls: { apiURL: "https://api.mantlescan.xyz/api", browserURL: "https://mantlescan.xyz" }
      },
      {
        network: "linea",
        chainId: 59144,
        urls: { apiURL: "https://api.lineascan.build/api", browserURL: "https://lineascan.build" }
      },
      {
        network: "taiko",
        chainId: 167000,
        urls: { apiURL: "https://api.taikoscan.io/api", browserURL: "https://taikoscan.io" }
      },
      {
        network: "blast",
        chainId: 81457,
        urls: { apiURL: "https://api.blastscan.io/api", browserURL: "https://blastscan.io" }
      },
      {
        network: "xlayer",
        chainId: 196,
        urls: {
          apiURL: "https://www.oklink.com/api/v5/explorer/contract/verify-source-code-plugin/XLAYER",
          browserURL: "https://oklink.con"
        }
      },
      {
        network: "coredao",
        chainId: 1116,
        urls: { apiURL: "https://openapi.coredao.org/api", browserURL: "https://scan.coredao.org" }
      },
      {
        network: "metis",
        chainId: 1088,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/mainnet/evm/1088/etherscan",
          browserURL: "https://explorer.metis.io"
        }
      },
      {
        network: "neon",
        chainId: 245022934,
        urls: {
          apiURL: "https://api.neonscan.org/hardhat/verify",
          browserURL: "https://neonscan.org"
        }
      },
      {
        network: "scroll",
        chainId: 534352,
        urls: {
          apiURL: "https://api.scrollscan.com/api",
          browserURL: "https://scrollscan.com"
        }
      },
      {
        network: "mode",
        chainId: 34443,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/mainnet/evm/34443/etherscan",
          browserURL: "https://modescan.io"
        }
      },
      {
        network: "avalanche",
        chainId: 43114,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan",
          browserURL: "https://snowtrace.io"
        }
      },
      {
        network: "lisk",
        chainId: 1135,
        urls: {
          apiURL: "https://blockscout.lisk.com/api",
          browserURL: "https://blockscout.lisk.com"
        }
      },
      {
        network: "form",
        chainId: 478,
        urls: {
          apiURL: "https://explorer.form.network/api",
          browserURL: "https://explorer.form.network"
        }
      },
      {
        network: "ink",
        chainId: 57073,
        urls: {
          apiURL: "https://explorer.inkonchain.com/api",
          browserURL: "https://explorer.inkonchain.com"
        }
      },
      {
        network: "iota",
        chainId: 8822,
        urls: {
          apiURL: "https://explorer.evm.iota.org/api",
          browserURL: "https://explorer.evm.iota.org"
        }
      },
      {
        network: "sonic",
        chainId: 146,
        urls: {
          apiURL: "https://api.sonicscan.org/api",
          browserURL: "https://sonicscan.org"
        }
      }
    ]
  },
  sourcify: { enabled: false },
  docgen: { pages: "files", outputDir: "./docs/contracts", templates: "./docs/templates" }
};

export default config;

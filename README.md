# Guild Pin

An NFT representing actions taken by [Guild.xyz](https://guild.xyz) users.

## Setup

To run the project you need [Node.js](https://nodejs.org) development environment.

Pull the repository from GitHub, then install its dependencies by executing this command:

```bash
npm install
```

Certain actions, like deploying to a public network or verifying source code on block explorers, need environment variables in a file named `.env`. See _[.env.example](.env.example)_ for more info.

### Some additional steps before deployment

Open the script you wish to use, depending on if you want to deploy the contracts for the first time or upgrade an existing deployment. Notice the constants at the top and edit them according to your needs.

## Contract deployment

To deploy the smart contracts to a network, replace _[networkName]_ with the name of the network and _[scriptName]_ with the name of the script you wish to run in this command:

```bash
npx hardhat run scripts/[scriptName] --network [networkName]
```

Networks can be configured in _[hardhat.config.ts](hardhat.config.ts)_. We've preconfigured the following:

- `hardhat` (for local testing, default)
- `ethereum` (Ethereum Mainnet)
- `goerli` (Görli Ethereum Testnet)
- `sepolia` (Sepolia Ethereum Testnet)
- `bsc` (BNB Smart Chain)
- `bsctest` (BNB Smart Chain Testnet)
- `polygon` (Polygon Mainnet (formerly Matic))
- `mumbai` (Matic Mumbai Testnet)
- `gnosis` (Gnosis Chain (formerly xDai Chain))
- `arbitrum` (Arbitrum One (Mainnet))
- `base` (Base Mainnet)
- `optimism` (Optimism Mainnet)
- `cronos` (Cronos Mainnet)
- `mantle` (Mantle Network Mainnet)
- `ontology` (Ontology EVM Mainnet)

## Verification

For source code verification on block explorers, you can use the Verify plugin:

```bash
npx hardhat verify [contractAddress] [constructorArguments] --network [networkName]
```

For more detailed instructions, check out it's documentation [here](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify#usage).

## Linting

The project uses [Solhint](https://github.com/protofire/solhint) for Solidity smart contracts and [ESLint](https://eslint.org) for TypeScript files. To lint all files, simply execute:

```bash
npm run lint
```

To lint only the Solidity files:

```bash
npm run lint-contracts
```

To lint only the TypeScript files:

```bash
npm run lint-ts
```

## Tests

To run the unit tests written for this project, execute this command in a terminal:

```bash
npm test
```

To run the unit tests only in a specific file, just append the path to the command. For example, to run tests just for GuildPin:

```bash
npm test test/GuildPin.spec.ts
```

## Documentation

The documentation for the contracts is generated via the [solidity-docgen](https://github.com/OpenZeppelin/solidity-docgen) package. Run the tool via the following command:

```bash
npm run docgen
```

The output can be found in the _[docs/contracts](docs/contracts)_ folder.

# Metadata storage

Metadata can be stored in different ways. For now, we've decided to store them on IPFS, but it has certain limitations. Let's explore the alternatives.

## Options

### IPFS

- pro: decentralized
- contra: immutable - upgrading is costly (needs a transaction to the contract)

### Metadata in the contract

- pro: decentralized, no external dependency, can contain real-time data from the contract, makes extremely customized and changing images possible
- contra: bigger contract size, changing format is costly, adding off-chain data or new attributes is also costly, the code is more complicated (especially image generation)
- implementation examples:
  - LOOT: see on [Etherscan](https://etherscan.io/address/0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7#code)
  - tutorial on [thirdweb](https://blog.thirdweb.com/guides/how-to-create-on-chain-nfts-with-thirdweb)
  - Uniswap Positions: [NonfungibleTokenPositionDescriptor](https://github.com/Uniswap/v3-periphery/blob/main/contracts/NonfungibleTokenPositionDescriptor.sol) and it's imports, most notably the [NFTDescriptor](https://github.com/Uniswap/v3-periphery/blob/main/contracts/libraries/NFTDescriptor.sol) and the [NFTSVG](https://github.com/Uniswap/v3-periphery/blob/main/contracts/libraries/NFTSVG.sol) library
- concerning: deployment cost of the Uniswap Positions NFT: 1.1 ETH, Loot NFT: 1.2 ETH (compared to cca 0.15 ETH for our current implementation, at comparable gas prices)

### Hybrid (metadata in the contract, image on IPFS)

Same as the previous one, but only a URL/CID is stored for the image. More optimal than a purely contract-based solution if the image does not contain dynamic elements.

### Database on centralized server

- pro: easy to modify, change contents, add new attributes etc.
- contra: centralized ([explanation why this is a problem](https://discord.com/channels/697041998728659035/1103703655728812102/1103967345472450594)), we have to maintain a server/db

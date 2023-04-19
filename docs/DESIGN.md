# Guild Credential redesign

We arrived to a stage where we should rethink how distributing credentials is done. This documents the already considered solutions as well as proposes a new one.

## Requirements

- users should be able to mint credentials based on activity on Guild
- users should pay a fee
- users should not be able to alter metadata
  - the metadata should be uploaded by us, in a controlled environment

## Solutions

### Oracle (current, in progress)

#### The flow without caring for metadata

- the user selects the credential they want to mint on the Guild UI (only the ones the user has access to are displayed)
- the user initiates a transaction to the contract
- the contract requests the oracle whether the user has access
- the oracle calls one of our endpoints ([user/membership/{address}](https://api.guild.xyz/v1/user/membership/{address}?format=oracle) or [guild/access/{guildId}/{address}](https://api.guild.xyz/v1/guild/access/{guildId}/{address}?format=oracle))
- the oracle sends a transaction to the contract with the result
- the contract either mints the credential or reverts, based on the result

#### The metadata problem

- if it's uploaded prior to the contract deploy, it's not dynamic
- if it's uploaded right before the transaction, we should ensure the tokenURI function still works. This can be done in two ways:
  - update it in the contract:
    - if it's done by the user, we can't guarantee it's validity
    - if it's done by a service ran by us, that's uneconomical, more complicated, less elegant, more error-prone
  - store only a pointer in the contract and update that off-chain: [IPNS](https://docs.ipfs.tech/concepts/ipns/), [DNSLink](https://docs.ipfs.tech/concepts/dnslink/). These solutions are probably more error-prone and not exactly meant for this purpose. Furthermore, they tend to expire, so we would have to renew them periodically. Additionally, decentralization is compromised - the metadata might become unavailable due to human errors.
- or it could be uploaded right "during" the minting process. In this case, the oracle would not call directly the aforementioned endpoints, but a new one, that could:
  - check the access
  - generate/upload metadata
  - return the new cid to the contract

The last one does look like a valid solution - probably the best one if we chose oracles.

### Centralized server (proposed)

#### Flow

- the user selects the credential they want to mint on the Guild UI (only the ones the user has access to are displayed)
- the UI makes a call to the server
- the server:
  - checks the access
  - generates the metadata and uploads it
  - signs the transaction data using a private key and returns it
    - the transaction data should contain: the user's address, the GuildAction, the id (guildId/roleId) and the cid
- the user initiates a transaction to the contract. Supplies the transaction data, the signature and the fee
- the contract:
  - verifies the signature
  - sends the fee to the treasury
  - mints the credential

![flow](img/flow.png)

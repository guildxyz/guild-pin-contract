# GuildCredential

An NFT representing actions taken by Guild.xyz users.

## Variables

### totalSupply

```solidity
uint256 totalSupply
```

The total amount of tokens in existence.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |

### cids

```solidity
mapping(uint256 => string) cids
```

Mapping tokenIds to cids (for tokenURIs).

### claimedTokens

```solidity
mapping(address => mapping(enum IGuildCredential.GuildAction => mapping(uint256 => uint256))) claimedTokens
```

## Functions

### constructor

```solidity
constructor(
    bytes32 jobId,
    uint256 oracleFee
) 
```

Sets some of the details of the oracle.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `jobId` | bytes32 | The id of the job to run on the oracle. |
| `oracleFee` | uint256 | The amount of tokens to forward to the oracle with every request. |

### initialize

```solidity
function initialize(
    string name,
    string symbol,
    address linkToken,
    address oracleAddress,
    address payable treasury
) public
```

Sets metadata and the oracle details.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `name` | string | The name of the token. |
| `symbol` | string | The symbol of the token. |
| `linkToken` | address | The address of the Chainlink token. |
| `oracleAddress` | address | The address of the oracle processing the requests. |
| `treasury` | address payable | The address where the collected fees will be sent. |

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(
    address 
) internal
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `` | address |  |

### claim

```solidity
function claim(
    address payToken,
    enum IGuildCredential.GuildAction guildAction,
    uint256 guildId,
    string cid
) external
```

Claims tokens to the given address.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `payToken` | address | The address of the token that's used for paying the minting fees. 0 for ether. |
| `guildAction` | enum IGuildCredential.GuildAction | The action to check via the oracle. |
| `guildId` | uint256 | The id to claim the token for. |
| `cid` | string | The cid used to construct the tokenURI for the token to be minted. |

### fulfillClaim

```solidity
function fulfillClaim(
    bytes32 requestId,
    uint256 access
) public
```

The actual claim function called by the oracle if the requirements are fulfilled.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `requestId` | bytes32 |  |
| `access` | uint256 |  |

### burn

```solidity
function burn(
    enum IGuildCredential.GuildAction guildAction,
    uint256 guildId
) external
```

Burns a token from the sender.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `guildAction` | enum IGuildCredential.GuildAction | The action to which the token belongs to. |
| `guildId` | uint256 | The id of the guild where the token belongs to. |

### updateTokenURI

```solidity
function updateTokenURI(
    uint256 tokenId,
    string newCid
) external
```

Updates a minted token's URI.

Only callable by the owner of the token.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `tokenId` | uint256 | The id of the token to be updated. |
| `newCid` | string | The new cid that points to the updated metadata. |

### hasClaimed

```solidity
function hasClaimed(
    address account,
    enum IGuildCredential.GuildAction guildAction,
    uint256 id
) external returns (bool claimed)
```

Returns true if the address has already claimed their token.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `account` | address | The user's address. |
| `guildAction` | enum IGuildCredential.GuildAction | The action which has been checked via the oracle. |
| `id` | uint256 | The id of the guild or role the token was minted for. |

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `claimed` | bool | Whether the address has claimed their token. |
### tokenURI

```solidity
function tokenURI(
    uint256 tokenId
) public returns (string)
```

See {IERC721Metadata-tokenURI}.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `tokenId` | uint256 |  |

### _safeMint

```solidity
function _safeMint(
    address to,
    uint256 tokenId
) internal
```

A version of {_safeMint} aware of total supply.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `to` | address |  |
| `tokenId` | uint256 |  |


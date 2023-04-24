# GuildCredential

An NFT representing actions taken by Guild.xyz users.

## Variables

### SIGNATURE_VALIDITY

```solidity
uint256 SIGNATURE_VALIDITY
```

The time interval while a signature is valid.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |

### totalSupply

```solidity
uint256 totalSupply
```

The total amount of tokens in existence.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |

### validSigner

```solidity
address validSigner
```

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

### initialize

```solidity
function initialize(
    string name,
    string symbol,
    address payable treasury,
    address _validSigner
) public
```

Sets metadata and the oracle details.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `name` | string | The name of the token. |
| `symbol` | string | The symbol of the token. |
| `treasury` | address payable | The address where the collected fees will be sent. |
| `_validSigner` | address | The address that should sign the parameters for certain functions. |

### claim

```solidity
function claim(
    address payToken,
    address receiver,
    enum IGuildCredential.GuildAction guildAction,
    uint256 guildId,
    uint256 signedAt,
    string cid,
    bytes signature
) external
```

Claims tokens to the given address.

The contract needs to be approved if ERC20 tokens are used.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `payToken` | address | The address of the token that's used for paying the minting fees. 0 for ether. |
| `receiver` | address | The address that receives the token. |
| `guildAction` | enum IGuildCredential.GuildAction | The action to check via the oracle. |
| `guildId` | uint256 | The id to claim the token for. |
| `signedAt` | uint256 | The timestamp marking the time when the data were signed. |
| `cid` | string | The cid used to construct the tokenURI for the token to be minted. |
| `signature` | bytes | The above parameters (except the payToken) signed by validSigner. |

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

### setValidSigner

```solidity
function setValidSigner(
    address newValidSigner
) external
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `newValidSigner` | address |  |

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

### isValidSignature

```solidity
function isValidSignature(
    address receiver,
    enum IGuildCredential.GuildAction guildAction,
    uint256 guildId,
    uint256 signedAt,
    string cid,
    bytes signature
) internal returns (bool)
```

Checks the validity of the signature for the given params.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `receiver` | address |  |
| `guildAction` | enum IGuildCredential.GuildAction |  |
| `guildId` | uint256 |  |
| `signedAt` | uint256 |  |
| `cid` | string |  |
| `signature` | bytes |  |


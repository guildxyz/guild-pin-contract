# GuildPin

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

Maps the tokenIds to cids (for tokenURIs).

### claimedTokens

```solidity
mapping(address => mapping(enum IGuildPin.GuildAction => mapping(uint256 => uint256))) claimedTokens
```

Maps the Guild-related parameters to a tokenId.

### claimedTokensDetails

```solidity
mapping(uint256 => struct IGuildPin.PinData) claimedTokensDetails
```

Maps the tokenIds to Guild-related parameters.

### totalMintedPerGuild

```solidity
mapping(uint256 => uint256) totalMintedPerGuild
```

Maps the guildIds to the amount of tokens minted in that guild.

### guildActionPrettyNames

```solidity
mapping(enum IGuildPin.GuildAction => struct IGuildPin.PinStrings) guildActionPrettyNames
```

Maps the GuildAction enum to pretty strings for metadata.

### initialTokensMinted

```solidity
uint256 initialTokensMinted
```

The number of tokens minted in the first version of the contract.

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

Sets metadata and the associated addresses.

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
    struct IGuildPin.PinDataParams pinData,
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
| `pinData` | struct IGuildPin.PinDataParams | The Guild-related data, see {PinDataParams}. |
| `signedAt` | uint256 | The timestamp marking the time when the data were signed. |
| `cid` | string | The cid used to construct the tokenURI for the token to be minted. |
| `signature` | bytes | The following signed by validSigner: pinData, signedAt, cid, chainId, the contract's address. |

### burn

```solidity
function burn(
    enum IGuildPin.GuildAction guildAction,
    uint256 guildId
) external
```

Burns a token from the sender.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `guildAction` | enum IGuildPin.GuildAction | The action to which the token belongs to. |
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

### updateImageURI

```solidity
function updateImageURI(
    struct IGuildPin.PinDataParams pinData,
    uint256 signedAt,
    string newCid,
    bytes signature
) external
```

Updates a minted token's cid.

Only callable by the owner of the token.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `pinData` | struct IGuildPin.PinDataParams | The Guild-related data, see {PinDataParams}. |
| `signedAt` | uint256 | The timestamp marking the time when the data were signed. |
| `newCid` | string | The new cid that points to the updated image. |
| `signature` | bytes | The following signed by validSigner: pinData, signedAt, cid, chainId, the contract's address. |

### setPinStrings

```solidity
function setPinStrings(
    enum IGuildPin.GuildAction guildAction,
    struct IGuildPin.PinStrings pinStrings
) public
```

Set the pretty strings displayed in metadata for name and description.

Only callable by the owner.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `guildAction` | enum IGuildPin.GuildAction | The action the strings are set for. |
| `pinStrings` | struct IGuildPin.PinStrings | The strings to set. See {PinStrings}. |

### hasClaimed

```solidity
function hasClaimed(
    address account,
    enum IGuildPin.GuildAction guildAction,
    uint256 id
) external returns (bool claimed)
```

Returns true if the address has already claimed their token.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `account` | address | The user's address. |
| `guildAction` | enum IGuildPin.GuildAction | The action the pin was minted for. |
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
    struct IGuildPin.PinDataParams pinData,
    uint256 signedAt,
    string cid,
    bytes signature
) internal returns (bool)
```

Checks the validity of the signature for the given params.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `pinData` | struct IGuildPin.PinDataParams |  |
| `signedAt` | uint256 |  |
| `cid` | string |  |
| `signature` | bytes |  |


# IGuildCredential

An NFT representing actions taken by Guild.xyz users.

## Functions

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
| `guildAction` | enum IGuildCredential.GuildAction | The action the credential was minted for. |
| `id` | uint256 | The id of the guild or role the token was minted for. |

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `claimed` | bool | Whether the address has claimed their token. |
### SIGNATURE_VALIDITY

```solidity
function SIGNATURE_VALIDITY() external returns (uint256 validity)
```

The time interval while a signature is valid.

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `validity` | uint256 | The time interval in seconds. |
### validSigner

```solidity
function validSigner() external returns (address signer)
```

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `signer` | address | The address that signs the metadata. |
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
| `guildAction` | enum IGuildCredential.GuildAction | The action the credential is minted for. |
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

### updateTokenURI

```solidity
function updateTokenURI(
    address tokenOwner,
    enum IGuildCredential.GuildAction guildAction,
    uint256 guildId,
    uint256 signedAt,
    string newCid,
    bytes signature
) external
```

Updates a minted token's URI.

Only callable by the owner of the token.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `tokenOwner` | address | The address that receives the token. |
| `guildAction` | enum IGuildCredential.GuildAction | The action the credential was minted for. |
| `guildId` | uint256 | The id to claim the token for. |
| `signedAt` | uint256 | The timestamp marking the time when the data were signed. |
| `newCid` | string | The new cid that points to the updated metadata. |
| `signature` | bytes | The above parameters signed by validSigner. |

## Events

### Claimed

```solidity
event Claimed(
    address receiver,
    enum IGuildCredential.GuildAction guildAction,
    uint256 guildId
)
```

Event emitted whenever a claim succeeds.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `receiver` | address | The address that received the tokens. |
| `guildAction` | enum IGuildCredential.GuildAction | The action the credential was minted for. |
| `guildId` | uint256 | The id the token has been claimed for. |
### TokenURIUpdated

```solidity
event TokenURIUpdated(
    uint256 tokenId
)
```

Event emitted whenever a token's cid is updated.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `tokenId` | uint256 | The id of the updated token. |
### ValidSignerChanged

```solidity
event ValidSignerChanged(
    address newValidSigner
)
```

Event emitted when the validSigner is changed.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `newValidSigner` | address | The new address of validSigner. |

## Custom errors

### AlreadyClaimed

```solidity
error AlreadyClaimed()
```

Error thrown when the token is already claimed.

### ExpiredSignature

```solidity
error ExpiredSignature()
```

Error thrown when the signature is already expired.

### IncorrectFee

```solidity
error IncorrectFee(uint256 paid, uint256 requiredAmount)
```

Error thrown when an incorrect amount of fee is attempted to be paid.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| paid | uint256 | The amount of funds received. |
| requiredAmount | uint256 | The amount of fees required for minting. |

### IncorrectPayToken

```solidity
error IncorrectPayToken(address token)
```

Error thrown when such a token is attempted to be used for paying that has no fee set.

_The owner should set a fee for the token to solve this issue._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The address of the token that cannot be used. |

### IncorrectSender

```solidity
error IncorrectSender()
```

Error thrown when the sender is not permitted to do a specific action.

### IncorrectSignature

```solidity
error IncorrectSignature()
```

Error thrown when the supplied signature is invalid.

### NonExistentToken

```solidity
error NonExistentToken(uint256 tokenId)
```

Error thrown when trying to query info about a token that's not (yet) minted.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | The queried id. |

## Custom types

### GuildAction

```solidity
enum GuildAction {
  JOINED_GUILD,
  IS_OWNER,
  IS_ADMIN
}
```

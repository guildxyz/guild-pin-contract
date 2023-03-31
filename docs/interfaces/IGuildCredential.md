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
| `guildAction` | enum IGuildCredential.GuildAction | The action which has been checked via the oracle. |
| `id` | uint256 | The id of the guild or role the token was minted for. |

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `claimed` | bool | Whether the address has claimed their token. |
### totalSupply

```solidity
function totalSupply() external returns (uint256 count)
```

The total amount of tokens in existence.

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `count` | uint256 | The number of NFTs. |
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

## Events

### Claimed

```solidity
event Claimed(
    address receiver,
    enum IGuildCredential.GuildAction guildAction,
    uint256 guildId
)
```

Event emitted whenever a claim succeeds (is fulfilled).

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `receiver` | address | The address that received the tokens. |
| `guildAction` | enum IGuildCredential.GuildAction | The action to check via the oracle. |
| `guildId` | uint256 | The id the token has been claimed for. |
### ClaimRequested

```solidity
event ClaimRequested(
    address receiver,
    enum IGuildCredential.GuildAction guildAction,
    uint256 guildId
)
```

Event emitted whenever a claim is requested.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `receiver` | address | The address that receives the tokens. |
| `guildAction` | enum IGuildCredential.GuildAction | The action that has been checked via the oracle. |
| `guildId` | uint256 | The id to claim the token for. |
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

## Custom errors

### AlreadyClaimed

```solidity
error AlreadyClaimed()
```

Error thrown when the token is already claimed.

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


# IGuildPin

An NFT representing actions taken by Guild.xyz users.

## Functions

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
### hasTheUserIdClaimed

```solidity
function hasTheUserIdClaimed(
    uint256 userId,
    enum IGuildPin.GuildAction guildAction,
    uint256 id
) external returns (bool claimed)
```

Whether a userId has minted a specific pin.

Used to prevent double mints in the same block.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `userId` | uint256 | The id of the user on Guild. |
| `guildAction` | enum IGuildPin.GuildAction | The action the pin was minted for. |
| `id` | uint256 | The id of the guild or role the token was minted for. |

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `claimed` | bool | Whether the userId has claimed the pin for the given action/guildId combination. |
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
    struct IGuildPin.PinDataParams pinData,
    address payable adminTreasury,
    uint256 adminFee,
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
| `pinData` | struct IGuildPin.PinDataParams | The Guild-related data, see {PinDataParams}. |
| `adminTreasury` | address payable | The address where the pinned guild collects fees paid to them. |
| `adminFee` | uint256 | The fee to pay to the guild where the Pin is minted. |
| `signedAt` | uint256 | The timestamp marking the time when the data were signed. |
| `cid` | string | The cid used to construct the tokenURI for the token to be minted. |
| `signature` | bytes | The following signed by validSigner: pinData, signedAt, cid, chainId, the contract's address. |

### burn

```solidity
function burn(
    uint256 userId,
    enum IGuildPin.GuildAction guildAction,
    uint256 guildId
) external
```

Burns a token from the sender.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `userId` | uint256 | The id of the user on Guild. |
| `guildAction` | enum IGuildPin.GuildAction | The action to which the token belongs to. |
| `guildId` | uint256 | The id of the guild where the token belongs to. |

### setValidSigner

```solidity
function setValidSigner(
    address newValidSigner
) external
```

Sets the address that signs the metadata.

Callable only by the owner.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `newValidSigner` | address | The new address of validSigner. |

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

Callable only by the owner of the token.

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
) external
```

Set the pretty strings displayed in metadata for name and description.

Callable only by the owner.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `guildAction` | enum IGuildPin.GuildAction | The action the strings are set for. |
| `pinStrings` | struct IGuildPin.PinStrings | The strings to set. See {PinStrings}. |

## Events

### Claimed

```solidity
event Claimed(
    address receiver,
    enum IGuildPin.GuildAction guildAction,
    uint256 guildId
)
```

Event emitted whenever a claim succeeds.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `receiver` | address | The address that received the tokens. |
| `guildAction` | enum IGuildPin.GuildAction | The action the pin was minted for. |
| `guildId` | uint256 | The id the token has been claimed for. |
### PinStringsSet

```solidity
event PinStringsSet(
    enum IGuildPin.GuildAction guildAction
)
```

Event emitted when pretty strings are set for a GuildAction.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `guildAction` | enum IGuildPin.GuildAction | The action whose strings were set. |
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

## Custom types

### GuildAction

```solidity
enum GuildAction {
  JOINED_GUILD,
  IS_OWNER,
  IS_ADMIN
}
```
### PinData

```solidity
struct PinData {
  address holder;
  enum IGuildPin.GuildAction action;
  uint88 userId;
  string guildName;
  uint128 id;
  uint128 pinNumber;
  uint128 mintDate;
  uint128 createdAt;
}
```
### PinDataParams

```solidity
struct PinDataParams {
  address receiver;
  enum IGuildPin.GuildAction guildAction;
  uint256 userId;
  uint256 guildId;
  string guildName;
  uint256 createdAt;
}
```
### PinStrings

```solidity
struct PinStrings {
  string actionName;
  string description;
}
```


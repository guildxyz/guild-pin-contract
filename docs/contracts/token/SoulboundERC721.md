# SoulboundERC721

A simple, soulbound ERC721.

Allowance and transfer-related functions are disabled.

## Functions

### __SoulboundERC721_init

```solidity
function __SoulboundERC721_init(
    string name_,
    string symbol_
) internal
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `name_` | string |  |
| `symbol_` | string |  |

### approve

```solidity
function approve(
    address ,
    uint256 
) public
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `` | address |  |
| `` | uint256 |  |

### setApprovalForAll

```solidity
function setApprovalForAll(
    address ,
    bool 
) public
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `` | address |  |
| `` | bool |  |

### isApprovedForAll

```solidity
function isApprovedForAll(
    address ,
    address 
) public returns (bool)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `` | address |  |
| `` | address |  |

### transferFrom

```solidity
function transferFrom(
    address ,
    address ,
    uint256 
) public
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `` | address |  |
| `` | address |  |
| `` | uint256 |  |

### safeTransferFrom

```solidity
function safeTransferFrom(
    address ,
    address ,
    uint256 
) public
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `` | address |  |
| `` | address |  |
| `` | uint256 |  |

### safeTransferFrom

```solidity
function safeTransferFrom(
    address ,
    address ,
    uint256 ,
    bytes 
) public
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `` | address |  |
| `` | address |  |
| `` | uint256 |  |
| `` | bytes |  |

## Custom errors

### Soulbound

```solidity
error Soulbound()
```

Error thrown when a function's execution is not possible, because this is a soulbound NFT.


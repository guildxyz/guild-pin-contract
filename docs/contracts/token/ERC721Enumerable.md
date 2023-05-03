# ERC721EnumerableUpgradeable

This implements an optional extension of {ERC721} defined in the EIP that adds
enumerability of all the token ids in the contract as well as all token ids owned by each
account.

## Variables

### _ownedTokens

```solidity
mapping(address => uint256[]) _ownedTokens
```

### _ownedTokensIndex

```solidity
mapping(uint256 => uint256) _ownedTokensIndex
```

### _allTokens

```solidity
uint256[] _allTokens
```

### _allTokensIndex

```solidity
mapping(uint256 => uint256) _allTokensIndex
```

## Functions

### __ERC721Enumerable_init

```solidity
function __ERC721Enumerable_init() internal
```

### __ERC721Enumerable_init_unchained

```solidity
function __ERC721Enumerable_init_unchained() internal
```

### supportsInterface

```solidity
function supportsInterface(
    bytes4 interfaceId
) public returns (bool)
```

See {IERC165-supportsInterface}.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `interfaceId` | bytes4 |  |

### tokensOfOwner

```solidity
function tokensOfOwner(
    address owner
) public returns (uint256[] ownedTokens)
```

Custom function that returns all tokens of an owner at once.

Might not work with large amounts of tokens.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `owner` | address | The address of the token owner. |

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `ownedTokens` | uint256[] | The token ids owned by `owner`. |
### tokenOfOwnerByIndex

```solidity
function tokenOfOwnerByIndex(
    address owner,
    uint256 index
) public returns (uint256)
```

See {IERC721Enumerable-tokenOfOwnerByIndex}.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `owner` | address |  |
| `index` | uint256 |  |

### totalSupply

```solidity
function totalSupply() public returns (uint256)
```

See {IERC721Enumerable-totalSupply}.

### tokenByIndex

```solidity
function tokenByIndex(
    uint256 index
) public returns (uint256)
```

See {IERC721Enumerable-tokenByIndex}.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `index` | uint256 |  |

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(
    address from,
    address to,
    uint256 firstTokenId,
    uint256 batchSize
) internal
```

See {ERC721-_beforeTokenTransfer}.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `from` | address |  |
| `to` | address |  |
| `firstTokenId` | uint256 |  |
| `batchSize` | uint256 |  |

## Custom errors

### OutOfBounds

```solidity
error OutOfBounds()
```

Error thrown when an array element at an out of bounds index is requested.


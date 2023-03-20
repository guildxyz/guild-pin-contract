# TreasuryManager

A contract that manages fee-related functionality.

## Variables

### treasury

```solidity
address payable treasury
```

Returns the address that receives the fees.

### fee

```solidity
mapping(address => uint256) fee
```

The minting fee of a token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |

## Functions

### __TreasuryManager_init

```solidity
function __TreasuryManager_init(
    address payable treasury_
) internal
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `treasury_` | address payable | The address that will receive the fees. |

### setFee

```solidity
function setFee(
    address token,
    uint256 newFee
) external
```

Sets the minting fee for a given token used for paying.

Callable only by the owner.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `token` | address | The token whose fee is set. |
| `newFee` | uint256 | The new fee in base units. |

### setTreasury

```solidity
function setTreasury(
    address payable newTreasury
) external
```

Sets the address that receives the fees.

Callable only by the owner.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `newTreasury` | address payable | The new address of the treasury. |


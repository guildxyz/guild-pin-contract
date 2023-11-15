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
uint256 fee
```

The minting fee of a token.

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
    uint256 newFee
) external
```

Sets the minting fee forwarded to Guild's treasury.

Callable only by the owner.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
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


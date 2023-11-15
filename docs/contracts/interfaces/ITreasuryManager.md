# ITreasuryManager

A contract that manages fee-related functionality.

## Functions

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

### fee

```solidity
function fee() external returns (uint256 fee)
```

The minting fee of a token.

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `fee` | uint256 | The amount of the fee in base units. |
### treasury

```solidity
function treasury() external returns (address payable)
```

Returns the address that receives the fees.

## Events

### FeeChanged

```solidity
event FeeChanged(
    uint256 newFee
)
```

Event emitted when the fee is changed.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `newFee` | uint256 | The new amount of fee in base units. |
### TreasuryChanged

```solidity
event TreasuryChanged(
    address newTreasury
)
```

Event emitted when the treasury address is changed.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `newTreasury` | address | The new address of the treasury. |


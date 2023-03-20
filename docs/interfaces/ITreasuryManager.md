# ITreasuryManager

A contract that manages fee-related functionality.

## Functions

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

### fee

```solidity
function fee(
    address token
) external returns (uint256 fee)
```

The minting fee of a token.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `token` | address | The token used for paying. |

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
    address token,
    uint256 newFee
)
```

Event emitted when a token's fee is changed.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `token` | address | The address of the token whose fee was changed. 0 for ether. |
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


# LibTransfer

Library for functions related to transfers.

## Functions

### sendEther

```solidity
function sendEther(
    address payable recipient,
    uint256 amount
) internal
```

Send ether to an address, forwarding all available gas and reverting on errors.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `recipient` | address payable | The recipient of the ether. |
| `amount` | uint256 | The amount of ether to send in base units. |

### sendToken

```solidity
function sendToken(
    address token,
    address from,
    address to,
    uint256 amount
) internal
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `token` | address |  |
| `from` | address |  |
| `to` | address |  |
| `amount` | uint256 |  |

## Custom errors

### FailedToSendEther

```solidity
error FailedToSendEther(address recipient)
```

Error thrown when sending ether fails.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| recipient | address | The address that could not receive the ether. |

### TransferFailed

```solidity
error TransferFailed(address from, address to)
```

Error thrown when an ERC20 transfer failed.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The sender of the token. |
| to | address | The recipient of the token. |


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

Sends ether to an address, forwarding all available gas and reverting on errors.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `recipient` | address payable | The recipient of the ether. |
| `amount` | uint256 | The amount of ether to send in base units. |

### sendToken

```solidity
function sendToken(
    address to,
    address token,
    uint256 amount
) internal
```

Sends an ERC20 token to an address and reverts if the transfer returns false.

Wrapper for {IERC20-transfer}.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `to` | address | The recipient of the tokens. |
| `token` | address | The address of the token to send. |
| `amount` | uint256 | The amount of the token to send in base units. |

### sendTokenFrom

```solidity
function sendTokenFrom(
    address to,
    address from,
    address token,
    uint256 amount
) internal
```

Sends an ERC20 token to an address from another address and reverts if transferFrom returns false.

Wrapper for {IERC20-transferFrom}.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `to` | address | The recipient of the tokens. |
| `from` | address | The source of the tokens. |
| `token` | address | The address of the token to send. |
| `amount` | uint256 | The amount of the token to send in base units. |

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


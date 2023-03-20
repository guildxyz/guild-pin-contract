# ChainlinkClient

The ChainlinkClient contract

Contract writers can inherit this contract in order to create requests for the Chainlink network

Modified version that's comptible with proxy upgrade patterns

## Functions

### __ChainlinkClient_init

```solidity
function __ChainlinkClient_init() internal
```

### buildChainlinkRequest

```solidity
function buildChainlinkRequest(
    bytes32 specId,
    address callbackAddr,
    bytes4 callbackFunctionSignature
) internal returns (struct Chainlink.Request)
```

Creates a request that can hold additional parameters

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `specId` | bytes32 | The Job Specification ID that the request will be created for |
| `callbackAddr` | address | address to operate the callback on |
| `callbackFunctionSignature` | bytes4 | function signature to use for the callback |

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `[0]` | struct Chainlink.Request | A Chainlink Request struct in memory |
### buildOperatorRequest

```solidity
function buildOperatorRequest(
    bytes32 specId,
    bytes4 callbackFunctionSignature
) internal returns (struct Chainlink.Request)
```

Creates a request that can hold additional parameters

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `specId` | bytes32 | The Job Specification ID that the request will be created for |
| `callbackFunctionSignature` | bytes4 | function signature to use for the callback |

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `[0]` | struct Chainlink.Request | A Chainlink Request struct in memory |
### sendChainlinkRequest

```solidity
function sendChainlinkRequest(
    struct Chainlink.Request req,
    uint256 payment
) internal returns (bytes32)
```

Creates a Chainlink request to the stored oracle address

Calls `chainlinkRequestTo` with the stored oracle address

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `req` | struct Chainlink.Request | The initialized Chainlink Request |
| `payment` | uint256 | The amount of LINK to send for the request |

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `[0]` | bytes32 | requestId The request ID |
### sendChainlinkRequestTo

```solidity
function sendChainlinkRequestTo(
    address oracleAddress,
    struct Chainlink.Request req,
    uint256 payment
) internal returns (bytes32 requestId)
```

Creates a Chainlink request to the specified oracle address

Generates and stores a request ID, increments the local nonce, and uses `transferAndCall` to
send LINK which creates a request on the target oracle contract.
Emits ChainlinkRequested event.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `oracleAddress` | address | The address of the oracle for the request |
| `req` | struct Chainlink.Request | The initialized Chainlink Request |
| `payment` | uint256 | The amount of LINK to send for the request |

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `requestId` | bytes32 | The request ID |
### sendOperatorRequest

```solidity
function sendOperatorRequest(
    struct Chainlink.Request req,
    uint256 payment
) internal returns (bytes32)
```

Creates a Chainlink request to the stored oracle address

This function supports multi-word response
Calls `sendOperatorRequestTo` with the stored oracle address

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `req` | struct Chainlink.Request | The initialized Chainlink Request |
| `payment` | uint256 | The amount of LINK to send for the request |

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `[0]` | bytes32 | requestId The request ID |
### sendOperatorRequestTo

```solidity
function sendOperatorRequestTo(
    address oracleAddress,
    struct Chainlink.Request req,
    uint256 payment
) internal returns (bytes32 requestId)
```

Creates a Chainlink request to the specified oracle address

This function supports multi-word response
Generates and stores a request ID, increments the local nonce, and uses `transferAndCall` to
send LINK which creates a request on the target oracle contract.
Emits ChainlinkRequested event.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `oracleAddress` | address | The address of the oracle for the request |
| `req` | struct Chainlink.Request | The initialized Chainlink Request |
| `payment` | uint256 | The amount of LINK to send for the request |

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `requestId` | bytes32 | The request ID |
### cancelChainlinkRequest

```solidity
function cancelChainlinkRequest(
    bytes32 requestId,
    uint256 payment,
    bytes4 callbackFunc,
    uint256 expiration
) internal
```

Allows a request to be cancelled if it has not been fulfilled

Requires keeping track of the expiration value emitted from the oracle contract.
Deletes the request from the `pendingRequests` mapping.
Emits ChainlinkCancelled event.

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `requestId` | bytes32 | The request ID |
| `payment` | uint256 | The amount of LINK sent for the request |
| `callbackFunc` | bytes4 | The callback function specified for the request |
| `expiration` | uint256 | The time of the expiration for the request |

### getNextRequestCount

```solidity
function getNextRequestCount() internal returns (uint256)
```

the next request count to be used in generating a nonce

starts at 1 in order to ensure consistent gas cost

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `[0]` | uint256 | returns the next request count to be used in a nonce |
### setChainlinkOracle

```solidity
function setChainlinkOracle(
    address oracleAddress
) internal
```

Sets the stored oracle address

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `oracleAddress` | address | The address of the oracle contract |

### setChainlinkToken

```solidity
function setChainlinkToken(
    address linkAddress
) internal
```

Sets the LINK token address

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `linkAddress` | address | The address of the LINK token contract |

### chainlinkTokenAddress

```solidity
function chainlinkTokenAddress() internal returns (address)
```

Retrieves the stored address of the LINK token

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `[0]` | address | The address of the LINK token |
### chainlinkOracleAddress

```solidity
function chainlinkOracleAddress() internal returns (address)
```

Retrieves the stored address of the oracle contract

#### Return Values

| Name | Type | Description |
| :--- | :--- | :---------- |
| `[0]` | address | The address of the oracle contract |
### addChainlinkExternalRequest

```solidity
function addChainlinkExternalRequest(
    address oracleAddress,
    bytes32 requestId
) internal
```

Allows for a request which was created on another contract to be fulfilled
on this contract

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `oracleAddress` | address | The address of the oracle contract that will fulfill the request |
| `requestId` | bytes32 | The request ID used for the response |

### validateChainlinkCallback

```solidity
function validateChainlinkCallback(
    bytes32 requestId
) internal
```

Ensures that the fulfillment is valid for this contract

Use if the contract developer prefers methods instead of modifiers for validation

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `requestId` | bytes32 | The request ID for fulfillment |

## Modifiers

### recordChainlinkFulfillment

```solidity
modifier recordChainlinkFulfillment(bytes32 requestId)
```

_Reverts if the sender is not the oracle of the request.
Emits ChainlinkFulfilled event._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | The request ID for fulfillment |

### notPendingRequest

```solidity
modifier notPendingRequest(bytes32 requestId)
```

_Reverts if the request is already pending_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | The request ID for fulfillment |

## Events

### ChainlinkRequested

```solidity
event ChainlinkRequested(
    bytes32 id
)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `id` | bytes32 |  |
### ChainlinkFulfilled

```solidity
event ChainlinkFulfilled(
    bytes32 id
)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `id` | bytes32 |  |
### ChainlinkCancelled

```solidity
event ChainlinkCancelled(
    bytes32 id
)
```

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| `id` | bytes32 |  |


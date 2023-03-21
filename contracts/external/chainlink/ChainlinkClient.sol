// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Chainlink } from "@chainlink/contracts/src/v0.8/Chainlink.sol";
import { LinkTokenInterface } from "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import { ChainlinkRequestInterface } from "@chainlink/contracts/src/v0.8/interfaces/ChainlinkRequestInterface.sol";
import { OperatorInterface } from "@chainlink/contracts/src/v0.8/interfaces/OperatorInterface.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title The ChainlinkClient contract
 * @dev Modified version that's comptible with proxy upgrade patterns
 * @notice Contract writers can inherit this contract in order to create requests for the Chainlink network
 */
abstract contract ChainlinkClient is Initializable {
    using Chainlink for Chainlink.Request;

    uint256 private constant AMOUNT_OVERRIDE = 0;
    address private constant SENDER_OVERRIDE = address(0);
    uint256 private constant ORACLE_ARGS_VERSION = 1;
    uint256 private constant OPERATOR_ARGS_VERSION = 2;

    LinkTokenInterface private sLink;
    OperatorInterface private sOracle;
    uint256 private sRequestCount; // = 1;
    mapping(bytes32 => address) private sPendingRequests;

    /// @notice Empty space reserved for future updates.
    uint256[46] private __gap;

    event ChainlinkRequested(bytes32 indexed id);
    event ChainlinkFulfilled(bytes32 indexed id);
    event ChainlinkCancelled(bytes32 indexed id);

    // solhint-disable-next-line func-name-mixedcase
    function __ChainlinkClient_init() internal onlyInitializing {
        sRequestCount = 1;
    }

    /**
     * @notice Creates a request that can hold additional parameters
     * @param specId The Job Specification ID that the request will be created for
     * @param callbackAddr address to operate the callback on
     * @param callbackFunctionSignature function signature to use for the callback
     * @return A Chainlink Request struct in memory
     */
    function buildChainlinkRequest(
        bytes32 specId,
        address callbackAddr,
        bytes4 callbackFunctionSignature
    ) internal pure returns (Chainlink.Request memory) {
        Chainlink.Request memory req;
        return req.initialize(specId, callbackAddr, callbackFunctionSignature);
    }

    /**
     * @notice Creates a request that can hold additional parameters
     * @param specId The Job Specification ID that the request will be created for
     * @param callbackFunctionSignature function signature to use for the callback
     * @return A Chainlink Request struct in memory
     */
    function buildOperatorRequest(
        bytes32 specId,
        bytes4 callbackFunctionSignature
    ) internal view returns (Chainlink.Request memory) {
        Chainlink.Request memory req;
        return req.initialize(specId, address(this), callbackFunctionSignature);
    }

    /**
     * @notice Creates a Chainlink request to the stored oracle address
     * @dev Calls `chainlinkRequestTo` with the stored oracle address
     * @param req The initialized Chainlink Request
     * @param payment The amount of LINK to send for the request
     * @return requestId The request ID
     */
    function sendChainlinkRequest(Chainlink.Request memory req, uint256 payment) internal returns (bytes32) {
        return sendChainlinkRequestTo(address(sOracle), req, payment);
    }

    /**
     * @notice Creates a Chainlink request to the specified oracle address
     * @dev Generates and stores a request ID, increments the local nonce, and uses `transferAndCall` to
     * send LINK which creates a request on the target oracle contract.
     * Emits ChainlinkRequested event.
     * @param oracleAddress The address of the oracle for the request
     * @param req The initialized Chainlink Request
     * @param payment The amount of LINK to send for the request
     * @return requestId The request ID
     */
    function sendChainlinkRequestTo(
        address oracleAddress,
        Chainlink.Request memory req,
        uint256 payment
    ) internal returns (bytes32 requestId) {
        uint256 nonce = sRequestCount;
        sRequestCount = nonce + 1;
        bytes memory encodedRequest = abi.encodeWithSelector(
            ChainlinkRequestInterface.oracleRequest.selector,
            SENDER_OVERRIDE, // Sender value - overridden by onTokenTransfer by the requesting contract's address
            AMOUNT_OVERRIDE, // Amount value - overridden by onTokenTransfer by the actual amount of LINK sent
            req.id,
            address(this),
            req.callbackFunctionId,
            nonce,
            ORACLE_ARGS_VERSION,
            req.buf.buf
        );
        return _rawRequest(oracleAddress, nonce, payment, encodedRequest);
    }

    /**
     * @notice Creates a Chainlink request to the stored oracle address
     * @dev This function supports multi-word response
     * @dev Calls `sendOperatorRequestTo` with the stored oracle address
     * @param req The initialized Chainlink Request
     * @param payment The amount of LINK to send for the request
     * @return requestId The request ID
     */
    function sendOperatorRequest(Chainlink.Request memory req, uint256 payment) internal returns (bytes32) {
        return sendOperatorRequestTo(address(sOracle), req, payment);
    }

    /**
     * @notice Creates a Chainlink request to the specified oracle address
     * @dev This function supports multi-word response
     * @dev Generates and stores a request ID, increments the local nonce, and uses `transferAndCall` to
     * send LINK which creates a request on the target oracle contract.
     * Emits ChainlinkRequested event.
     * @param oracleAddress The address of the oracle for the request
     * @param req The initialized Chainlink Request
     * @param payment The amount of LINK to send for the request
     * @return requestId The request ID
     */
    function sendOperatorRequestTo(
        address oracleAddress,
        Chainlink.Request memory req,
        uint256 payment
    ) internal returns (bytes32 requestId) {
        uint256 nonce = sRequestCount;
        sRequestCount = nonce + 1;
        bytes memory encodedRequest = abi.encodeWithSelector(
            OperatorInterface.operatorRequest.selector,
            SENDER_OVERRIDE, // Sender value - overridden by onTokenTransfer by the requesting contract's address
            AMOUNT_OVERRIDE, // Amount value - overridden by onTokenTransfer by the actual amount of LINK sent
            req.id,
            req.callbackFunctionId,
            nonce,
            OPERATOR_ARGS_VERSION,
            req.buf.buf
        );
        return _rawRequest(oracleAddress, nonce, payment, encodedRequest);
    }

    /**
     * @notice Make a request to an oracle
     * @param oracleAddress The address of the oracle for the request
     * @param nonce used to generate the request ID
     * @param payment The amount of LINK to send for the request
     * @param encodedRequest data encoded for request type specific format
     * @return requestId The request ID
     */
    function _rawRequest(
        address oracleAddress,
        uint256 nonce,
        uint256 payment,
        bytes memory encodedRequest
    ) private returns (bytes32 requestId) {
        requestId = keccak256(abi.encodePacked(this, nonce));
        sPendingRequests[requestId] = oracleAddress;
        emit ChainlinkRequested(requestId);
        // solhint-disable-next-line reason-string
        require(sLink.transferAndCall(oracleAddress, payment, encodedRequest), "unable to transferAndCall to oracle");
    }

    /**
     * @notice Allows a request to be cancelled if it has not been fulfilled
     * @dev Requires keeping track of the expiration value emitted from the oracle contract.
     * Deletes the request from the `pendingRequests` mapping.
     * Emits ChainlinkCancelled event.
     * @param requestId The request ID
     * @param payment The amount of LINK sent for the request
     * @param callbackFunc The callback function specified for the request
     * @param expiration The time of the expiration for the request
     */
    function cancelChainlinkRequest(
        bytes32 requestId,
        uint256 payment,
        bytes4 callbackFunc,
        uint256 expiration
    ) internal {
        OperatorInterface requested = OperatorInterface(sPendingRequests[requestId]);
        delete sPendingRequests[requestId];
        emit ChainlinkCancelled(requestId);
        requested.cancelOracleRequest(requestId, payment, callbackFunc, expiration);
    }

    /**
     * @notice the next request count to be used in generating a nonce
     * @dev starts at 1 in order to ensure consistent gas cost
     * @return returns the next request count to be used in a nonce
     */
    function getNextRequestCount() internal view returns (uint256) {
        return sRequestCount;
    }

    /**
     * @notice Sets the stored oracle address
     * @param oracleAddress The address of the oracle contract
     */
    function setChainlinkOracle(address oracleAddress) internal {
        sOracle = OperatorInterface(oracleAddress);
    }

    /**
     * @notice Sets the LINK token address
     * @param linkAddress The address of the LINK token contract
     */
    function setChainlinkToken(address linkAddress) internal {
        sLink = LinkTokenInterface(linkAddress);
    }

    /**
     * @notice Retrieves the stored address of the LINK token
     * @return The address of the LINK token
     */
    function chainlinkTokenAddress() internal view returns (address) {
        return address(sLink);
    }

    /**
     * @notice Retrieves the stored address of the oracle contract
     * @return The address of the oracle contract
     */
    function chainlinkOracleAddress() internal view returns (address) {
        return address(sOracle);
    }

    /**
     * @notice Allows for a request which was created on another contract to be fulfilled
     * on this contract
     * @param oracleAddress The address of the oracle contract that will fulfill the request
     * @param requestId The request ID used for the response
     */
    function addChainlinkExternalRequest(
        address oracleAddress,
        bytes32 requestId
    ) internal notPendingRequest(requestId) {
        sPendingRequests[requestId] = oracleAddress;
    }

    /**
     * @notice Ensures that the fulfillment is valid for this contract
     * @dev Use if the contract developer prefers methods instead of modifiers for validation
     * @param requestId The request ID for fulfillment
     */
    function validateChainlinkCallback(
        bytes32 requestId
    )
        internal
        recordChainlinkFulfillment(requestId) // solhint-disable-next-line no-empty-blocks
    {}

    /**
     * @dev Reverts if the sender is not the oracle of the request.
     * Emits ChainlinkFulfilled event.
     * @param requestId The request ID for fulfillment
     */
    modifier recordChainlinkFulfillment(bytes32 requestId) {
        // solhint-disable-next-line reason-string
        require(msg.sender == sPendingRequests[requestId], "Source must be the oracle of the request");
        delete sPendingRequests[requestId];
        emit ChainlinkFulfilled(requestId);
        _;
    }

    /**
     * @dev Reverts if the request is already pending
     * @param requestId The request ID for fulfillment
     */
    modifier notPendingRequest(bytes32 requestId) {
        require(sPendingRequests[requestId] == address(0), "Request is already pending");
        _;
    }
}

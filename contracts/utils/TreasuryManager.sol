// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { ITreasuryManager } from "../interfaces/ITreasuryManager.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @title A contract that manages fee-related functionality.
contract TreasuryManager is ITreasuryManager, Initializable, OwnableUpgradeable {
    address payable public treasury;

    mapping(address token => uint256 fee) public fee;

    /// @notice Empty space reserved for future updates.
    uint256[48] private __gap;

    /// @param treasury_ The address that will receive the fees.
    // solhint-disable-next-line func-name-mixedcase
    function __TreasuryManager_init(address payable treasury_) internal onlyInitializing {
        treasury = treasury_;
    }

    function setFee(address token, uint256 newFee) external onlyOwner {
        fee[token] = newFee;
        emit FeeChanged(token, newFee);
    }

    function setTreasury(address payable newTreasury) external onlyOwner {
        treasury = newTreasury;
        emit TreasuryChanged(newTreasury);
    }
}

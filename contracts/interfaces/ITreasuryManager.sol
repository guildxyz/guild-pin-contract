// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title A contract that manages fee-related functionality.
interface ITreasuryManager {
    /// @notice Sets the minting fee forwarded to Guild's treasury.
    /// @dev Callable only by the owner.
    /// @param newFee The new fee in base units.
    function setFee(uint256 newFee) external;

    /// @notice Sets the address that receives the fees.
    /// @dev Callable only by the owner.
    /// @param newTreasury The new address of the treasury.
    function setTreasury(address payable newTreasury) external;

    /// @notice The minting fee of a token.
    /// @return fee The amount of the fee in base units.
    function fee() external view returns (uint256 fee);

    /// @notice Returns the address that receives the fees.
    function treasury() external view returns (address payable);

    /// @notice Event emitted when the fee is changed.
    /// @param newFee The new amount of fee in base units.
    event FeeChanged(uint256 newFee);

    /// @notice Event emitted when the treasury address is changed.
    /// @param newTreasury The new address of the treasury.
    event TreasuryChanged(address newTreasury);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title A contract that manages fee-related functionality.
interface ITreasuryManager {
    /// @notice Sets the minting fee for a given token used for paying.
    /// @dev Callable only by the owner.
    /// @param token The token whose fee is set.
    /// @param newFee The new fee in base units.
    function setFee(address token, uint256 newFee) external;

    /// @notice Sets the address that receives the fees.
    /// @dev Callable only by the owner.
    /// @param newTreasury The new address of the treasury.
    function setTreasury(address payable newTreasury) external;

    /// @notice The minting fee of a token.
    /// @param token The token used for paying.
    /// @return fee The amount of the fee in base units.
    function fee(address token) external view returns (uint256 fee);

    /// @notice Returns the address that receives the fees.
    function treasury() external view returns (address payable);

    /// @notice Event emitted when a token's fee is changed.
    /// @param token The address of the token whose fee was changed. 0 for ether.
    /// @param newFee The new amount of fee in base units.
    event FeeChanged(address token, uint256 newFee);

    /// @notice Event emitted when the treasury address is changed.
    /// @param newTreasury The new address of the treasury.
    event TreasuryChanged(address newTreasury);
}

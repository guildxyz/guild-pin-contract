// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { MockERC20 } from "./MockERC20.sol";

/// @title An ERC20 token that returns false on transfer, used only for tests.
/// @dev Do not use this in production.
contract MockBadERC20 is MockERC20 {
    /// @notice Sets metadata.
    /// @param name The name of the token.
    /// @param symbol The symbol of the token.
    // solhint-disable-next-line no-empty-blocks
    constructor(string memory name, string memory symbol) MockERC20(name, symbol) {}

    function transfer(address to, uint256 amount) public override returns (bool) {
        super.transfer(to, amount);
        return false;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        super.transferFrom(from, to, amount);
        return false;
    }
}

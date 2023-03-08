// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title todo
interface IGuildCredential {
    /// @notice Actions that can be checked via the oracle.
    enum GuildAction {
        HAS_ACCESS,
        HAS_ROLE,
        IS_ADMIN,
        IS_OWNER,
        JOINED_GUILD
    }
}

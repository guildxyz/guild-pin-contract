// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title An NFT representing actions taken by Guild.xyz users.
interface IGuildCredential {
    /// @notice Actions that can be checked via the oracle.
    enum GuildAction {
        JOINED_GUILD,
        IS_OWNER,
        IS_ADMIN
    }

    /// @notice The token used for paying for a credential and it's claim status.
    struct Claim {
        address payToken;
        bool claimed;
    }

    /// @notice Returns true if the address has already claimed their token.
    /// @param account The user's address.
    /// @param guildAction The action which has been checked via the oracle.
    /// @param id The id of the guild or role the token was minted for.
    /// @return claimed Whether the address has claimed their token.
    function hasClaimed(address account, GuildAction guildAction, uint256 id) external view returns (bool claimed);

    /// @notice The total amount of tokens in existence.
    /// @return count The number of NFTs.
    function totalSupply() external view returns (uint256 count);

    /// @notice Claims tokens to the given address.
    /// @param payToken The address of the token that's used for paying the minting fees. 0 for ether.
    /// @param guildAction The action to check via the oracle.
    /// @param guildId The id to claim the token for.
    function claim(address payToken, GuildAction guildAction, uint256 guildId) external payable;

    /// @notice Event emitted whenever a claim succeeds (is fulfilled).
    /// @param receiver The address that received the tokens.
    /// @param guildAction The action to check via the oracle.
    /// @param guildId The id the token has been claimed for.
    event Claimed(address receiver, GuildAction guildAction, uint256 guildId);

    /// @notice Event emitted whenever a claim is requested.
    /// @param receiver The address that receives the tokens.
    /// @param guildAction The action that has been checked via the oracle.
    /// @param guildId The id to claim the token for.
    event ClaimRequested(address receiver, GuildAction guildAction, uint256 guildId);

    /// @notice Error thrown when the token is already claimed.
    error AlreadyClaimed();

    /// @notice Error thrown when an incorrect amount of fee is attempted to be paid.
    /// @param paid The amount of funds received.
    /// @param requiredAmount The amount of fees required for minting.
    error IncorrectFee(uint256 paid, uint256 requiredAmount);

    /// @notice Error thrown when trying to query info about a token that's not (yet) minted.
    /// @param tokenId The queried id.
    error NonExistentToken(uint256 tokenId);

    /// @notice Error thrown when an ERC20 transfer failed.
    /// @param from The sender of the token.
    /// @param to The recipient of the token.
    error TransferFailed(address from, address to);
}

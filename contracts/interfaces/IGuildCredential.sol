// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title An NFT representing actions taken by Guild.xyz users.
interface IGuildCredential {
    /// @notice Actions taken on Guild that can be rewarded with a credential.
    enum GuildAction {
        JOINED_GUILD,
        IS_OWNER,
        IS_ADMIN
    }

    /// @notice Returns true if the address has already claimed their token.
    /// @param account The user's address.
    /// @param guildAction The action the credential was minted for.
    /// @param id The id of the guild or role the token was minted for.
    /// @return claimed Whether the address has claimed their token.
    function hasClaimed(address account, GuildAction guildAction, uint256 id) external view returns (bool claimed);

    /// @notice The time interval while a signature is valid.
    /// @return validity The time interval in seconds.
    // solhint-disable func-name-mixedcase
    function SIGNATURE_VALIDITY() external pure returns (uint256 validity);

    /// @return signer The address that signs the metadata.
    function validSigner() external view returns (address signer);

    /// @notice Claims tokens to the given address.
    /// @dev The contract needs to be approved if ERC20 tokens are used.
    /// @param payToken The address of the token that's used for paying the minting fees. 0 for ether.
    /// @param receiver The address that receives the token.
    /// @param guildAction The action the credential is minted for.
    /// @param guildId The id to claim the token for.
    /// @param signedAt The timestamp marking the time when the data were signed.
    /// @param cid The cid used to construct the tokenURI for the token to be minted.
    /// @param signature The above parameters (except the payToken) signed by validSigner.
    function claim(
        address payToken,
        address receiver,
        GuildAction guildAction,
        uint256 guildId,
        uint256 signedAt,
        string calldata cid,
        bytes calldata signature
    ) external payable;

    /// @notice Burns a token from the sender.
    /// @param guildAction The action to which the token belongs to.
    /// @param guildId The id of the guild where the token belongs to.
    function burn(GuildAction guildAction, uint256 guildId) external;

    /// @notice Updates a minted token's URI.
    /// @dev Only callable by the owner of the token.
    /// @param tokenOwner The address that receives the token.
    /// @param guildAction The action the credential was minted for.
    /// @param guildId The id to claim the token for.
    /// @param signedAt The timestamp marking the time when the data were signed.
    /// @param newCid The new cid that points to the updated metadata.
    /// @param signature The above parameters signed by validSigner.
    function updateTokenURI(
        address tokenOwner,
        GuildAction guildAction,
        uint256 guildId,
        uint256 signedAt,
        string calldata newCid,
        bytes calldata signature
    ) external;

    /// @notice Event emitted whenever a claim succeeds.
    /// @param receiver The address that received the tokens.
    /// @param guildAction The action the credential was minted for.
    /// @param guildId The id the token has been claimed for.
    event Claimed(address indexed receiver, GuildAction indexed guildAction, uint256 indexed guildId);

    /// @notice Event emitted whenever a token's cid is updated.
    /// @param tokenId The id of the updated token.
    event TokenURIUpdated(uint256 tokenId);

    /// @notice Event emitted when the validSigner is changed.
    /// @param newValidSigner The new address of validSigner.
    event ValidSignerChanged(address newValidSigner);

    /// @notice Error thrown when the token is already claimed.
    error AlreadyClaimed();

    /// @notice Error thrown when the signature is already expired.
    error ExpiredSignature();

    /// @notice Error thrown when an incorrect amount of fee is attempted to be paid.
    /// @param paid The amount of funds received.
    /// @param requiredAmount The amount of fees required for minting.
    error IncorrectFee(uint256 paid, uint256 requiredAmount);

    /// @notice Error thrown when such a token is attempted to be used for paying that has no fee set.
    /// @dev The owner should set a fee for the token to solve this issue.
    /// @param token The address of the token that cannot be used.
    error IncorrectPayToken(address token);

    /// @notice Error thrown when the sender is not permitted to do a specific action.
    error IncorrectSender();

    /// @notice Error thrown when the supplied signature is invalid.
    error IncorrectSignature();

    /// @notice Error thrown when trying to query info about a token that's not (yet) minted.
    /// @param tokenId The queried id.
    error NonExistentToken(uint256 tokenId);
}

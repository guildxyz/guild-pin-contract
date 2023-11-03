// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title An NFT representing actions taken by Guild.xyz users.
interface IGuildPin {
    /// @notice Actions taken on Guild that can be rewarded with a pin.
    enum GuildAction {
        JOINED_GUILD,
        IS_OWNER,
        IS_ADMIN
    }

    /// @notice Guild-related data assigned to every token.
    struct PinData {
        address holder;
        GuildAction action;
        uint88 userId;
        string guildName;
        uint128 id; // guildId/roleId
        uint128 pinNumber;
        uint128 mintDate;
        uint128 createdAt;
    }

    /// @notice The same as {PinData}, but without the mintDate and the pinNumber, used as a function argument.
    struct PinDataParams {
        address receiver;
        GuildAction guildAction;
        uint256 userId;
        uint256 guildId; // guildId/roleId
        string guildName;
        uint256 createdAt;
    }

    /// @notice Pretty strings for GuildActions. Used for metadata.
    struct PinStrings {
        // "Joined", "Created", "Admin of"
        string actionName;
        // "This is an onchain proof that you joined",
        // "This is an onchain proof that you're the owner of",
        // "This is an onchain proof that you're an admin of",
        string description;
    }

    /// @notice Returns true if the address has already claimed their token.
    /// @param account The user's address.
    /// @param guildAction The action the pin was minted for.
    /// @param id The id of the guild or role the token was minted for.
    /// @return claimed Whether the address has claimed their token.
    function hasClaimed(address account, GuildAction guildAction, uint256 id) external view returns (bool claimed);

    /// @notice Whether a userId has minted a specific pin.
    /// @dev Used to prevent double mints in the same block.
    /// @param userId The id of the user on Guild.
    /// @param guildAction The action the pin was minted for.
    /// @param id The id of the guild or role the token was minted for.
    /// @return claimed Whether the userId has claimed the pin for the given action/guildId combination.
    function hasTheUserIdClaimed(
        uint256 userId,
        GuildAction guildAction,
        uint256 id
    ) external view returns (bool claimed);

    /// @notice The time interval while a signature is valid.
    /// @return validity The time interval in seconds.
    // solhint-disable func-name-mixedcase
    function SIGNATURE_VALIDITY() external pure returns (uint256 validity);

    /// @return signer The address that signs the metadata.
    function validSigner() external view returns (address signer);

    /// @notice Claims tokens to the given address.
    /// @dev The contract needs to be approved if ERC20 tokens are used.
    /// @param payToken The address of the token that's used for paying the minting fees. 0 for ether.
    /// @param pinData The Guild-related data, see {PinDataParams}.
    /// @param signedAt The timestamp marking the time when the data were signed.
    /// @param cid The cid used to construct the tokenURI for the token to be minted.
    /// @param signature The following signed by validSigner: pinData, signedAt, cid, chainId, the contract's address.
    function claim(
        address payToken,
        PinDataParams memory pinData,
        uint256 signedAt,
        string calldata cid,
        bytes calldata signature
    ) external payable;

    /// @notice Burns a token from the sender.
    /// @param userId The id of the user on Guild.
    /// @param guildAction The action to which the token belongs to.
    /// @param guildId The id of the guild where the token belongs to.
    function burn(uint256 userId, GuildAction guildAction, uint256 guildId) external;

    /// @notice Sets the address that signs the metadata.
    /// @dev Callable only by the owner.
    /// @param newValidSigner The new address of validSigner.
    function setValidSigner(address newValidSigner) external;

    /// @notice Updates a minted token's cid.
    /// @dev Callable only by the owner of the token.
    /// @param pinData The Guild-related data, see {PinDataParams}.
    /// @param signedAt The timestamp marking the time when the data were signed.
    /// @param newCid The new cid that points to the updated image.
    /// @param signature The following signed by validSigner: pinData, signedAt, cid, chainId, the contract's address.
    function updateImageURI(
        PinDataParams memory pinData,
        uint256 signedAt,
        string calldata newCid,
        bytes calldata signature
    ) external;

    /// @notice Set the pretty strings displayed in metadata for name and description.
    /// @dev Callable only by the owner.
    /// @param guildAction The action the strings are set for.
    /// @param pinStrings The strings to set. See {PinStrings}.
    function setPinStrings(GuildAction guildAction, PinStrings memory pinStrings) external;

    /// @notice Event emitted whenever a claim succeeds.
    /// @param receiver The address that received the tokens.
    /// @param guildAction The action the pin was minted for.
    /// @param guildId The id the token has been claimed for.
    event Claimed(address indexed receiver, GuildAction indexed guildAction, uint256 indexed guildId);

    /// @notice Event emitted when pretty strings are set for a GuildAction.
    /// @param guildAction The action whose strings were set.
    event PinStringsSet(GuildAction guildAction);

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

    /// @notice Error thrown when the sender is not permitted to do a specific action.
    error IncorrectSender();

    /// @notice Error thrown when the supplied signature is invalid.
    error IncorrectSignature();
}

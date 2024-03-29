//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { IGuildPin } from "./interfaces/IGuildPin.sol";
import { LibTransfer } from "./lib/LibTransfer.sol";
import { SoulboundERC721 } from "./token/SoulboundERC721.sol";
import { TreasuryManager } from "./utils/TreasuryManager.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { Base64Upgradeable } from "@openzeppelin/contracts-upgradeable/utils/Base64Upgradeable.sol";
import { ECDSAUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import { StringsUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

/// @title An NFT representing actions taken by Guild.xyz users.
contract GuildPin is IGuildPin, Initializable, OwnableUpgradeable, UUPSUpgradeable, SoulboundERC721, TreasuryManager {
    using ECDSAUpgradeable for bytes32;
    using StringsUpgradeable for address;
    using StringsUpgradeable for uint256;
    using LibTransfer for address;
    using LibTransfer for address payable;

    uint256 public constant SIGNATURE_VALIDITY = 1 hours;
    address public validSigner;

    /// @notice Maps the tokenIds to cids (for tokenURIs).
    mapping(uint256 tokenId => string cid) internal cids;

    /// @notice Maps the Guild-related parameters to a tokenId.
    mapping(address holder => mapping(GuildAction action => mapping(uint256 guildId => uint256 tokenId)))
        internal claimedTokens;

    /// @notice Maps the tokenIds to Guild-related parameters.
    mapping(uint256 tokenId => PinData pin) internal claimedTokensDetails;

    /// @notice Maps the guildIds to the amount of tokens minted in that guild.
    mapping(uint256 guildId => uint256 amountMinted) internal totalMintedPerGuild;

    /// @notice Maps the GuildAction enum to pretty strings for metadata.
    mapping(GuildAction action => PinStrings prettyStrings) internal guildActionPrettyNames;

    /// @notice The number of tokens minted in the first version of the contract.
    uint256 internal initialTokensMinted;

    /// @notice Maps whether a specific pin has been claimed to a userId.
    mapping(uint256 userId => mapping(GuildAction action => mapping(uint256 guildId => bool claimed)))
        internal claimerUserIds;

    /// @notice Empty space reserved for future updates.
    uint256[42] private __gap;

    /// @notice Sets metadata and the associated addresses.
    /// @param name The name of the token.
    /// @param symbol The symbol of the token.
    /// @param treasury The address where the collected fees will be sent.
    /// @param _validSigner The address that should sign the parameters for certain functions.
    function initialize(
        string memory name,
        string memory symbol,
        address payable treasury,
        address _validSigner
    ) public initializer {
        validSigner = _validSigner;
        __Ownable_init();
        __UUPSUpgradeable_init();
        __SoulboundERC721_init(name, symbol);
        __TreasuryManager_init(treasury);
    }

    // Note: the reInitialize function was last used with version 3
    // function reInitialize() public reinitializer(3) {}

    function claim(
        PinDataParams memory pinData,
        address payable adminTreasury,
        uint256 adminFee,
        uint256 signedAt,
        string calldata cid,
        bytes calldata signature
    ) external payable {
        if (signedAt < block.timestamp - SIGNATURE_VALIDITY) revert ExpiredSignature();
        if (
            claimedTokens[pinData.receiver][pinData.guildAction][pinData.guildId] != 0 ||
            claimerUserIds[pinData.userId][pinData.guildAction][pinData.guildId]
        ) revert AlreadyClaimed();
        if (!isValidSignature(pinData, adminTreasury, adminFee, signedAt, cid, signature)) revert IncorrectSignature();

        uint256 tokenId = totalSupply() + 1;

        unchecked {
            ++totalMintedPerGuild[pinData.guildId];
        }

        claimedTokens[pinData.receiver][pinData.guildAction][pinData.guildId] = tokenId;
        claimedTokensDetails[tokenId] = PinData(
            pinData.receiver,
            pinData.guildAction,
            uint88(pinData.userId),
            pinData.guildName,
            uint128(pinData.guildId),
            uint128(totalMintedPerGuild[pinData.guildId]),
            uint128(block.timestamp),
            uint128(pinData.createdAt)
        );
        cids[tokenId] = cid;
        claimerUserIds[pinData.userId][pinData.guildAction][pinData.guildId] = true;

        // Fee collection
        uint256 guildFee = fee;
        if (msg.value == guildFee + adminFee) {
            treasury.sendEther(guildFee);
            if (adminTreasury != address(0)) adminTreasury.sendEther(adminFee);
        } else revert IncorrectFee(msg.value, guildFee + adminFee);

        _safeMint(pinData.receiver, tokenId);

        emit Locked(tokenId);

        emit Claimed(pinData.receiver, pinData.guildAction, pinData.guildId);
    }

    function burn(uint256 userId, GuildAction guildAction, uint256 guildId) external {
        uint256 tokenId = claimedTokens[msg.sender][guildAction][guildId];

        claimedTokens[msg.sender][guildAction][guildId] = 0;
        delete claimedTokensDetails[tokenId];
        delete cids[tokenId];
        delete claimerUserIds[userId][guildAction][guildId];

        _burn(tokenId);
    }

    function setValidSigner(address newValidSigner) external onlyOwner {
        validSigner = newValidSigner;
        emit ValidSignerChanged(newValidSigner);
    }

    function updateImageURI(
        PinDataParams memory pinData,
        uint256 signedAt,
        string calldata newCid,
        bytes calldata signature
    ) external {
        if (signedAt < block.timestamp - SIGNATURE_VALIDITY) revert ExpiredSignature();
        if (!isValidSignature(pinData, payable(address(0)), 0, signedAt, newCid, signature))
            revert IncorrectSignature();

        uint256 tokenId = claimedTokens[pinData.receiver][pinData.guildAction][pinData.guildId];
        if (tokenId == 0) revert NonExistentToken(tokenId);

        cids[tokenId] = newCid;

        emit MetadataUpdate(tokenId);
    }

    function setPinStrings(GuildAction guildAction, PinStrings memory pinStrings) public onlyOwner {
        guildActionPrettyNames[guildAction] = pinStrings;
        emit PinStringsSet(guildAction);
    }

    function hasClaimed(address account, GuildAction guildAction, uint256 id) external view returns (bool claimed) {
        return claimedTokens[account][guildAction][id] != 0;
    }

    function hasTheUserIdClaimed(
        uint256 userId,
        GuildAction guildAction,
        uint256 id
    ) external view returns (bool claimed) {
        return claimerUserIds[userId][guildAction][id];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert NonExistentToken(tokenId);

        PinData memory pin = claimedTokensDetails[tokenId];

        // solhint-disable quotes
        string memory json = Base64Upgradeable.encode(
            bytes(
                string.concat(
                    '{"name": "',
                    guildActionPrettyNames[pin.action].actionName,
                    " ",
                    pin.guildName,
                    '", "description": "',
                    guildActionPrettyNames[pin.action].description,
                    " ",
                    pin.guildName,
                    ' on Guild.xyz.", "image": "ipfs://',
                    cids[tokenId],
                    '", "attributes": [',
                    ' { "trait_type": "type",',
                    ' "value": "',
                    guildActionPrettyNames[pin.action].actionName,
                    '"}, { "trait_type": "guildId",',
                    ' "value": "',
                    uint256(pin.id).toString(),
                    '" }, { "trait_type": "userId", "value": "',
                    uint256(pin.userId).toString(),
                    '" }, { "trait_type": "mintDate",',
                    ' "display_type": "date", "value": ',
                    uint256(pin.mintDate).toString(),
                    ' }, { "trait_type": "actionDate", "display_type": "date", "value": ',
                    uint256(pin.createdAt).toString(),
                    ' }, { "trait_type": "rank", "value": "',
                    tokenId > initialTokensMinted ? uint256(pin.pinNumber).toString() : tokenId.toString(),
                    '"} ] }'
                )
            )
        );
        // solhint-enable quotes

        return string.concat("data:application/json;base64,", json);
    }

    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /// @notice Checks the validity of the signature for the given params.
    function isValidSignature(
        PinDataParams memory pinData,
        address payable adminTreasury,
        uint256 adminFee,
        uint256 signedAt,
        string calldata cid,
        bytes calldata signature
    ) internal view returns (bool) {
        if (signature.length != 65) revert IncorrectSignature();
        bytes32 message = keccak256(
            abi.encode(
                pinData.receiver,
                pinData.guildAction,
                pinData.userId,
                pinData.guildId,
                pinData.guildName,
                pinData.createdAt,
                adminTreasury,
                adminFee,
                signedAt,
                cid,
                block.chainid,
                address(this)
            )
        ).toEthSignedMessageHash();
        return message.recover(signature) == validSigner;
    }
}

//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { IGuildCredential } from "./interfaces/IGuildCredential.sol";
import { LibTransfer } from "./lib/LibTransfer.sol";
import { SoulboundERC721 } from "./token/SoulboundERC721.sol";
import { TreasuryManager } from "./utils/TreasuryManager.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { ECDSAUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import { StringsUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

/// @title An NFT representing actions taken by Guild.xyz users.
contract GuildCredential is
    IGuildCredential,
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    SoulboundERC721,
    TreasuryManager
{
    using ECDSAUpgradeable for bytes32;
    using StringsUpgradeable for uint256;
    using LibTransfer for address;
    using LibTransfer for address payable;

    uint256 public constant SIGNATURE_VALIDITY = 1 hours;
    uint256 public totalSupply;
    address public validSigner;

    /// @notice Mapping tokenIds to cids (for tokenURIs).
    mapping(uint256 => string) internal cids;

    mapping(address => mapping(GuildAction => mapping(uint256 => uint256))) internal claimedTokens;

    /// @notice Empty space reserved for future updates.
    uint256[46] private __gap;

    /// @notice Sets metadata and the oracle details.
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

    function claim(
        address payToken,
        address receiver,
        GuildAction guildAction,
        uint256 guildId,
        uint256 signedAt,
        string calldata cid,
        bytes calldata signature
    ) external payable {
        if (signedAt < block.timestamp - SIGNATURE_VALIDITY) revert ExpiredSignature();
        if (claimedTokens[receiver][guildAction][guildId] != 0) revert AlreadyClaimed();
        if (!isValidSignature(receiver, guildAction, guildId, signedAt, cid, signature)) revert IncorrectSignature();

        uint256 fee = fee[payToken];
        if (fee == 0) revert IncorrectPayToken(payToken);

        uint256 tokenId = totalSupply + 1;

        claimedTokens[receiver][guildAction][guildId] = tokenId;
        cids[tokenId] = cid;

        // Fee collection
        // When there is no msg.value, try transferring ERC20
        // When there is msg.value, ensure it's the correct amount
        if (msg.value == 0) treasury.sendTokenFrom(msg.sender, payToken, fee);
        else if (msg.value != fee) revert IncorrectFee(msg.value, fee);
        else treasury.sendEther(fee);
        unchecked {
            ++totalSupply;
        }

        _safeMint(receiver, tokenId);

        emit Claimed(receiver, guildAction, guildId);
    }

    function burn(GuildAction guildAction, uint256 guildId) external {
        uint256 tokenId = claimedTokens[msg.sender][guildAction][guildId];

        claimedTokens[msg.sender][guildAction][guildId] = 0;
        delete cids[tokenId];
        unchecked {
            --totalSupply;
        }

        _burn(tokenId);
    }

    function setValidSigner(address newValidSigner) external onlyOwner {
        validSigner = newValidSigner;
        emit ValidSignerChanged(newValidSigner);
    }

    // TODO: remove or add signature validation here
    function updateTokenURI(uint256 tokenId, string calldata newCid) external {
        address owner = _ownerOf(tokenId);
        if (owner == address(0)) revert NonExistentToken(tokenId);
        if (owner != msg.sender) revert IncorrectSender();

        cids[tokenId] = newCid;

        emit TokenURIUpdated(tokenId);
    }

    function hasClaimed(address account, GuildAction guildAction, uint256 id) external view returns (bool claimed) {
        return claimedTokens[account][guildAction][id] != 0;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert NonExistentToken(tokenId);
        return string.concat("ipfs://", cids[tokenId]);
    }

    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /// @notice Checks the validity of the signature for the given params.
    function isValidSignature(
        address receiver,
        GuildAction guildAction,
        uint256 guildId,
        uint256 signedAt,
        string calldata cid,
        bytes calldata signature
    ) internal view returns (bool) {
        if (signature.length != 65) revert IncorrectSignature();
        bytes32 message = keccak256(abi.encodePacked(receiver, guildAction, guildId, signedAt, cid));
        return message.recover(signature) == validSigner;
    }
}

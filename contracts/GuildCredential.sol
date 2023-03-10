//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { GuildOracle } from "./GuildOracle.sol";
import { IGuildCredential } from "./interfaces/IGuildCredential.sol";
import { SoulboundERC721 } from "./token/SoulboundERC721.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { StringsUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title An NFT representing actions taken by Guild.xyz users.
contract GuildCredential is
    IGuildCredential,
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    GuildOracle,
    SoulboundERC721
{
    using StringsUpgradeable for uint256;

    uint256 public totalSupply;

    /// @notice The ipfs hash, under which the off-chain metadata is uploaded.
    string internal cid;

    mapping(address => mapping(GuildAction => mapping(uint256 => bool))) public hasClaimed;

    /// @notice Empty space reserved for future updates.
    uint256[47] private __gap;

    /// @notice Sets some of the details of the oracle.
    /// @param jobId The id of the job to run on the oracle.
    /// @param oracleFee The amount of tokens to forward to the oracle with every request.
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(bytes32 jobId, uint256 oracleFee) GuildOracle(jobId, oracleFee) {} // solhint-disable-line no-empty-blocks

    /// @notice Sets metadata and the oracle details.
    /// @param name The name of the token.
    /// @param symbol The symbol of the token.
    /// @param cid_ The ipfs hash, under which the off-chain metadata is uploaded.
    /// @param linkToken The address of the Chainlink token.
    /// @param oracleAddress The address of the oracle processing the requests.
    function initialize(
        string memory name,
        string memory symbol,
        string memory cid_,
        address linkToken,
        address oracleAddress
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __GuildOracle_init(linkToken, oracleAddress);
        __SoulboundERC721_init(name, symbol);
        cid = cid_;
    }

    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function claim(GuildAction guildAction, uint256 guildId) external {
        if (hasClaimed[msg.sender][guildAction][guildId]) revert AlreadyClaimed();

        uint256 tokenId = totalSupply;

        if (guildAction == GuildAction.JOINED_GUILD)
            requestGuildJoinCheck(
                msg.sender,
                guildId,
                this.fulfillClaim.selector,
                abi.encode(tokenId, msg.sender, GuildAction.JOINED_GUILD, guildId)
            );
        else if (guildAction == GuildAction.IS_OWNER)
            requestGuildOwnerCheck(
                msg.sender,
                guildId,
                this.fulfillClaim.selector,
                abi.encode(tokenId, msg.sender, GuildAction.IS_OWNER, guildId)
            );
        else if (guildAction == GuildAction.IS_ADMIN)
            requestGuildAdminCheck(
                msg.sender,
                guildId,
                this.fulfillClaim.selector,
                abi.encode(tokenId, msg.sender, GuildAction.IS_ADMIN, guildId)
            );

        emit ClaimRequested(msg.sender, guildAction, guildId);
    }

    /// @dev The actual claim function called by the oracle if the requirements are fulfilled.
    function fulfillClaim(bytes32 requestId, uint256 access) public checkResponse(requestId, access) {
        (uint256 tokenId, address receiver, GuildAction guildAction, uint256 id) = abi.decode(
            requests[requestId].args,
            (uint256, address, GuildAction, uint256)
        );

        hasClaimed[receiver][guildAction][id] = true;
        _safeMint(receiver, tokenId);

        emit Claimed(receiver, guildAction, id);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert NonExistentToken(tokenId);
        return string.concat("ipfs://", cid, "/", tokenId.toString(), ".json");
    }

    /// A version of {_safeMint} aware of total supply.
    function _safeMint(address to, uint256 tokenId) internal override {
        unchecked {
            ++totalSupply;
        }
        _safeMint(to, tokenId, "");
    }
}

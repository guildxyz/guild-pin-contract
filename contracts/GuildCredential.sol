//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { IGuildCredential } from "./interfaces/IGuildCredential.sol";
import { LibTransfer } from "./lib/LibTransfer.sol";
import { SoulboundERC721 } from "./token/SoulboundERC721.sol";
import { GuildOracle } from "./utils/GuildOracle.sol";
import { TreasuryManager } from "./utils/TreasuryManager.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { StringsUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

/// @title An NFT representing actions taken by Guild.xyz users.
contract GuildCredential is
    IGuildCredential,
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    GuildOracle,
    SoulboundERC721,
    TreasuryManager
{
    using StringsUpgradeable for uint256;
    using LibTransfer for address;
    using LibTransfer for address payable;

    uint256 public totalSupply;

    /// @notice The ipfs hash, under which the off-chain metadata is uploaded.
    string internal cid;

    mapping(address => mapping(GuildAction => mapping(uint256 => uint256))) internal claimedTokens;

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
    /// @param treasury The address where the collected fees will be sent.
    function initialize(
        string memory name,
        string memory symbol,
        string memory cid_,
        address linkToken,
        address oracleAddress,
        address payable treasury
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __GuildOracle_init(linkToken, oracleAddress);
        __SoulboundERC721_init(name, symbol);
        __TreasuryManager_init(treasury);
        cid = cid_;
    }

    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function claim(address payToken, GuildAction guildAction, uint256 guildId) external payable {
        if (claimedTokens[msg.sender][guildAction][guildId] != 0) revert AlreadyClaimed();

        uint256 fee = fee[payToken];
        if (fee == 0) revert IncorrectPayToken(payToken);

        if (guildAction == GuildAction.JOINED_GUILD)
            requestGuildJoinCheck(
                msg.sender,
                guildId,
                this.fulfillClaim.selector,
                abi.encode(msg.sender, GuildAction.JOINED_GUILD, guildId)
            );
        else if (guildAction == GuildAction.IS_OWNER)
            requestGuildOwnerCheck(
                msg.sender,
                guildId,
                this.fulfillClaim.selector,
                abi.encode(msg.sender, GuildAction.IS_OWNER, guildId)
            );
        else if (guildAction == GuildAction.IS_ADMIN)
            requestGuildAdminCheck(
                msg.sender,
                guildId,
                this.fulfillClaim.selector,
                abi.encode(msg.sender, GuildAction.IS_ADMIN, guildId)
            );

        // Fee collection
        // When there is no msg.value, try transferring ERC20
        // When there is msg.value, ensure it's the correct amount
        if (msg.value == 0) treasury.sendTokenFrom(msg.sender, payToken, fee);
        else if (msg.value != fee) revert IncorrectFee(msg.value, fee);
        else treasury.sendEther(fee);

        emit ClaimRequested(msg.sender, guildAction, guildId);
    }

    /// @dev The actual claim function called by the oracle if the requirements are fulfilled.
    function fulfillClaim(bytes32 requestId, uint256 access) public recordChainlinkFulfillment(requestId) {
        (address receiver, GuildAction guildAction, uint256 id) = abi.decode(
            requests[requestId].args,
            (address, GuildAction, uint256)
        );

        if (access != uint256(Access.ACCESS)) {
            if (access == uint256(Access.NO_ACCESS)) revert NoAccess(receiver);
            revert AccessCheckFailed(receiver);
        }

        uint256 tokenId = totalSupply + 1;

        claimedTokens[receiver][guildAction][id] = tokenId;
        unchecked {
            ++totalSupply;
        }

        _safeMint(receiver, tokenId);

        emit Claimed(receiver, guildAction, id);
    }

    function burn(GuildAction guildAction, uint256 guildId) external {
        uint256 tokenId = claimedTokens[msg.sender][guildAction][guildId];

        claimedTokens[msg.sender][guildAction][guildId] = 0;
        unchecked {
            --totalSupply;
        }

        _burn(tokenId);
    }

    function hasClaimed(address account, GuildAction guildAction, uint256 id) external view returns (bool claimed) {
        return claimedTokens[account][guildAction][id] != 0;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert NonExistentToken(tokenId);
        return string.concat("ipfs://", cid, "/", tokenId.toString(), ".json");
    }
}

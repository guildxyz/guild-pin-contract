// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { ERC721Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

/// @title A simple, soulbound ERC721.
contract SoulboundERC721 is ERC721Upgradeable {
    /// @notice Error thrown when a function's execution is not possible, because this is a soulbound NFT.
    error Soulbound();

    // solhint-disable-next-line func-name-mixedcase
    function __SoulboundERC721_init(string memory name_, string memory symbol_) internal onlyInitializing {
        __ERC721_init(name_, symbol_);
    }

    function approve(address /* to */, uint256 /* tokenId */) public virtual override {
        revert Soulbound();
    }

    function setApprovalForAll(address /* operator */, bool /* approved */) public virtual override {
        revert Soulbound();
    }

    function isApprovedForAll(address /* owner */, address /* operator */) public view virtual override returns (bool) {
        revert Soulbound();
    }

    function transferFrom(address /* from */, address /* to */, uint256 /* tokenId */) public virtual override {
        revert Soulbound();
    }

    function safeTransferFrom(address /* from */, address /* to */, uint256 /* tokenId */) public virtual override {
        revert Soulbound();
    }

    function safeTransferFrom(
        address /* from */,
        address /* to */,
        uint256 /* tokenId */,
        bytes memory /* data */
    ) public virtual override {
        revert Soulbound();
    }
}

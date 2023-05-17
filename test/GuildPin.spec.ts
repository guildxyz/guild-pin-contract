import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumberish, constants, Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";

enum GuildAction {
  JOINED_GUILD,
  IS_OWNER,
  IS_ADMIN
}

// NFT CONFIG
const name = "Guild Pin";
const symbol = "GUILD";
const cids = [
  "QmPaZD7i8TpLEeGjHtGoXe4mPKbRNNt8YTHH5nrKoqz9wJ",
  "QmcaGypWsmzaSQQGuExUjtyTRvZ2FF525Ww6PBNWWgkkLj",
  "Qmf1dCGhqRGvJXXd3epGMQiaPSDVFUGKiYG5ytwoRC9AcV",
  "QmWqBgw5kXdnXHs4KGNUjZcBDbSrwCG7wzt55sSfvtCwvd",
  "QmW5sPVbZDueZwvSuibteAwDFwFXhF8gebfptGBx1DZq1j"
];
const fee = ethers.utils.parseEther("0.1");

// CONTRACTS
let mockERC20: Contract;
let GuildPin: ContractFactory;
let pin: Contract;

// Test accounts
let wallet0: SignerWithAddress;
let randomWallet: SignerWithAddress;
let treasury: SignerWithAddress;
let signer: SignerWithAddress;

const sampleJoinDate = 1682582503;
const sampleUserId = 42;
const sampleGuildId = 1985;
const sampleGuildName = "Our Guild";
let samplePinData: {
  receiver: string;
  guildAction: GuildAction;
  userId: number;
  guildId: number;
  guildName: string;
  createdAt: number;
};

const pinStrings = (action: GuildAction) => {
  const actionNames = ["Joined", "Created", "Admin of"];
  const descriptions = [
    "This is an on-chain proof that you joined",
    "This is an on-chain proof that you're the owner of",
    "This is an on-chain proof that you're an admin of"
  ];
  return {
    actionName: actionNames[action],
    description: descriptions[action]
  };
};

const createSignature = async (
  wallet: SignerWithAddress,
  receiver: string,
  guildAction: GuildAction,
  userId: BigNumberish,
  guildId: BigNumberish,
  guildName: string,
  createdAt: BigNumberish,
  signedAt: BigNumberish,
  cid: string
) => {
  const payload = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint8", "uint256", "uint256", "string", "uint256", "uint256", "string"],
    [receiver, guildAction, userId, guildId, guildName, createdAt, signedAt, cid]
  );
  const payloadHash = ethers.utils.keccak256(payload);
  return wallet.signMessage(ethers.utils.arrayify(payloadHash));
};

const decodeTokenURI = (tokenURI: string) => Buffer.from(tokenURI.slice(29), "base64").toString("utf-8");

describe("GuildPin", () => {
  before("get accounts", async () => {
    [wallet0, randomWallet, treasury, signer] = await ethers.getSigners();

    samplePinData = {
      receiver: wallet0.address,
      guildAction: GuildAction.JOINED_GUILD,
      userId: sampleUserId,
      guildId: sampleGuildId,
      guildName: sampleGuildName,
      createdAt: sampleJoinDate
    };

    const ERC20 = await ethers.getContractFactory("MockERC20");
    mockERC20 = await ERC20.deploy("Mock Token", "MCK");
    mockERC20.mint(wallet0.address, ethers.utils.parseEther("100"));
  });

  beforeEach("deploy contract", async () => {
    GuildPin = await ethers.getContractFactory("GuildPin");
    pin = await upgrades.deployProxy(GuildPin, [name, symbol, treasury.address, signer.address], {
      kind: "uups"
    });
    await pin.deployed();

    pin.setFee(constants.AddressZero, fee);
    pin.setFee(mockERC20.address, fee);
  });

  it("should have initialized the state variables", async () => {
    expect(await pin.name()).to.eq(name);
    expect(await pin.symbol()).to.eq(symbol);
    expect(await pin.owner()).to.eq(wallet0.address);
    expect(await pin.treasury()).to.eq(treasury.address);
    expect(await pin.validSigner()).to.eq(signer.address);
  });

  it("should be upgradeable", async () => {
    const newName = "Guild Super Cool Pin";
    const newSymbol = "GUILDPIN";
    const upgraded = await upgrades.upgradeProxy(pin.address, GuildPin, {
      kind: "uups",
      call: { fn: "reInitialize", args: [newName, newSymbol] }
    });

    expect(await upgraded.name()).to.eq(newName);
    expect(await upgraded.symbol()).to.eq(newSymbol);
    expect(await upgraded.owner()).to.eq(wallet0.address);
    expect(await pin.treasury()).to.eq(treasury.address);
  });

  it("should be soulbound", async () => {
    await expect(pin.approve(wallet0.address, 0)).to.be.revertedWithCustomError(GuildPin, "Soulbound");
    await expect(pin.setApprovalForAll(wallet0.address, true)).to.be.revertedWithCustomError(GuildPin, "Soulbound");
    await expect(pin.isApprovedForAll(wallet0.address, randomWallet.address)).to.be.revertedWithCustomError(
      GuildPin,
      "Soulbound"
    );
    await expect(pin.transferFrom(wallet0.address, randomWallet.address, 0)).to.be.revertedWithCustomError(
      GuildPin,
      "Soulbound"
    );
    await expect(
      pin["safeTransferFrom(address,address,uint256)"](wallet0.address, randomWallet.address, 0)
    ).to.be.revertedWithCustomError(GuildPin, "Soulbound");
    await expect(
      pin["safeTransferFrom(address,address,uint256,bytes)"](
        wallet0.address,
        randomWallet.address,
        0,
        constants.HashZero
      )
    ).to.be.revertedWithCustomError(GuildPin, "Soulbound");
  });

  context("Treasury management", () => {
    context("#setFee", () => {
      it("should revert if a token's fee is attempted to be changed by anyone but the owner", async () => {
        await expect(pin.connect(randomWallet).setFee(constants.AddressZero, 12)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
      });

      it("should change the tokens' fees", async () => {
        const mockFee0 = await pin.fee(mockERC20.address);
        await pin.setFee(mockERC20.address, 69);
        const mockFee1 = await pin.fee(mockERC20.address);
        expect(mockFee0).to.not.eq(mockFee1);
        expect(mockFee1).to.eq(69);
      });

      it("should emit FeeChanged event", async () => {
        const token = randomWallet.address;
        const newFee = 42;
        await expect(pin.setFee(token, newFee)).to.emit(pin, "FeeChanged").withArgs(token, newFee);
      });
    });

    context("#setTreasury", () => {
      it("should revert if the treasury is attempted to be changed by anyone but the owner", async () => {
        await expect(pin.connect(randomWallet).setTreasury(randomWallet.address)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
      });

      it("should change the treasury address", async () => {
        const treasury0 = await pin.treasury();
        await pin.setTreasury(randomWallet.address);
        const treasury1 = await pin.treasury();
        expect(treasury0).to.not.eq(treasury1);
        expect(treasury1).to.eq(randomWallet.address);
      });

      it("should emit TreasuryChanged event", async () => {
        await expect(pin.setTreasury(randomWallet.address))
          .to.emit(pin, "TreasuryChanged")
          .withArgs(randomWallet.address);
      });
    });
  });

  context("Claiming and burning", () => {
    let timestamp: number;
    let sampleSignature: string;

    before("get time, create signature", async () => {
      timestamp = Math.floor(Date.now() / 1000);
      sampleSignature = await createSignature(
        signer,
        wallet0.address,
        GuildAction.JOINED_GUILD,
        sampleUserId,
        sampleGuildId,
        sampleGuildName,
        sampleJoinDate,
        timestamp,
        cids[0]
      );
    });

    context("#claim", () => {
      it("should revert if the signature is expired", async () => {
        const validity = await pin.SIGNATURE_VALIDITY();
        const oldTimestamp = Math.floor(Date.now() / 1000) - validity - 10;
        const signature = await createSignature(
          signer,
          wallet0.address,
          GuildAction.JOINED_GUILD,
          sampleUserId,
          sampleGuildId,
          sampleGuildName,
          sampleJoinDate,
          oldTimestamp,
          cids[0]
        );
        await expect(
          pin.claim(constants.AddressZero, samplePinData, oldTimestamp, cids[0], signature, { value: fee })
        ).to.be.revertedWithCustomError(pin, "ExpiredSignature");
      });

      it("should revert if the address has already claimed", async () => {
        await pin.claim(constants.AddressZero, samplePinData, timestamp, cids[0], sampleSignature, {
          value: fee
        });
        await expect(
          pin.claim(constants.AddressZero, samplePinData, timestamp, cids[0], sampleSignature, { value: fee })
        ).to.be.revertedWithCustomError(pin, "AlreadyClaimed");
      });

      it("should revert if the signature is incorrect", async () => {
        await expect(
          pin.claim(constants.AddressZero, samplePinData, timestamp, cids[0], constants.HashZero, {
            value: fee
          })
        ).to.be.revertedWithCustomError(pin, "IncorrectSignature");

        await expect(
          pin.claim(constants.AddressZero, samplePinData, timestamp, cids[0], sampleSignature.slice(0, -2), {
            value: fee
          })
        ).to.be.revertedWithCustomError(pin, "IncorrectSignature");

        await expect(
          pin.claim(
            constants.AddressZero,
            samplePinData,
            timestamp,
            cids[0],
            await createSignature(
              signer,
              wallet0.address,
              GuildAction.IS_ADMIN,
              sampleUserId,
              sampleGuildId,
              sampleGuildName,
              sampleJoinDate,
              timestamp,
              cids[0]
            ),
            { value: fee }
          )
        ).to.be.revertedWithCustomError(pin, "IncorrectSignature");
      });

      it("should revert if the token has no fees set", async () => {
        await expect(pin.claim(randomWallet.address, samplePinData, timestamp, cids[0], sampleSignature))
          .to.be.revertedWithCustomError(pin, "IncorrectPayToken")
          .withArgs(randomWallet.address);
      });

      it("should increment the total supply", async () => {
        const totalSupply0 = await pin.totalSupply();
        await pin.claim(constants.AddressZero, samplePinData, timestamp, cids[0], sampleSignature, {
          value: fee
        });
        const totalSupply1 = await pin.totalSupply();
        expect(totalSupply1).to.eq(totalSupply0.add(1));
      });

      it("should set the address's claim status", async () => {
        await pin.claim(constants.AddressZero, samplePinData, timestamp, cids[0], sampleSignature, {
          value: fee
        });
        expect(await pin.hasClaimed(wallet0.address, GuildAction.JOINED_GUILD, sampleGuildId)).to.eq(true);
      });

      it("should be able to mint tokens for the same reason to different addresses", async () => {
        const tx0 = await pin.claim(constants.AddressZero, samplePinData, timestamp, cids[0], sampleSignature, {
          value: fee
        });
        const res0 = await tx0.wait();
        expect(res0.status).to.equal(1);

        const signature = await createSignature(
          signer,
          randomWallet.address,
          GuildAction.JOINED_GUILD,
          sampleUserId,
          sampleGuildId,
          sampleGuildName,
          sampleJoinDate,
          timestamp,
          cids[0]
        );
        const tx1 = await pin.claim(
          constants.AddressZero,
          {
            receiver: randomWallet.address,
            guildAction: GuildAction.JOINED_GUILD,
            userId: sampleUserId,
            guildId: sampleGuildId,
            guildName: sampleGuildName,
            createdAt: sampleJoinDate
          },
          timestamp,
          cids[0],
          signature,
          { value: fee }
        );
        const res1 = await tx1.wait();
        expect(res1.status).to.equal(1);
      });

      it("should be able to mint tokens for the same address for different reasons", async () => {
        const tx0 = await pin.claim(constants.AddressZero, samplePinData, timestamp, cids[0], sampleSignature, {
          value: fee
        });
        const res0 = await tx0.wait();
        expect(res0.status).to.equal(1);

        const signature1 = await createSignature(
          signer,
          wallet0.address,
          GuildAction.IS_OWNER,
          sampleUserId,
          sampleGuildId,
          sampleGuildName,
          sampleJoinDate,
          timestamp,
          cids[0]
        );
        const tx1 = await pin.claim(
          constants.AddressZero,
          {
            receiver: wallet0.address,
            guildAction: GuildAction.IS_OWNER,
            userId: sampleUserId,
            guildId: sampleGuildId,
            guildName: sampleGuildName,
            createdAt: sampleJoinDate
          },
          timestamp,
          cids[0],
          signature1,
          { value: fee }
        );
        const res1 = await tx1.wait();
        expect(res1.status).to.equal(1);

        const signature2 = await createSignature(
          signer,
          wallet0.address,
          GuildAction.IS_ADMIN,
          sampleUserId,
          sampleGuildId,
          sampleGuildName,
          sampleJoinDate,
          timestamp,
          cids[0]
        );
        const tx2 = await pin.claim(
          constants.AddressZero,
          {
            receiver: wallet0.address,
            guildAction: GuildAction.IS_ADMIN,
            userId: sampleUserId,
            guildId: sampleGuildId,
            guildName: sampleGuildName,
            createdAt: sampleJoinDate
          },
          timestamp,
          cids[0],
          signature2,
          { value: fee }
        );
        const res2 = await tx2.wait();
        expect(res2.status).to.equal(1);
      });

      it("should revert when an ERC20 transfer silently fails", async () => {
        const BadERC20 = await ethers.getContractFactory("MockBadERC20");
        const mockBadERC20 = await BadERC20.deploy("Mock Token", "MCK");
        mockBadERC20.mint(wallet0.address, ethers.utils.parseEther("100"));
        await mockBadERC20.approve(pin.address, constants.MaxUint256);
        pin.setFee(mockBadERC20.address, fee);

        await expect(pin.claim(mockBadERC20.address, samplePinData, timestamp, cids[0], sampleSignature))
          .to.be.revertedWithCustomError(pin, "TransferFailed")
          .withArgs(wallet0.address, pin.address);
      });

      it("should transfer ERC20 when there is no msg.value", async () => {
        await mockERC20.approve(pin.address, constants.MaxUint256);
        await expect(
          pin.claim(mockERC20.address, samplePinData, timestamp, cids[0], sampleSignature)
        ).to.changeTokenBalances(mockERC20, [wallet0, treasury], [fee.mul(-1), fee]);
      });

      it("should revert if an incorrect msg.value is received", async () => {
        await expect(
          pin.claim(constants.AddressZero, samplePinData, timestamp, cids[0], sampleSignature, {
            value: fee.mul(2)
          })
        )
          .to.be.revertedWithCustomError(pin, "IncorrectFee")
          .withArgs(fee.mul(2), fee);

        await expect(
          pin.claim(constants.AddressZero, samplePinData, timestamp, cids[0], sampleSignature, {
            value: fee.div(2)
          })
        )
          .to.be.revertedWithCustomError(pin, "IncorrectFee")
          .withArgs(fee.div(2), fee);
      });

      it("should transfer ether to treasury", async () => {
        await expect(
          pin.claim(constants.AddressZero, samplePinData, timestamp, cids[0], sampleSignature, { value: fee })
        ).to.changeEtherBalances([wallet0, treasury], [fee.mul(-1), fee]);
      });

      it("should mint the token", async () => {
        const totalSupply = await pin.totalSupply();
        const tokenId = totalSupply.add(1);
        expect(await pin.balanceOf(wallet0.address)).to.eq(0);
        await expect(pin.ownerOf(tokenId)).to.be.revertedWith("ERC721: invalid token ID");
        await pin.claim(constants.AddressZero, samplePinData, timestamp, cids[0], sampleSignature, {
          value: fee
        });
        expect(await pin.balanceOf(wallet0.address)).to.eq(1);
        expect(await pin.ownerOf(tokenId)).to.eq(wallet0.address);
      });

      it("should emit Claimed event", async () => {
        await expect(
          pin.claim(constants.AddressZero, samplePinData, timestamp, cids[0], sampleSignature, { value: fee })
        )
          .to.emit(pin, "Claimed")
          .withArgs(wallet0.address, GuildAction.JOINED_GUILD, sampleGuildId);
      });
    });

    context("#burn", () => {
      beforeEach("claim a token", async () => {
        await pin.claim(constants.AddressZero, samplePinData, timestamp, cids[0], sampleSignature, {
          value: fee
        });
      });

      it("should reset hasClaimed to false", async () => {
        const hasClaimed0 = await pin.hasClaimed(wallet0.address, GuildAction.JOINED_GUILD, sampleGuildId);
        await pin.burn(GuildAction.JOINED_GUILD, sampleGuildId);
        const hasClaimed1 = await pin.hasClaimed(wallet0.address, GuildAction.JOINED_GUILD, sampleGuildId);
        expect(hasClaimed0).to.eq(true);
        expect(hasClaimed1).to.eq(false);
      });

      it("should decrement the total supply", async () => {
        const totalSupply0 = await pin.totalSupply();
        await pin.burn(GuildAction.JOINED_GUILD, sampleGuildId);
        const totalSupply1 = await pin.totalSupply();
        expect(totalSupply1).to.eq(totalSupply0.sub(1));
      });

      it("should burn the token", async () => {
        await expect(pin.burn(GuildAction.JOINED_GUILD, sampleGuildId)).to.changeTokenBalance(pin, wallet0, -1);
      });
    });
  });

  context("TokenURI", () => {
    let timestamp: number;
    let signature: string;

    before("get time, create signature", async () => {
      timestamp = Math.floor(Date.now() / 1000);
      signature = await createSignature(
        signer,
        wallet0.address,
        GuildAction.JOINED_GUILD,
        sampleUserId,
        sampleGuildId,
        sampleGuildName,
        sampleJoinDate,
        timestamp,
        cids[0]
      );
    });

    beforeEach("set strings", async () => {
      await pin.setPinStrings(GuildAction.JOINED_GUILD, pinStrings(GuildAction.JOINED_GUILD));
      await pin.setPinStrings(GuildAction.IS_OWNER, pinStrings(GuildAction.IS_OWNER));
      await pin.setPinStrings(GuildAction.IS_ADMIN, pinStrings(GuildAction.IS_ADMIN));
    });

    context("#tokenURI", () => {
      it("should revert when trying to get the tokenURI for a non-existent token", async () => {
        await expect(pin.tokenURI(84)).to.revertedWithCustomError(pin, "NonExistentToken").withArgs(84);
      });

      it("should include the pretty strings", async () => {
        await pin.claim(constants.AddressZero, samplePinData, timestamp, cids[0], signature, { value: fee });
        const tokenURI = await pin.tokenURI(1);
        const decodedTokenURI = decodeTokenURI(tokenURI);
        console.log(decodedTokenURI);
        expect(decodedTokenURI).to.contain(`"name": "Joined ${sampleGuildName}"`);
        expect(decodedTokenURI).to.contain(
          `"description": "This is an on-chain proof that you joined ${sampleGuildName} on Guild.xyz."`
        );
      });

      it("should return the correct tokenURI", async () => {
        const claimees = await ethers.getSigners();
        /* eslint-disable no-await-in-loop */
        for (let i = 0; i < cids.length; i += 1) {
          const userId = sampleUserId + i;
          const signaturei = await createSignature(
            signer,
            claimees[i].address,
            GuildAction.JOINED_GUILD,
            userId,
            sampleGuildId,
            sampleGuildName,
            sampleJoinDate,
            timestamp,
            cids[i]
          );
          await pin.claim(
            constants.AddressZero,
            {
              receiver: claimees[i].address,
              guildAction: GuildAction.JOINED_GUILD,
              userId,
              guildId: sampleGuildId,
              guildName: sampleGuildName,
              createdAt: sampleJoinDate
            },
            timestamp,
            cids[i],
            signaturei,
            {
              value: fee
            }
          );
          const tokenURI = await pin.tokenURI(i + 1);
          const decodedTokenURI = decodeTokenURI(tokenURI);
          expect(decodedTokenURI).to.contain(userId);
          expect(decodedTokenURI).to.contain(cids[i]);
          expect(decodedTokenURI).to.contain(`"rank", "value": "${i + 1}"`);
        }
        /* eslint-enable no-await-in-loop */
      });
    });

    context("#updateImageURI", () => {
      beforeEach("claim a token", async () => {
        await pin.claim(constants.AddressZero, samplePinData, timestamp, cids[0], signature, { value: fee });
      });

      it("should revert if the signature is expired", async () => {
        const validity = await pin.SIGNATURE_VALIDITY();
        const oldTimestamp = Math.floor(Date.now() / 1000) - validity - 10;
        await expect(pin.updateImageURI(samplePinData, oldTimestamp, cids[0], signature)).to.be.revertedWithCustomError(
          pin,
          "ExpiredSignature"
        );
      });

      it("should revert if the signature is incorrect", async () => {
        await expect(
          pin.updateImageURI(samplePinData, timestamp, cids[0], constants.HashZero)
        ).to.be.revertedWithCustomError(pin, "IncorrectSignature");

        await expect(
          pin.updateImageURI(samplePinData, timestamp, cids[0], signature.slice(0, -2))
        ).to.be.revertedWithCustomError(pin, "IncorrectSignature");

        await expect(
          pin.updateImageURI(
            samplePinData,
            timestamp,
            cids[0],
            await createSignature(
              signer,
              wallet0.address,
              GuildAction.IS_ADMIN,
              sampleUserId,
              sampleGuildId,
              sampleGuildName,
              sampleJoinDate,
              timestamp,
              cids[0]
            )
          )
        ).to.be.revertedWithCustomError(pin, "IncorrectSignature");
      });

      it("should revert if the token is not yet minted", async () => {
        const altSignature = await createSignature(
          signer,
          wallet0.address,
          GuildAction.JOINED_GUILD,
          sampleUserId,
          1986,
          sampleGuildName,
          sampleJoinDate,
          timestamp,
          cids[0]
        );
        await expect(
          pin.updateImageURI(
            {
              receiver: wallet0.address,
              guildAction: GuildAction.JOINED_GUILD,
              userId: sampleUserId,
              guildId: 1986,
              guildName: sampleGuildName,
              createdAt: sampleJoinDate
            },
            timestamp,
            cids[0],
            altSignature
          )
        )
          .to.be.revertedWithCustomError(pin, "NonExistentToken")
          .withArgs(0);
      });

      it("should update cid", async () => {
        const oldTokenURI = await pin.tokenURI(1);
        await pin.updateImageURI(
          samplePinData,
          timestamp,
          cids[1],
          await createSignature(
            signer,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            sampleUserId,
            sampleGuildId,
            sampleGuildName,
            sampleJoinDate,
            timestamp,
            cids[1]
          )
        );
        const newTokenURI = await pin.tokenURI(1);
        expect(newTokenURI).to.not.eq(oldTokenURI);
        expect(decodeTokenURI(newTokenURI)).to.contain(cids[1]);
      });

      it("should emit TokenURIUpdated event", async () => {
        await expect(pin.updateImageURI(samplePinData, timestamp, cids[0], signature))
          .to.emit(pin, "TokenURIUpdated")
          .withArgs(1);
      });
    });
  });

  context("#setValidSigner", () => {
    it("should revert if the valid signer is attempted to be changed by anyone but the owner", async () => {
      await expect(pin.connect(randomWallet).setValidSigner(randomWallet.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should change the valid signer's address", async () => {
      const validSigner0 = await pin.validSigner();
      await pin.setValidSigner(randomWallet.address);
      const validSigner1 = await pin.validSigner();
      expect(validSigner1).to.not.eq(validSigner0);
      expect(validSigner1).to.eq(randomWallet.address);
    });

    it("should emit ValidSignerChanged event", async () => {
      await expect(pin.setValidSigner(randomWallet.address))
        .to.emit(pin, "ValidSignerChanged")
        .withArgs(randomWallet.address);
    });
  });
});

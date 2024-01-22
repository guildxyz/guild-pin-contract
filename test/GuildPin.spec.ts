import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumberish, Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";

enum GuildAction {
  JOINED_GUILD,
  IS_OWNER,
  IS_ADMIN
}

// NFT config
const name = "Guild Pin";
const symbol = "GUILD";
const cids = [
  "QmPaZD7i8TpLEeGjHtGoXe4mPKbRNNt8YTHH5nrKoqz9wJ",
  "QmcaGypWsmzaSQQGuExUjtyTRvZ2FF525Ww6PBNWWgkkLj",
  "Qmf1dCGhqRGvJXXd3epGMQiaPSDVFUGKiYG5ytwoRC9AcV",
  "QmWqBgw5kXdnXHs4KGNUjZcBDbSrwCG7wzt55sSfvtCwvd",
  "QmW5sPVbZDueZwvSuibteAwDFwFXhF8gebfptGBx1DZq1j"
];
const fee = ethers.parseEther("0.1");
const adminFee = ethers.parseEther("0.05");

// Contract
let GuildPin: ContractFactory;
let pin: Contract;

// Test accounts
let wallet0: SignerWithAddress;
let randomWallet: SignerWithAddress;
let treasury: SignerWithAddress;
let adminTreasury: SignerWithAddress;
let signer: SignerWithAddress;

// Sample Pin data
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

let chainId: BigNumberish;

const pinStrings = (action: GuildAction) => {
  const actionNames = ["Joined", "Created", "Admin of"];
  const descriptions = [
    "This is an onchain proof that you joined",
    "This is an onchain proof that you're the owner of",
    "This is an onchain proof that you're an admin of"
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
  adminTreasuryAddress: string,
  adminFeeAmount: BigNumberish,
  signedAt: BigNumberish,
  cid: string,
  chainid: BigNumberish,
  pinAddress: string
) => {
  const payload = ethers.AbiCoder.defaultAbiCoder().encode(
    [
      "address",
      "uint8",
      "uint256",
      "uint256",
      "string",
      "uint256",
      "address payable",
      "uint256",
      "uint256",
      "string",
      "uint256",
      "address"
    ],
    [
      receiver,
      guildAction,
      userId,
      guildId,
      guildName,
      createdAt,
      adminTreasuryAddress,
      adminFeeAmount,
      signedAt,
      cid,
      chainid,
      pinAddress
    ]
  );
  const payloadHash = ethers.keccak256(payload);
  return wallet.signMessage(ethers.getBytes(payloadHash));
};

const decodeTokenURI = (tokenURI: string) => Buffer.from(tokenURI.slice(29), "base64").toString("utf-8");

describe("GuildPin", () => {
  before("get accounts, setup variables", async () => {
    [wallet0, randomWallet, treasury, adminTreasury, signer] = await ethers.getSigners();

    samplePinData = {
      receiver: wallet0.address,
      guildAction: GuildAction.JOINED_GUILD,
      userId: sampleUserId,
      guildId: sampleGuildId,
      guildName: sampleGuildName,
      createdAt: sampleJoinDate
    };

    chainId = (await ethers.provider.getNetwork()).chainId;
  });

  beforeEach("deploy contract", async () => {
    GuildPin = await ethers.getContractFactory("GuildPin");
    pin = await upgrades.deployProxy(GuildPin, [name, symbol, treasury.address, signer.address], {
      kind: "uups"
    });
    await pin.waitForDeployment();

    pin.setFee(fee);
  });

  it("should have initialized the state variables", async () => {
    expect(await pin.name()).to.eq(name);
    expect(await pin.symbol()).to.eq(symbol);
    expect(await pin.owner()).to.eq(wallet0.address);
    expect(await pin.treasury()).to.eq(treasury.address);
    expect(await pin.validSigner()).to.eq(signer.address);
  });

  it("should be upgradeable", async () => {
    const upgraded = await upgrades.upgradeProxy(pin, GuildPin, {
      kind: "uups"
      // call: { fn: "reInitialize", args: [] }
    });

    expect(await upgraded.name()).to.eq(name);
    expect(await upgraded.symbol()).to.eq(symbol);
    expect(await upgraded.owner()).to.eq(wallet0.address);
    expect(await upgraded.treasury()).to.eq(treasury.address);
  });

  context("Soulbound", () => {
    let timestamp: number;
    let signature: string;

    before("get time", () => {
      timestamp = Math.floor(Date.now() / 1000);
    });

    beforeEach("create signature, set strings", async () => {
      await pin.setPinStrings(GuildAction.JOINED_GUILD, pinStrings(GuildAction.JOINED_GUILD));
      await pin.setPinStrings(GuildAction.IS_OWNER, pinStrings(GuildAction.IS_OWNER));
      await pin.setPinStrings(GuildAction.IS_ADMIN, pinStrings(GuildAction.IS_ADMIN));

      signature = await createSignature(
        signer,
        wallet0.address,
        GuildAction.JOINED_GUILD,
        sampleUserId,
        sampleGuildId,
        sampleGuildName,
        sampleJoinDate,
        adminTreasury.address,
        adminFee,
        timestamp,
        cids[0],
        chainId,
        await pin.getAddress()
      );
    });

    it("should support ERC5192 interface", async () => {
      expect(await pin.supportsInterface("0xb45a3c0e")).to.eq(true);
    });

    it("should revert if approval/transfer-related functions are called", async () => {
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
          ethers.ZeroHash
        )
      ).to.be.revertedWithCustomError(GuildPin, "Soulbound");
    });

    it("should have a locked function that throws for not minted tokens", async () => {
      const tokenId = 1;
      await expect(pin.locked(tokenId)).to.be.revertedWithCustomError(GuildPin, "NonExistentToken").withArgs(tokenId);
    });

    it("should have a locked function that returns true for minted tokens", async () => {
      await pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], signature, { value: fee + adminFee });
      expect(await pin.locked(1)).to.eq(true);
    });

    it("should emit Locked event when minting", async () => {
      const tokenId = (await pin.totalSupply()) + 1n;
      await expect(
        pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], signature, { value: fee + adminFee })
      )
        .to.emit(pin, "Locked")
        .withArgs(tokenId);
    });
  });

  context("Treasury management", () => {
    context("#setFee", () => {
      it("should revert if the fee is attempted to be changed by anyone but the owner", async () => {
        await expect((pin.connect(randomWallet) as Contract).setFee(12)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
      });

      it("should change the fee", async () => {
        const mockFee0 = await pin.fee();
        await pin.setFee(69);
        const mockFee1 = await pin.fee();
        expect(mockFee0).to.not.eq(mockFee1);
        expect(mockFee1).to.eq(69);
      });

      it("should emit FeeChanged event", async () => {
        const newFee = 42;
        await expect(pin.setFee(newFee)).to.emit(pin, "FeeChanged").withArgs(newFee);
      });
    });

    context("#setTreasury", () => {
      it("should revert if the treasury is attempted to be changed by anyone but the owner", async () => {
        await expect((pin.connect(randomWallet) as Contract).setTreasury(randomWallet.address)).to.be.revertedWith(
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

    before("get time", () => {
      timestamp = Math.floor(Date.now() / 1000);
    });

    beforeEach("create signature", async () => {
      sampleSignature = await createSignature(
        signer,
        wallet0.address,
        GuildAction.JOINED_GUILD,
        sampleUserId,
        sampleGuildId,
        sampleGuildName,
        sampleJoinDate,
        adminTreasury.address,
        adminFee,
        timestamp,
        cids[0],
        chainId,
        await pin.getAddress()
      );
    });

    context("#claim", () => {
      it("should revert if the signature is expired", async () => {
        const validity = await pin.SIGNATURE_VALIDITY();
        const oldTimestamp = Math.floor(Date.now() / 1000) - Number(validity) - 10;
        const signature = await createSignature(
          signer,
          wallet0.address,
          GuildAction.JOINED_GUILD,
          sampleUserId,
          sampleGuildId,
          sampleGuildName,
          sampleJoinDate,
          adminTreasury.address,
          adminFee,
          oldTimestamp,
          cids[0],
          chainId,
          await pin.getAddress()
        );
        await expect(
          pin.claim(samplePinData, adminTreasury, adminFee, oldTimestamp, cids[0], signature, { value: fee + adminFee })
        ).to.be.revertedWithCustomError(pin, "ExpiredSignature");
      });

      it("should revert if the address has already claimed", async () => {
        await pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], sampleSignature, {
          value: fee + adminFee
        });
        await expect(
          pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], sampleSignature, {
            value: fee + adminFee
          })
        ).to.be.revertedWithCustomError(pin, "AlreadyClaimed");
      });

      it("should revert if the userId has already claimed", async () => {
        await pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], sampleSignature, {
          value: fee + adminFee
        });

        const signature = await createSignature(
          signer,
          randomWallet.address,
          GuildAction.JOINED_GUILD,
          sampleUserId,
          sampleGuildId,
          sampleGuildName,
          sampleJoinDate,
          adminTreasury.address,
          adminFee,
          timestamp,
          cids[0],
          chainId,
          await pin.getAddress()
        );
        const tx = pin.claim(
          {
            receiver: randomWallet.address,
            guildAction: GuildAction.JOINED_GUILD,
            userId: sampleUserId,
            guildId: sampleGuildId,
            guildName: sampleGuildName,
            createdAt: sampleJoinDate
          },
          adminTreasury,
          adminFee,
          timestamp,
          cids[0],
          signature,
          { value: fee + adminFee }
        );

        await expect(tx).to.be.revertedWithCustomError(pin, "AlreadyClaimed");
      });

      it("should revert if the signature is incorrect", async () => {
        await expect(
          pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], ethers.ZeroHash, {
            value: fee + adminFee
          })
        ).to.be.revertedWithCustomError(pin, "IncorrectSignature");

        await expect(
          pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], sampleSignature.slice(0, -2), {
            value: fee + adminFee
          })
        ).to.be.revertedWithCustomError(pin, "IncorrectSignature");

        await expect(
          pin.claim(
            samplePinData,
            adminTreasury,
            adminFee,
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
              adminTreasury.address,
              adminFee,
              timestamp,
              cids[0],
              chainId,
              await pin.getAddress()
            ),
            { value: fee + adminFee }
          )
        ).to.be.revertedWithCustomError(pin, "IncorrectSignature");
      });

      it("should increment the total supply", async () => {
        const totalSupply0 = await pin.totalSupply();
        await pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], sampleSignature, {
          value: fee + adminFee
        });
        const totalSupply1 = await pin.totalSupply();
        expect(totalSupply1).to.eq(totalSupply0 + 1n);
      });

      it("should set the address's claim status", async () => {
        const hasClaimed0 = await pin.hasClaimed(wallet0.address, GuildAction.JOINED_GUILD, sampleGuildId);
        await pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], sampleSignature, {
          value: fee + adminFee
        });
        const hasClaimed1 = await pin.hasClaimed(wallet0.address, GuildAction.JOINED_GUILD, sampleGuildId);
        expect(hasClaimed0).to.eq(false);
        expect(hasClaimed1).to.eq(true);
      });

      it("should set the userId's claim status", async () => {
        const hasTheUserIdClaimed0 = await pin.hasTheUserIdClaimed(
          sampleUserId,
          GuildAction.JOINED_GUILD,
          sampleGuildId
        );
        await pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], sampleSignature, {
          value: fee + adminFee
        });
        const hasTheUserIdClaimed1 = await pin.hasTheUserIdClaimed(
          sampleUserId,
          GuildAction.JOINED_GUILD,
          sampleGuildId
        );
        expect(hasTheUserIdClaimed0).to.eq(false);
        expect(hasTheUserIdClaimed1).to.eq(true);
      });

      it("should be able to mint tokens for the same reason to different addresses", async () => {
        const tx0 = await pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], sampleSignature, {
          value: fee + adminFee
        });
        const res0 = await tx0.wait();
        expect(res0.status).to.equal(1);

        const signature = await createSignature(
          signer,
          randomWallet.address,
          GuildAction.JOINED_GUILD,
          sampleUserId + 1,
          sampleGuildId,
          sampleGuildName,
          sampleJoinDate,
          adminTreasury.address,
          adminFee,
          timestamp,
          cids[0],
          chainId,
          await pin.getAddress()
        );
        const tx1 = await pin.claim(
          {
            receiver: randomWallet.address,
            guildAction: GuildAction.JOINED_GUILD,
            userId: sampleUserId + 1,
            guildId: sampleGuildId,
            guildName: sampleGuildName,
            createdAt: sampleJoinDate
          },
          adminTreasury,
          adminFee,
          timestamp,
          cids[0],
          signature,
          { value: fee + adminFee }
        );
        const res1 = await tx1.wait();
        expect(res1.status).to.equal(1);
      });

      it("should be able to mint tokens for the same address for different reasons", async () => {
        const tx0 = await pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], sampleSignature, {
          value: fee + adminFee
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
          adminTreasury.address,
          adminFee,
          timestamp,
          cids[0],
          chainId,
          await pin.getAddress()
        );
        const tx1 = await pin.claim(
          {
            receiver: wallet0.address,
            guildAction: GuildAction.IS_OWNER,
            userId: sampleUserId,
            guildId: sampleGuildId,
            guildName: sampleGuildName,
            createdAt: sampleJoinDate
          },
          adminTreasury,
          adminFee,
          timestamp,
          cids[0],
          signature1,
          { value: fee + adminFee }
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
          adminTreasury.address,
          adminFee,
          timestamp,
          cids[0],
          chainId,
          await pin.getAddress()
        );
        const tx2 = await pin.claim(
          {
            receiver: wallet0.address,
            guildAction: GuildAction.IS_ADMIN,
            userId: sampleUserId,
            guildId: sampleGuildId,
            guildName: sampleGuildName,
            createdAt: sampleJoinDate
          },
          adminTreasury,
          adminFee,
          timestamp,
          cids[0],
          signature2,
          { value: fee + adminFee }
        );
        const res2 = await tx2.wait();
        expect(res2.status).to.equal(1);
      });

      it("should revert if an incorrect msg.value is received", async () => {
        await expect(
          pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], sampleSignature, {
            value: (fee + adminFee) * 2n
          })
        )
          .to.be.revertedWithCustomError(pin, "IncorrectFee")
          .withArgs((fee + adminFee) * 2n, fee + adminFee);
      });

      it("should transfer ether to treasury", async () => {
        await expect(
          pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], sampleSignature, {
            value: fee + adminFee
          })
        ).to.changeEtherBalances([wallet0, treasury, adminTreasury], [(fee + adminFee) * -1n, fee, adminFee]);
      });

      it("should mint the token", async () => {
        const totalSupply = await pin.totalSupply();
        const tokenId = totalSupply + 1n;
        expect(await pin.balanceOf(wallet0.address)).to.eq(0);
        await expect(pin.ownerOf(tokenId)).to.be.revertedWith("ERC721: invalid token ID");
        await pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], sampleSignature, {
          value: fee + adminFee
        });
        expect(await pin.balanceOf(wallet0.address)).to.eq(1);
        expect(await pin.ownerOf(tokenId)).to.eq(wallet0.address);
      });

      it("should emit Claimed event", async () => {
        await expect(
          pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], sampleSignature, {
            value: fee + adminFee
          })
        )
          .to.emit(pin, "Claimed")
          .withArgs(wallet0.address, GuildAction.JOINED_GUILD, sampleGuildId);
      });
    });

    context("#burn", () => {
      beforeEach("claim a token", async () => {
        await pin.claim(samplePinData, adminTreasury, adminFee, timestamp, cids[0], sampleSignature, {
          value: fee + adminFee
        });
      });

      it("should revert when trying to burn a non-existent token", async () => {
        const guildId = sampleGuildId + 1;
        const hasClaimed = await pin.hasClaimed(wallet0.address, GuildAction.JOINED_GUILD, guildId);
        expect(hasClaimed).to.eq(false);
        await expect(pin.burn(sampleUserId, GuildAction.JOINED_GUILD, guildId)).to.be.revertedWith(
          "ERC721: invalid token ID"
        );
      });

      it("should reset hasClaimed to false", async () => {
        const hasClaimed0 = await pin.hasClaimed(wallet0.address, GuildAction.JOINED_GUILD, sampleGuildId);
        await pin.burn(sampleUserId, GuildAction.JOINED_GUILD, sampleGuildId);
        const hasClaimed1 = await pin.hasClaimed(wallet0.address, GuildAction.JOINED_GUILD, sampleGuildId);
        expect(hasClaimed0).to.eq(true);
        expect(hasClaimed1).to.eq(false);
      });

      it("should reset hasTheUserIdClaimed to false", async () => {
        const hasTheUserIdClaimed0 = await pin.hasTheUserIdClaimed(
          sampleUserId,
          GuildAction.JOINED_GUILD,
          sampleGuildId
        );
        await pin.burn(sampleUserId, GuildAction.JOINED_GUILD, sampleGuildId);
        const hasTheUserIdClaimed1 = await pin.hasTheUserIdClaimed(
          sampleUserId,
          GuildAction.JOINED_GUILD,
          sampleGuildId
        );
        expect(hasTheUserIdClaimed0).to.eq(true);
        expect(hasTheUserIdClaimed1).to.eq(false);
      });

      it("should decrement the total supply", async () => {
        const totalSupply0 = await pin.totalSupply();
        await pin.burn(sampleUserId, GuildAction.JOINED_GUILD, sampleGuildId);
        const totalSupply1 = await pin.totalSupply();
        expect(totalSupply1).to.eq(totalSupply0 - 1n);
      });

      it("should burn the token", async () => {
        await expect(pin.burn(sampleUserId, GuildAction.JOINED_GUILD, sampleGuildId)).to.changeTokenBalance(
          pin,
          wallet0,
          -1
        );
      });
    });
  });

  context("TokenURI", () => {
    let timestamp: number;

    before("get time", () => {
      timestamp = Math.floor(Date.now() / 1000);
    });

    beforeEach("create signature, set strings", async () => {
      await pin.setPinStrings(GuildAction.JOINED_GUILD, pinStrings(GuildAction.JOINED_GUILD));
      await pin.setPinStrings(GuildAction.IS_OWNER, pinStrings(GuildAction.IS_OWNER));
      await pin.setPinStrings(GuildAction.IS_ADMIN, pinStrings(GuildAction.IS_ADMIN));
    });

    context("#tokenURI", () => {
      it("should revert when trying to get the tokenURI for a non-existent token", async () => {
        await expect(pin.tokenURI(84)).to.be.revertedWithCustomError(pin, "NonExistentToken").withArgs(84);
      });

      it("should include the pretty strings", async () => {
        await pin.claim(
          samplePinData,
          adminTreasury,
          adminFee,
          timestamp,
          cids[0],
          await createSignature(
            signer,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            sampleUserId,
            sampleGuildId,
            sampleGuildName,
            sampleJoinDate,
            adminTreasury.address,
            adminFee,
            timestamp,
            cids[0],
            chainId,
            await pin.getAddress()
          ),
          {
            value: fee + adminFee
          }
        );
        const tokenURI = await pin.tokenURI(1);
        const decodedTokenURI = decodeTokenURI(tokenURI);
        expect(decodedTokenURI).to.contain(`"name": "Joined ${sampleGuildName}"`);
        expect(decodedTokenURI).to.contain(
          `"description": "This is an onchain proof that you joined ${sampleGuildName} on Guild.xyz."`
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
            adminTreasury.address,
            adminFee,
            timestamp,
            cids[i],
            chainId,
            await pin.getAddress()
          );
          await pin.claim(
            {
              receiver: claimees[i].address,
              guildAction: GuildAction.JOINED_GUILD,
              userId,
              guildId: sampleGuildId,
              guildName: sampleGuildName,
              createdAt: sampleJoinDate
            },
            adminTreasury,
            adminFee,
            timestamp,
            cids[i],
            signaturei,
            {
              value: fee + adminFee
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
      let signature: string;

      beforeEach("claim a token", async () => {
        await pin.claim(
          samplePinData,
          adminTreasury,
          adminFee,
          timestamp,
          cids[0],
          await createSignature(
            signer,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            sampleUserId,
            sampleGuildId,
            sampleGuildName,
            sampleJoinDate,
            adminTreasury.address,
            adminFee,
            timestamp,
            cids[0],
            chainId,
            await pin.getAddress()
          ),
          {
            value: fee + adminFee
          }
        );

        signature = await createSignature(
          signer,
          wallet0.address,
          GuildAction.JOINED_GUILD,
          sampleUserId,
          sampleGuildId,
          sampleGuildName,
          sampleJoinDate,
          ethers.ZeroAddress,
          0,
          timestamp,
          cids[0],
          chainId,
          await pin.getAddress()
        );
      });

      it("should revert if the signature is expired", async () => {
        const validity = await pin.SIGNATURE_VALIDITY();
        const oldTimestamp = Math.floor(Date.now() / 1000) - Number(validity) - 10;
        await expect(pin.updateImageURI(samplePinData, oldTimestamp, cids[0], signature)).to.be.revertedWithCustomError(
          pin,
          "ExpiredSignature"
        );
      });

      it("should revert if the signature is incorrect", async () => {
        await expect(
          pin.updateImageURI(samplePinData, timestamp, cids[0], ethers.ZeroHash)
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
              adminTreasury.address,
              adminFee,
              timestamp,
              cids[0],
              chainId,
              await pin.getAddress()
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
          ethers.ZeroAddress,
          0,
          timestamp,
          cids[0],
          chainId,
          await pin.getAddress()
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

      it("should support ERC4906", async () => {
        expect(await pin.supportsInterface("0x49064906")).to.eq(true);
      });

      it("should update cid", async () => {
        const altSignature = await createSignature(
          signer,
          wallet0.address,
          GuildAction.JOINED_GUILD,
          sampleUserId,
          sampleGuildId,
          sampleGuildName,
          sampleJoinDate,
          ethers.ZeroAddress,
          0,
          timestamp,
          cids[1],
          chainId,
          await pin.getAddress()
        );

        const oldTokenURI = await pin.tokenURI(1);
        await pin.updateImageURI(samplePinData, timestamp, cids[1], altSignature);
        const newTokenURI = await pin.tokenURI(1);

        expect(newTokenURI).to.not.eq(oldTokenURI);
        expect(decodeTokenURI(newTokenURI)).to.contain(cids[1]);
      });

      it("should emit MetadataUpdate event", async () => {
        await expect(pin.updateImageURI(samplePinData, timestamp, cids[0], signature))
          .to.emit(pin, "MetadataUpdate")
          .withArgs(1);
      });
    });
  });

  context("#setValidSigner", () => {
    it("should revert if the valid signer is attempted to be changed by anyone but the owner", async () => {
      await expect((pin.connect(randomWallet) as Contract).setValidSigner(randomWallet.address)).to.be.revertedWith(
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

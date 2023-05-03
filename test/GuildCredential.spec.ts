import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumberish, constants, Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";

// NFT CONFIG
const name = "GuildCredential";
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
let GuildCredential: ContractFactory;
let credential: Contract;

// Test accounts
let wallet0: SignerWithAddress;
let randomWallet: SignerWithAddress;
let treasury: SignerWithAddress;
let signer: SignerWithAddress;

enum GuildAction {
  JOINED_GUILD,
  IS_OWNER,
  IS_ADMIN
}

const createSignature = async (
  wallet: SignerWithAddress,
  receiver: string,
  guildAction: GuildAction,
  guildId: BigNumberish,
  signedAt: BigNumberish,
  cid: string
) => {
  const payload = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint8", "uint256", "uint256", "string"],
    [receiver, guildAction, guildId, signedAt, cid]
  );
  const payloadHash = ethers.utils.keccak256(payload);
  return wallet.signMessage(ethers.utils.arrayify(payloadHash));
};

describe("GuildCredential", () => {
  before("get accounts", async () => {
    [wallet0, randomWallet, treasury, signer] = await ethers.getSigners();

    const ERC20 = await ethers.getContractFactory("MockERC20");
    mockERC20 = await ERC20.deploy("Mock Token", "MCK");
    mockERC20.mint(wallet0.address, ethers.utils.parseEther("100"));
  });

  beforeEach("deploy contract", async () => {
    GuildCredential = await ethers.getContractFactory("GuildCredential");
    credential = await upgrades.deployProxy(GuildCredential, [name, symbol, treasury.address, signer.address], {
      kind: "uups"
    });
    await credential.deployed();

    credential.setFee(constants.AddressZero, fee);
    credential.setFee(mockERC20.address, fee);
  });

  it("should have initialized the state variables", async () => {
    expect(await credential.name()).to.eq(name);
    expect(await credential.symbol()).to.eq(symbol);
    expect(await credential.owner()).to.eq(wallet0.address);
    expect(await credential.treasury()).to.eq(treasury.address);
    expect(await credential.validSigner()).to.eq(signer.address);
  });

  it("should be upgradeable", async () => {
    const upgraded = await upgrades.upgradeProxy(credential.address, GuildCredential, {
      kind: "uups"
    });

    expect(await upgraded.name()).to.eq(name);
    expect(await upgraded.symbol()).to.eq(symbol);
    expect(await upgraded.owner()).to.eq(wallet0.address);
    expect(await credential.treasury()).to.eq(treasury.address);
  });

  it("should be soulbound", async () => {
    await expect(credential.approve(wallet0.address, 0)).to.be.revertedWithCustomError(GuildCredential, "Soulbound");
    await expect(credential.setApprovalForAll(wallet0.address, true)).to.be.revertedWithCustomError(
      GuildCredential,
      "Soulbound"
    );
    await expect(credential.isApprovedForAll(wallet0.address, randomWallet.address)).to.be.revertedWithCustomError(
      GuildCredential,
      "Soulbound"
    );
    await expect(credential.transferFrom(wallet0.address, randomWallet.address, 0)).to.be.revertedWithCustomError(
      GuildCredential,
      "Soulbound"
    );
    await expect(
      credential["safeTransferFrom(address,address,uint256)"](wallet0.address, randomWallet.address, 0)
    ).to.be.revertedWithCustomError(GuildCredential, "Soulbound");
    await expect(
      credential["safeTransferFrom(address,address,uint256,bytes)"](
        wallet0.address,
        randomWallet.address,
        0,
        constants.HashZero
      )
    ).to.be.revertedWithCustomError(GuildCredential, "Soulbound");
  });

  it("should return all token ids owned by an address", async () => {
    const timestamp = Math.floor(Date.now() / 1000);

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < cids.length; i += 1) {
      const signaturei = await createSignature(
        signer,
        wallet0.address,
        GuildAction.JOINED_GUILD,
        1985 + i,
        timestamp,
        cids[i]
      );
      await credential.claim(
        constants.AddressZero,
        wallet0.address,
        GuildAction.JOINED_GUILD,
        1985 + i,
        timestamp,
        cids[i],
        signaturei,
        {
          value: fee
        }
      );
    }
    /* eslint-enable no-await-in-loop */

    expect(await credential.tokensOfOwner(wallet0.address)).to.deep.eq([1, 2, 3, 4, 5]);
  });

  context("Treasury management", () => {
    context("#setFee", () => {
      it("should revert if a token's fee is attempted to be changed by anyone but the owner", async () => {
        await expect(credential.connect(randomWallet).setFee(constants.AddressZero, 12)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
      });

      it("should change the tokens' fees", async () => {
        const mockFee0 = await credential.fee(mockERC20.address);
        await credential.setFee(mockERC20.address, 69);
        const mockFee1 = await credential.fee(mockERC20.address);
        expect(mockFee0).to.not.eq(mockFee1);
        expect(mockFee1).to.eq(69);
      });

      it("should emit FeeChanged event", async () => {
        const token = randomWallet.address;
        const newFee = 42;
        await expect(credential.setFee(token, newFee)).to.emit(credential, "FeeChanged").withArgs(token, newFee);
      });
    });

    context("#setTreasury", () => {
      it("should revert if the treasury is attempted to be changed by anyone but the owner", async () => {
        await expect(credential.connect(randomWallet).setTreasury(randomWallet.address)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
      });

      it("should change the treasury address", async () => {
        const treasury0 = await credential.treasury();
        await credential.setTreasury(randomWallet.address);
        const treasury1 = await credential.treasury();
        expect(treasury0).to.not.eq(treasury1);
        expect(treasury1).to.eq(randomWallet.address);
      });

      it("should emit TreasuryChanged event", async () => {
        await expect(credential.setTreasury(randomWallet.address))
          .to.emit(credential, "TreasuryChanged")
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
        1985,
        timestamp,
        cids[0]
      );
    });

    context("#claim", () => {
      it("should revert if the signature is expired", async () => {
        const validity = await credential.SIGNATURE_VALIDITY();
        const oldTimestamp = Math.floor(Date.now() / 1000) - validity - 10;
        const signature = await createSignature(
          signer,
          wallet0.address,
          GuildAction.JOINED_GUILD,
          1985,
          oldTimestamp,
          cids[0]
        );
        await expect(
          credential.claim(
            constants.AddressZero,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985,
            oldTimestamp,
            cids[0],
            signature,
            { value: fee }
          )
        ).to.be.revertedWithCustomError(credential, "ExpiredSignature");
      });

      it("should revert if the address has already claimed", async () => {
        await credential.claim(
          constants.AddressZero,
          wallet0.address,
          GuildAction.JOINED_GUILD,
          1985,
          timestamp,
          cids[0],
          sampleSignature,
          { value: fee }
        );
        await expect(
          credential.claim(
            constants.AddressZero,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985,
            timestamp,
            cids[0],
            sampleSignature,
            { value: fee }
          )
        ).to.be.revertedWithCustomError(credential, "AlreadyClaimed");
      });

      it("should revert if the signature is incorrect", async () => {
        await expect(
          credential.claim(
            constants.AddressZero,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985,
            timestamp,
            cids[0],
            constants.HashZero,
            { value: fee }
          )
        ).to.be.revertedWithCustomError(credential, "IncorrectSignature");

        await expect(
          credential.claim(
            constants.AddressZero,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985,
            timestamp,
            cids[0],
            sampleSignature.slice(0, -2),
            { value: fee }
          )
        ).to.be.revertedWithCustomError(credential, "IncorrectSignature");

        await expect(
          credential.claim(
            constants.AddressZero,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985,
            timestamp,
            cids[0],
            await createSignature(signer, wallet0.address, GuildAction.IS_ADMIN, 1985, timestamp, cids[0]),
            { value: fee }
          )
        ).to.be.revertedWithCustomError(credential, "IncorrectSignature");
      });

      it("should revert if the token has no fees set", async () => {
        await expect(
          credential.claim(
            randomWallet.address,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985,
            timestamp,
            cids[0],
            sampleSignature
          )
        )
          .to.be.revertedWithCustomError(credential, "IncorrectPayToken")
          .withArgs(randomWallet.address);
      });

      it("should increment the total supply", async () => {
        const totalSupply0 = await credential.totalSupply();
        await credential.claim(
          constants.AddressZero,
          wallet0.address,
          GuildAction.JOINED_GUILD,
          1985,
          timestamp,
          cids[0],
          sampleSignature,
          { value: fee }
        );
        const totalSupply1 = await credential.totalSupply();
        expect(totalSupply1).to.eq(totalSupply0.add(1));
      });

      it("should set the address's claim status", async () => {
        await credential.claim(
          constants.AddressZero,
          wallet0.address,
          GuildAction.JOINED_GUILD,
          1985,
          timestamp,
          cids[0],
          sampleSignature,
          { value: fee }
        );
        expect(await credential.hasClaimed(wallet0.address, GuildAction.JOINED_GUILD, 1985)).to.eq(true);
      });

      it("should be able to mint tokens for the same reason to different addresses", async () => {
        const tx0 = await credential.claim(
          constants.AddressZero,
          wallet0.address,
          GuildAction.JOINED_GUILD,
          1985,
          timestamp,
          cids[0],
          sampleSignature,
          {
            value: fee
          }
        );
        const res0 = await tx0.wait();
        expect(res0.status).to.equal(1);

        const signature = await createSignature(
          signer,
          randomWallet.address,
          GuildAction.JOINED_GUILD,
          1985,
          timestamp,
          cids[0]
        );
        const tx1 = await credential.claim(
          constants.AddressZero,
          randomWallet.address,
          GuildAction.JOINED_GUILD,
          1985,
          timestamp,
          cids[0],
          signature,
          { value: fee }
        );
        const res1 = await tx1.wait();
        expect(res1.status).to.equal(1);
      });

      it("should be able to mint tokens for the same address for different reasons", async () => {
        const tx0 = await credential.claim(
          constants.AddressZero,
          wallet0.address,
          GuildAction.JOINED_GUILD,
          1985,
          timestamp,
          cids[0],
          sampleSignature,
          {
            value: fee
          }
        );
        const res0 = await tx0.wait();
        expect(res0.status).to.equal(1);

        const signature1 = await createSignature(
          signer,
          wallet0.address,
          GuildAction.IS_OWNER,
          1985,
          timestamp,
          cids[0]
        );
        const tx1 = await credential.claim(
          constants.AddressZero,
          wallet0.address,
          GuildAction.IS_OWNER,
          1985,
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
          1985,
          timestamp,
          cids[0]
        );
        const tx2 = await credential.claim(
          constants.AddressZero,
          wallet0.address,
          GuildAction.IS_ADMIN,
          1985,
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
        await mockBadERC20.approve(credential.address, constants.MaxUint256);
        credential.setFee(mockBadERC20.address, fee);

        await expect(
          credential.claim(
            mockBadERC20.address,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985,
            timestamp,
            cids[0],
            sampleSignature
          )
        )
          .to.be.revertedWithCustomError(credential, "TransferFailed")
          .withArgs(wallet0.address, credential.address);
      });

      it("should transfer ERC20 when there is no msg.value", async () => {
        await mockERC20.approve(credential.address, constants.MaxUint256);
        await expect(
          credential.claim(
            mockERC20.address,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985,
            timestamp,
            cids[0],
            sampleSignature
          )
        ).to.changeTokenBalances(mockERC20, [wallet0, treasury], [fee.mul(-1), fee]);
      });

      it("should revert if an incorrect msg.value is received", async () => {
        await expect(
          credential.claim(
            constants.AddressZero,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985,
            timestamp,
            cids[0],
            sampleSignature,
            { value: fee.mul(2) }
          )
        )
          .to.be.revertedWithCustomError(credential, "IncorrectFee")
          .withArgs(fee.mul(2), fee);

        await expect(
          credential.claim(
            constants.AddressZero,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985,
            timestamp,
            cids[0],
            sampleSignature,
            { value: fee.div(2) }
          )
        )
          .to.be.revertedWithCustomError(credential, "IncorrectFee")
          .withArgs(fee.div(2), fee);
      });

      it("should transfer ether to treasury", async () => {
        await expect(
          credential.claim(
            constants.AddressZero,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985,
            timestamp,
            cids[0],
            sampleSignature,
            { value: fee }
          )
        ).to.changeEtherBalances([wallet0, treasury], [fee.mul(-1), fee]);
      });

      it("should mint the token", async () => {
        const totalSupply = await credential.totalSupply();
        const tokenId = totalSupply.add(1);
        expect(await credential.balanceOf(wallet0.address)).to.eq(0);
        await expect(credential.ownerOf(tokenId)).to.be.revertedWith("ERC721: invalid token ID");
        await credential.claim(
          constants.AddressZero,
          wallet0.address,
          GuildAction.JOINED_GUILD,
          1985,
          timestamp,
          cids[0],
          sampleSignature,
          { value: fee }
        );
        expect(await credential.balanceOf(wallet0.address)).to.eq(1);
        expect(await credential.ownerOf(tokenId)).to.eq(wallet0.address);
      });

      it("should emit Claimed event", async () => {
        await expect(
          credential.claim(
            constants.AddressZero,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985,
            timestamp,
            cids[0],
            sampleSignature,
            { value: fee }
          )
        )
          .to.emit(credential, "Claimed")
          .withArgs(wallet0.address, GuildAction.JOINED_GUILD, 1985);
      });
    });

    context("#burn", () => {
      beforeEach("claim a token", async () => {
        await credential.claim(
          constants.AddressZero,
          wallet0.address,
          GuildAction.JOINED_GUILD,
          1985,
          timestamp,
          cids[0],
          sampleSignature,
          { value: fee }
        );
      });

      it("should reset hasClaimed to false", async () => {
        const hasClaimed0 = await credential.hasClaimed(wallet0.address, GuildAction.JOINED_GUILD, 1985);
        await credential.burn(GuildAction.JOINED_GUILD, 1985);
        const hasClaimed1 = await credential.hasClaimed(wallet0.address, GuildAction.JOINED_GUILD, 1985);
        expect(hasClaimed0).to.eq(true);
        expect(hasClaimed1).to.eq(false);
      });

      it("should decrement the total supply", async () => {
        const totalSupply0 = await credential.totalSupply();
        await credential.burn(GuildAction.JOINED_GUILD, 1985);
        const totalSupply1 = await credential.totalSupply();
        expect(totalSupply1).to.eq(totalSupply0.sub(1));
      });

      it("should burn the token", async () => {
        await expect(credential.burn(GuildAction.JOINED_GUILD, 1985)).to.changeTokenBalance(credential, wallet0, -1);
      });
    });
  });

  context("TokenURI", () => {
    let timestamp: number;
    let signature: string;

    before("get time, create signature", async () => {
      timestamp = Math.floor(Date.now() / 1000);
      signature = await createSignature(signer, wallet0.address, GuildAction.JOINED_GUILD, 1985, timestamp, cids[0]);
    });

    context("#tokenURI", () => {
      it("should revert when trying to get the tokenURI for a non-existent token", async () => {
        await expect(credential.tokenURI(84)).to.revertedWithCustomError(credential, "NonExistentToken").withArgs(84);
      });

      it("should return the correct tokenURI", async () => {
        /* eslint-disable no-await-in-loop */
        for (let i = 0; i < cids.length; i += 1) {
          const signaturei = await createSignature(
            signer,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985 + i,
            timestamp,
            cids[i]
          );
          await credential.claim(
            constants.AddressZero,
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985 + i,
            timestamp,
            cids[i],
            signaturei,
            {
              value: fee
            }
          );
          const regex = new RegExp(`ipfs://${cids[i]}`);
          expect(regex.test(await credential.tokenURI(i + 1))).to.eq(true);
        }
        /* eslint-enable no-await-in-loop */
      });
    });

    context("#updateTokenURI", () => {
      beforeEach("claim a token", async () => {
        await credential.claim(
          constants.AddressZero,
          wallet0.address,
          GuildAction.JOINED_GUILD,
          1985,
          timestamp,
          cids[0],
          signature,
          { value: fee }
        );
      });

      it("should revert if the signature is expired", async () => {
        const validity = await credential.SIGNATURE_VALIDITY();
        const oldTimestamp = Math.floor(Date.now() / 1000) - validity - 10;
        await expect(
          credential.updateTokenURI(wallet0.address, GuildAction.JOINED_GUILD, 1985, oldTimestamp, cids[0], signature)
        ).to.be.revertedWithCustomError(credential, "ExpiredSignature");
      });

      it("should revert if the signature is incorrect", async () => {
        await expect(
          credential.updateTokenURI(
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985,
            timestamp,
            cids[0],
            constants.HashZero
          )
        ).to.be.revertedWithCustomError(credential, "IncorrectSignature");

        await expect(
          credential.updateTokenURI(
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985,
            timestamp,
            cids[0],
            signature.slice(0, -2)
          )
        ).to.be.revertedWithCustomError(credential, "IncorrectSignature");

        await expect(
          credential.updateTokenURI(
            wallet0.address,
            GuildAction.JOINED_GUILD,
            1985,
            timestamp,
            cids[0],
            await createSignature(signer, wallet0.address, GuildAction.IS_ADMIN, 1985, timestamp, cids[0])
          )
        ).to.be.revertedWithCustomError(credential, "IncorrectSignature");
      });

      it("should revert if the token is not yet minted", async () => {
        const altSignature = await createSignature(
          signer,
          wallet0.address,
          GuildAction.JOINED_GUILD,
          1986,
          timestamp,
          cids[0]
        );
        await expect(
          credential.updateTokenURI(wallet0.address, GuildAction.JOINED_GUILD, 1986, timestamp, cids[0], altSignature)
        )
          .to.be.revertedWithCustomError(credential, "NonExistentToken")
          .withArgs(0);
      });

      it("should update cid", async () => {
        const oldTokenURI = await credential.tokenURI(1);
        await credential.updateTokenURI(
          wallet0.address,
          GuildAction.JOINED_GUILD,
          1985,
          timestamp,
          cids[1],
          await createSignature(signer, wallet0.address, GuildAction.JOINED_GUILD, 1985, timestamp, cids[1])
        );
        const newTokenURI = await credential.tokenURI(1);
        expect(newTokenURI).to.not.eq(oldTokenURI);
        expect(newTokenURI).to.contain(cids[1]);
      });

      it("should emit TokenURIUpdated event", async () => {
        await expect(
          credential.updateTokenURI(wallet0.address, GuildAction.JOINED_GUILD, 1985, timestamp, cids[0], signature)
        )
          .to.emit(credential, "TokenURIUpdated")
          .withArgs(1);
      });
    });
  });

  context("#setValidSigner", () => {
    it("should revert if the valid signer is attempted to be changed by anyone but the owner", async () => {
      await expect(credential.connect(randomWallet).setValidSigner(randomWallet.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should change the valid signer's address", async () => {
      const validSigner0 = await credential.validSigner();
      await credential.setValidSigner(randomWallet.address);
      const validSigner1 = await credential.validSigner();
      expect(validSigner1).to.not.eq(validSigner0);
      expect(validSigner1).to.eq(randomWallet.address);
    });

    it("should emit ValidSignerChanged event", async () => {
      await expect(credential.setValidSigner(randomWallet.address))
        .to.emit(credential, "ValidSignerChanged")
        .withArgs(randomWallet.address);
    });
  });
});

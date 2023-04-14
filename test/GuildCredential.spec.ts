import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { constants, Contract, ContractFactory, ContractTransaction } from "ethers";
import { ethers, upgrades } from "hardhat";

// NFT CONFIG
const name = "GuildCredential";
const symbol = "GUILD";
const cid = "QmPaZD7i8TpLEeGjHtGoXe4mPKbRNNt8YTHH5nrKoqz9wJ";
const fee = ethers.utils.parseEther("0.1");

// ORACLE CONFIG
const jobId = "0x7599d3c8f31e4ce78ad2b790cbcfc673".padEnd(66, "0");
const oracleFee = ethers.utils.parseEther("0.05");

// CONTRACTS
let mockERC20: Contract;
let chainlinkToken: Contract;
let chainlinkOperator: Contract;
let GuildCredential: ContractFactory;
let credential: Contract;

// Test accounts
let wallet0: SignerWithAddress;
let randomWallet: SignerWithAddress;
let treasury: SignerWithAddress;

const oracleResponse = {
  NO_ACCESS: "0x".padEnd(66, "0"),
  ACCESS: `${"0x".padEnd(65, "0")}1`,
  CHECK_FAILED: `${"0x".padEnd(65, "0")}2`
};

enum GuildAction {
  JOINED_GUILD,
  IS_OWNER,
  IS_ADMIN
}

async function getRequestId(tx: ContractTransaction): Promise<string> {
  const res = await tx.wait();
  // Assuming the first event's name is ChainlinkRequested
  expect(res.logs[0].topics[0]).to.eq("0xb5e6e01e79f91267dc17b4e6314d5d4d03593d2ceee0fbb452b750bd70ea5af9");
  // The first indexed parameter of ChainlinkRequested is the requestId
  return res.logs[0].topics[1];
}

describe("GuildCredential", () => {
  before("get accounts", async () => {
    [wallet0, randomWallet, treasury] = await ethers.getSigners();

    const ERC20 = await ethers.getContractFactory("MockERC20");
    mockERC20 = await ERC20.deploy("Mock Token", "MCK");
    mockERC20.mint(wallet0.address, ethers.utils.parseEther("100"));

    const LINK = await ethers.getContractFactory("MockERC677");
    chainlinkToken = await LINK.deploy("Link Token", "LINK");

    const Operator = await ethers.getContractFactory("MockOperator");
    chainlinkOperator = await Operator.deploy(chainlinkToken.address);
  });

  beforeEach("deploy contract", async () => {
    GuildCredential = await ethers.getContractFactory("GuildCredential");
    credential = await upgrades.deployProxy(
      GuildCredential,
      [name, symbol, cid, chainlinkToken.address, chainlinkOperator.address, treasury.address],
      {
        constructorArgs: [jobId, oracleFee],
        kind: "uups"
      }
    );
    await credential.deployed();

    credential.setFee(constants.AddressZero, fee);
    credential.setFee(mockERC20.address, fee);

    chainlinkToken.mint(credential.address, ethers.utils.parseEther("100"));
  });

  it("should have initialized the state variables", async () => {
    expect(await credential.name()).to.eq(name);
    expect(await credential.symbol()).to.eq(symbol);
    expect(await credential.owner()).to.eq(wallet0.address);
    expect(await credential.treasury()).to.eq(treasury.address);
  });

  it("should be upgradeable", async () => {
    const upgraded = await upgrades.upgradeProxy(credential.address, GuildCredential, {
      constructorArgs: [jobId, oracleFee],
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

  context("Treasury management", () => {
    context("#setFee", () => {
      it("should fail if a token's fee is attempted to be changed by anyone but the owner", async () => {
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
      it("should fail if the treasury is attempted to be changed by anyone but the owner", async () => {
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

  context("#tokenURI", () => {
    it("should revert when trying to get the tokenURI for a non-existent token", async () => {
      await expect(credential.tokenURI(84)).to.revertedWithCustomError(credential, "NonExistentToken").withArgs(84);
    });

    it("should return the correct tokenURI", async () => {
      const requestId = await getRequestId(
        await credential.claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: fee })
      );
      await chainlinkOperator.tryFulfillOracleRequest(requestId, oracleResponse.ACCESS);
      const regex = new RegExp(`ipfs://${cid}/1.json`);
      expect(regex.test(await credential.tokenURI(1))).to.eq(true);
    });
  });

  context("#claim", () => {
    it("fails if the address has already claimed", async () => {
      const requestId = await getRequestId(
        await credential.claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: fee })
      );
      await chainlinkOperator.tryFulfillOracleRequest(requestId, oracleResponse.ACCESS);
      await expect(
        credential.claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: fee })
      ).to.be.revertedWithCustomError(credential, "AlreadyClaimed");
    });

    it("fails if the token has no fees set", async () => {
      await expect(credential.claim(randomWallet.address, GuildAction.JOINED_GUILD, 1985))
        .to.be.revertedWithCustomError(credential, "IncorrectPayToken")
        .withArgs(randomWallet.address);
    });

    it("should be able to mint tokens for the same reason to different addresses", async () => {
      const tx0 = await credential.claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: fee });
      const res0 = await tx0.wait();
      expect(res0.status).to.equal(1);
      const tx1 = await credential
        .connect(randomWallet)
        .claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: fee });
      const res1 = await tx1.wait();
      expect(res1.status).to.equal(1);
    });

    it("should be able to mint tokens for the same address for different reasons", async () => {
      const tx0 = await credential.claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: fee });
      const res0 = await tx0.wait();
      expect(res0.status).to.equal(1);
      const tx1 = await credential
        .connect(randomWallet)
        .claim(constants.AddressZero, GuildAction.IS_OWNER, 1985, { value: fee });
      const res1 = await tx1.wait();
      expect(res1.status).to.equal(1);
      const tx2 = await credential
        .connect(randomWallet)
        .claim(constants.AddressZero, GuildAction.IS_ADMIN, 1985, { value: fee });
      const res2 = await tx2.wait();
      expect(res2.status).to.equal(1);
    });

    it("should transfer ERC20 when there is no msg.value", async () => {
      await mockERC20.approve(credential.address, constants.MaxUint256);
      await expect(credential.claim(mockERC20.address, GuildAction.IS_ADMIN, 1985)).to.changeTokenBalances(
        mockERC20,
        [wallet0, treasury],
        [fee.mul(-1), fee]
      );
    });

    it("should transfer ether to treasury", async () => {
      await expect(
        credential.claim(constants.AddressZero, GuildAction.IS_ADMIN, 1985, { value: fee })
      ).to.changeEtherBalances([wallet0, treasury], [fee.mul(-1), fee]);
    });

    it("should revert if an incorrect msg.value is received", async () => {
      await expect(credential.claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: fee.mul(2) }))
        .to.be.revertedWithCustomError(credential, "IncorrectFee")
        .withArgs(fee.mul(2), fee);
      await expect(credential.claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: fee.div(2) }))
        .to.be.revertedWithCustomError(credential, "IncorrectFee")
        .withArgs(fee.div(2), fee);
    });

    it("emits ClaimRequested event", async () => {
      await expect(credential.claim(constants.AddressZero, GuildAction.IS_ADMIN, 1985, { value: fee }))
        .to.emit(credential, "ClaimRequested")
        .withArgs(wallet0.address, GuildAction.IS_ADMIN, 1985);
    });
  });

  context("#fulfillClaim", () => {
    let requestId: string;

    beforeEach("make a claim request", async () => {
      requestId = await getRequestId(
        await credential.claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: fee })
      );
    });

    it("fails if the address doesn't fulfill the requirements", async () => {
      await expect(chainlinkOperator.tryFulfillOracleRequest(requestId, oracleResponse.NO_ACCESS))
        .to.be.revertedWithCustomError(credential, "NoAccess")
        .withArgs(wallet0.address);
    });

    it("fails if the check failed or invalid data was returned by the oracle", async () => {
      await expect(chainlinkOperator.tryFulfillOracleRequest(requestId, oracleResponse.CHECK_FAILED))
        .to.be.revertedWithCustomError(credential, "AccessCheckFailed")
        .withArgs(wallet0.address);
      await expect(chainlinkOperator.tryFulfillOracleRequest(requestId, `${"0x".padEnd(65, "0")}3`))
        .to.be.revertedWithCustomError(credential, "AccessCheckFailed")
        .withArgs(wallet0.address);
      await expect(chainlinkOperator.tryFulfillOracleRequest(requestId, `${"0x".padEnd(65, "0")}9`))
        .to.be.revertedWithCustomError(credential, "AccessCheckFailed")
        .withArgs(wallet0.address);
    });

    it("fails if the claim was already fulfilled", async () => {
      await chainlinkOperator.tryFulfillOracleRequest(requestId, oracleResponse.ACCESS);
      await expect(chainlinkOperator.tryFulfillOracleRequest(requestId, oracleResponse.ACCESS)).to.be.revertedWith(
        "Must have a valid requestId"
      );
      // Note: the above error is thrown by the Chainlink Operator contract. However, a non-official/malicious
      // implementation might skip that check. In those cases, the below check will still prevent double fulfills:
      // await expect(chainlinkOperator.tryFulfillOracleRequest(requestId, oracleResponse.ACCESS)).to.be.revertedWith(
      //   "Source must be the oracle of the request"
      // );
    });

    it("should set the address's claim status", async () => {
      await chainlinkOperator.tryFulfillOracleRequest(requestId, oracleResponse.ACCESS);
      expect(await credential.hasClaimed(wallet0.address, GuildAction.JOINED_GUILD, 1985)).to.eq(true);
    });

    it("should increment the total supply", async () => {
      const totalSupply0 = await credential.totalSupply();
      await chainlinkOperator.tryFulfillOracleRequest(requestId, oracleResponse.ACCESS);
      const totalSupply1 = await credential.totalSupply();
      expect(totalSupply1).to.eq(totalSupply0.add(1));
    });

    it("should mint the token", async () => {
      const totalSupply = await credential.totalSupply();
      const tokenId = totalSupply.add(1);
      expect(await credential.balanceOf(wallet0.address)).to.eq(0);
      await expect(credential.ownerOf(tokenId)).to.be.revertedWith("ERC721: invalid token ID");
      await chainlinkOperator.tryFulfillOracleRequest(requestId, oracleResponse.ACCESS);
      expect(await credential.balanceOf(wallet0.address)).to.eq(1);
      expect(await credential.ownerOf(tokenId)).to.eq(wallet0.address);
    });

    it("emits Claimed event", async () => {
      await expect(chainlinkOperator.tryFulfillOracleRequest(requestId, oracleResponse.ACCESS))
        .to.emit(credential, "Claimed")
        .withArgs(wallet0.address, GuildAction.JOINED_GUILD, 1985);
    });
  });

  context("#burn", () => {
    beforeEach("claim a token", async () => {
      const requestId = await getRequestId(
        await credential.claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: fee })
      );
      await chainlinkOperator.tryFulfillOracleRequest(requestId, oracleResponse.ACCESS);
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

    it("burns the token", async () => {
      await expect(credential.burn(GuildAction.JOINED_GUILD, 1985)).to.changeTokenBalance(credential, wallet0, -1);
    });
  });
});

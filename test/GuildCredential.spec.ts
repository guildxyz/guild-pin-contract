import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { constants, Contract, ContractFactory, ContractTransaction } from "ethers";
import { ethers, upgrades } from "hardhat";

// NFT CONFIG
const name = "GuildCredential";
const symbol = "GUILD";
const cid = "QmPaZD7i8TpLEeGjHtGoXe4mPKbRNNt8YTHH5nrKoqz9wJ";
const etherFee = ethers.utils.parseEther("0.1");

// ORACLE CONFIG
const jobId = "0x7599d3c8f31e4ce78ad2b790cbcfc673".padEnd(66, "0");
const oracleFee = ethers.utils.parseEther("0.05");

// CONTRACTS
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
  return res.logs[0].topics[1]; // eslint-disable-line prefer-destructuring
}

describe("GuildCredential", () => {
  before("get accounts", async () => {
    [wallet0, randomWallet, treasury] = await ethers.getSigners();

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

    credential.setFee(constants.AddressZero, etherFee);

    chainlinkToken.mint(credential.address, ethers.utils.parseEther("100"));
  });

  it("should have initialized the state variables", async () => {
    expect(await credential.name()).to.eq(name);
    expect(await credential.symbol()).to.eq(symbol);
    expect(await credential.owner()).to.eq(wallet0.address);
  });

  it("should be upgradeable", async () => {
    const upgraded = await upgrades.upgradeProxy(credential.address, GuildCredential, {
      constructorArgs: [jobId, oracleFee],
      kind: "uups"
    });

    expect(await upgraded.name()).to.eq(name);
    expect(await upgraded.symbol()).to.eq(symbol);
    expect(await upgraded.owner()).to.eq(wallet0.address);
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

  context("#tokenURI", () => {
    it("should revert when trying to get the tokenURI for a non-existent token", async () => {
      await expect(credential.tokenURI(84)).to.revertedWithCustomError(credential, "NonExistentToken").withArgs(84);
    });

    it("should return the correct tokenURI", async () => {
      const requestId = await getRequestId(
        await credential.claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: etherFee })
      );
      await chainlinkOperator.tryFulfillOracleRequest(requestId, oracleResponse.ACCESS);
      const regex = new RegExp(`ipfs://${cid}/0.json`);
      expect(regex.test(await credential.tokenURI(0))).to.eq(true);
    });
  });

  context("#claim", () => {
    it("fails if the address has already claimed", async () => {
      const requestId = await getRequestId(
        await credential.claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: etherFee })
      );
      await chainlinkOperator.tryFulfillOracleRequest(requestId, oracleResponse.ACCESS);
      await expect(
        credential.claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: etherFee })
      ).to.be.revertedWithCustomError(credential, "AlreadyClaimed");
    });

    it("should be able to mint tokens for the same reason to different addresses", async () => {
      const tx0 = await credential.claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: etherFee });
      const res0 = await tx0.wait();
      expect(res0.status).to.equal(1);
      const tx1 = await credential
        .connect(randomWallet)
        .claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: etherFee });
      const res1 = await tx1.wait();
      expect(res1.status).to.equal(1);
    });

    it("should be able to mint tokens for the same address for different reasons", async () => {
      const tx0 = await credential.claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: etherFee });
      const res0 = await tx0.wait();
      expect(res0.status).to.equal(1);
      const tx1 = await credential
        .connect(randomWallet)
        .claim(constants.AddressZero, GuildAction.IS_OWNER, 1985, { value: etherFee });
      const res1 = await tx1.wait();
      expect(res1.status).to.equal(1);
      const tx2 = await credential
        .connect(randomWallet)
        .claim(constants.AddressZero, GuildAction.IS_ADMIN, 1985, { value: etherFee });
      const res2 = await tx2.wait();
      expect(res2.status).to.equal(1);
    });

    it("emits ClaimRequested event", async () => {
      await expect(credential.claim(constants.AddressZero, GuildAction.IS_ADMIN, 1985, { value: etherFee }))
        .to.emit(credential, "ClaimRequested")
        .withArgs(wallet0.address, GuildAction.IS_ADMIN, 1985);
    });
  });

  context("#fulfillClaim", () => {
    let requestId: string;

    beforeEach("make a claim request", async () => {
      requestId = await getRequestId(
        await credential.claim(constants.AddressZero, GuildAction.JOINED_GUILD, 1985, { value: etherFee })
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

    it("should mint the token", async () => {
      const tokenId = await credential.totalSupply();
      expect(await credential.balanceOf(wallet0.address)).to.eq("0");
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
});

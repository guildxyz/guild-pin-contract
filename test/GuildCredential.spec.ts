import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { constants, Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";

// NFT METADATA
const name = "GuildCredential";
const symbol = "GUILD";
const cid = "QmPaZD7i8TpLEeGjHtGoXe4mPKbRNNt8YTHH5nrKoqz9wJ";

// ORACLE CONFIG (default: Goerli)
const chainlinkToken = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
const oracleAddress = "0x188b71C9d27cDeE01B9b0dfF5C1aff62E8D6F434";
const jobId = "0x7599d3c8f31e4ce78ad2b790cbcfc673".padEnd(66, "0");
const oracleFee = ethers.utils.parseEther("0.05");

// CONTRACTS
let GuildCredential: ContractFactory;
let credential: Contract;

// Test accounts
let wallet0: SignerWithAddress;
let randomWallet: SignerWithAddress;

describe("GuildCredential", () => {
  before("get accounts", async () => {
    [wallet0, randomWallet] = await ethers.getSigners();
  });

  beforeEach("deploy contract", async () => {
    GuildCredential = await ethers.getContractFactory("GuildCredential");
    credential = await upgrades.deployProxy(GuildCredential, [name, symbol, cid, chainlinkToken, oracleAddress], {
      constructorArgs: [jobId, oracleFee],
      kind: "uups"
    });
    await credential.deployed();
  });

  it("should have initialized the state variables", async () => {
    expect(await credential.name()).to.eq(name);
    expect(await credential.symbol()).to.eq(symbol);
    // expect(await credential.tokenUri()).to.contain(cid);
  });

  it("should be upgradeable", async () => {
    const upgraded = await upgrades.upgradeProxy(credential.address, GuildCredential, {
      constructorArgs: [jobId, oracleFee],
      kind: "uups"
    });

    expect(await upgraded.name()).to.eq(name);
    expect(await upgraded.symbol()).to.eq(symbol);
    // expect(await upgraded.tokenUri()).to.contain(cid);
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
});

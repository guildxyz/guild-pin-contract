import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
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

describe("GuildCredential", () => {
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

    console.log(credential.address, upgraded.address);
    expect(await upgraded.name()).to.eq(name);
    expect(await upgraded.symbol()).to.eq(symbol);
    // expect(await upgraded.tokenUri()).to.contain(cid);
  });
});

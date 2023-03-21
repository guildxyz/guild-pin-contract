import { ethers, upgrades } from "hardhat";

// NFT METADATA
const name = ""; // The name of the token.
const symbol = ""; // The short, usually all caps symbol of the token.
const cid = ""; // The ipfs hash, under which the off-chain metadata is uploaded.

const treasury = "0x...";

// ORACLE CONFIG (default: Goerli)
const chainlinkToken = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
const oracleAddress = "0x188b71C9d27cDeE01B9b0dfF5C1aff62E8D6F434";
const jobId = "0x7599d3c8f31e4ce78ad2b790cbcfc673".padEnd(66, "0");
const oracleFee = ethers.utils.parseEther("0.05");

async function main() {
  const GuildCredential = await ethers.getContractFactory("GuildCredential");
  const guildCredential = await upgrades.deployProxy(
    GuildCredential,
    [name, symbol, cid, chainlinkToken, oracleAddress, treasury],
    { constructorArgs: [jobId, oracleFee], kind: "uups" }
  );

  console.log(
    `Deploying contract to ${
      ethers.provider.network.name !== "unknown" ? ethers.provider.network.name : ethers.provider.network.chainId
    }...`
  );

  await guildCredential.deployed();

  console.log("GuildCredential deployed to:", guildCredential.address);
  console.log("Constructor arguments:", jobId, oracleFee.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

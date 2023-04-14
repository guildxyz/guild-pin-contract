import { ethers, upgrades } from "hardhat";

// NFT METADATA
const name = ""; // The name of the token.
const symbol = ""; // The short, usually all caps symbol of the token.

const treasury = "0x...";

// ORACLE CONFIG (default: Goerli)
const chainlinkToken = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
const oracleAddress = "0x6c2e87340Ef6F3b7e21B2304D6C057091814f25E";
const jobId = "0xb4bb896b5d9b4dc694e84479563a537a".padEnd(66, "0");
const oracleFee = ethers.utils.parseEther("0");

async function main() {
  const GuildCredential = await ethers.getContractFactory("GuildCredential");
  const guildCredential = await upgrades.deployProxy(
    GuildCredential,
    [name, symbol, chainlinkToken, oracleAddress, treasury],
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

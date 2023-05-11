import { ethers, upgrades } from "hardhat";

// CONFIG
const name = "Guild Credential"; // The name of the token.
const symbol = "GUILD"; // The short, usually all caps symbol of the token.
const treasury = "0x30B6F80A535Ecf39892ec8e7C2776910D2576cd9"; // The address where the collected fees will go.
const validSigner = "0x989a6C5D84c932E7c9EaE8b4D2d5f378b11C21F7"; // The address that signs the parameters for claiming tokens.

async function main() {
  const GuildCredential = await ethers.getContractFactory("GuildCredential");
  const guildCredential = await upgrades.deployProxy(GuildCredential, [name, symbol, treasury, validSigner], {
    kind: "uups"
  });

  console.log(
    `Deploying contract to ${
      ethers.provider.network.name !== "unknown" ? ethers.provider.network.name : ethers.provider.network.chainId
    }...`
  );
  console.log(`Tx hash: ${guildCredential.deployTransaction.hash}`);

  await guildCredential.deployed();

  console.log("GuildCredential deployed to:", guildCredential.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

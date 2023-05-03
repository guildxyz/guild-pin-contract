import { ethers, upgrades } from "hardhat";

// CONFIG
const name = ""; // The name of the token.
const symbol = ""; // The short, usually all caps symbol of the token.
const treasury = "0x..."; // The address where the collected fees will go.
const validSigner = "0x..."; // The address that signs the parameters for claiming tokens.

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

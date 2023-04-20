import { ethers, upgrades } from "hardhat";

// NFT METADATA
const name = ""; // The name of the token.
const symbol = ""; // The short, usually all caps symbol of the token.

const treasury = "0x...";

async function main() {
  const GuildCredential = await ethers.getContractFactory("GuildCredential");
  const guildCredential = await upgrades.deployProxy(GuildCredential, [name, symbol, treasury], { kind: "uups" });

  console.log(
    `Deploying contract to ${
      ethers.provider.network.name !== "unknown" ? ethers.provider.network.name : ethers.provider.network.chainId
    }...`
  );

  await guildCredential.deployed();

  console.log("GuildCredential deployed to:", guildCredential.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

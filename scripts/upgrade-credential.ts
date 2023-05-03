import { ethers, upgrades } from "hardhat";

const credentialAddress = "0x..."; // The address where the contract was deployed (proxy).

async function main() {
  const GuildCredential = await ethers.getContractFactory("GuildCredential");
  const guildCredential = await upgrades.upgradeProxy(credentialAddress, GuildCredential, {
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

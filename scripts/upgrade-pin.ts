import { ethers, upgrades } from "hardhat";

const pinAddress = "0x..."; // The address where the contract was deployed (proxy).

async function main() {
  const GuildPin = await ethers.getContractFactory("GuildPin");
  const guildPin = await upgrades.upgradeProxy(pinAddress, GuildPin, {
    kind: "uups"
    // call: { fn: "reInitialize", args: [] }
  });

  const network = await ethers.provider.getNetwork();
  console.log(`Deploying contract to ${network.name !== "unknown" ? network.name : network.chainId}...`);
  console.log(`Tx hash: ${guildPin.deploymentTransaction()?.hash}`);

  await guildPin.waitForDeployment();

  console.log("GuildPin deployed to:", await guildPin.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

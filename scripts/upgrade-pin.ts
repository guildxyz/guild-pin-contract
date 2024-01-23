import { ethers, upgrades } from "hardhat";

const pinAddress = "0x..."; // The address where the contract was deployed (proxy).

async function main() {
  const contractName = "GuildPin";

  const GuildPin = await ethers.getContractFactory(contractName);
  const guildPin = await upgrades.upgradeProxy(pinAddress, GuildPin, {
    kind: "uups"
    // call: { fn: "reInitialize", args: [] }
  });

  const network = await ethers.provider.getNetwork();
  console.log(`Upgrading ${contractName} on ${network.name !== "unknown" ? network.name : network.chainId}...`);

  await guildPin.waitForDeployment();

  console.log(`${contractName} upgraded to:`, await guildPin.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

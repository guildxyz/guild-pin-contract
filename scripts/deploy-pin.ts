import { ethers, upgrades } from "hardhat";

// CONFIG
const name = ""; // The name of the token.
const symbol = ""; // The short, usually all caps symbol of the token.
const treasury = "0x..."; // The address where the collected fees will go.
const validSigner = "0x..."; // The address that signs the parameters for claiming tokens.

async function main() {
  const contractName = "GuildPin";

  const GuildPin = await ethers.getContractFactory(contractName);
  const guildPin = await upgrades.deployProxy(GuildPin, [name, symbol, treasury, validSigner], {
    kind: "uups"
  });

  const network = await ethers.provider.getNetwork();
  console.log(`Deploying ${contractName} to ${network.name !== "unknown" ? network.name : network.chainId}...`);
  console.log(`Tx hash: ${guildPin.deploymentTransaction()?.hash}`);

  await guildPin.waitForDeployment();

  console.log(`${contractName} deployed to:`, await guildPin.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Wallet } from "zksync-ethers";

import * as hre from "hardhat";

const pinAddress = "0x..."; // The address where the contract was deployed (proxy).

async function main() {
  const contractName = "GuildPin";

  const zkWallet = new Wallet(process.env.PRIVATE_KEY!);
  const deployer = new Deployer(hre, zkWallet);

  const GuildPin = await deployer.loadArtifact(contractName);
  const guildPin = await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, pinAddress, GuildPin, {
    // call: { fn: "reInitialize", args: [] }
  });

  console.log(`Upgrading ${contractName} on zkSync...`);

  await guildPin.waitForDeployment();

  console.log(`${contractName} upgraded to:`, await guildPin.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

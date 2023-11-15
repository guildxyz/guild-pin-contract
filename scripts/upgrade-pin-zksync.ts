/* eslint-disable import/no-extraneous-dependencies */
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Wallet } from "zksync-web3";

import * as hre from "hardhat";

const pinAddress = "0x..."; // The address where the contract was deployed (proxy).

async function main() {
  const contractName = "GuildPin";
  console.log(`Upgrading ${contractName}...`);

  const zkWallet = new Wallet(process.env.PRIVATE_KEY!);
  const deployer = new Deployer(hre, zkWallet);

  const GuildPin = await deployer.loadArtifact(contractName);
  const pin = await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, pinAddress, GuildPin, {
    // call: { fn: "reInitialize", args: [] }
  });

  console.log(`${contractName} upgraded on:`, pin.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/* eslint-disable import/no-extraneous-dependencies */
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import "dotenv/config";
import { Wallet } from "zksync-web3";

import * as hre from "hardhat";

// CONFIG
const name = ""; // The name of the token.
const symbol = ""; // The short, usually all caps symbol of the token.
const treasury = "0x..."; // The address where the collected fees will go.
const validSigner = "0x..."; // The address that signs the parameters for claiming tokens.

async function main() {
  const contractName = "GuildPin";
  console.log(`Deploying ${contractName}...`);

  const zkWallet = new Wallet(process.env.PRIVATE_KEY!);

  const deployer = new Deployer(hre, zkWallet);

  const contract = await deployer.loadArtifact(contractName);
  const pin = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [name, symbol, treasury, validSigner], {
    initializer: "initialize"
  });

  await pin.deployed();
  console.log(`${contractName} deployed to:`, pin.address);

  enum GuildAction {
    JOINED_GUILD,
    IS_OWNER,
    IS_ADMIN
  }
  const pinStrings = (action: GuildAction) => {
    const actionNames = ["Joined", "Created", "Admin of"];
    const descriptions = [
      "This is an onchain proof that you joined",
      "This is an onchain proof that you're the owner of",
      "This is an onchain proof that you're an admin of"
    ];
    return {
      actionName: actionNames[action],
      description: descriptions[action]
    };
  };
  await pin.setPinStrings(GuildAction.JOINED_GUILD, pinStrings(GuildAction.JOINED_GUILD));
  await pin.setPinStrings(GuildAction.IS_OWNER, pinStrings(GuildAction.IS_OWNER));
  await pin.setPinStrings(GuildAction.IS_ADMIN, pinStrings(GuildAction.IS_ADMIN));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

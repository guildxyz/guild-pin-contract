import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import "dotenv/config";
import * as hre from "hardhat";
import { Wallet } from "zksync-ethers";

// CONFIG
const name = ""; // The name of the token.
const symbol = ""; // The short, usually all caps symbol of the token.
const treasury = "0x..."; // The address where the collected fees will go.
const validSigner = "0x..."; // The address that signs the parameters for claiming tokens.

async function main() {
  const contractName = "GuildPin";

  const zkWallet = new Wallet(process.env.PRIVATE_KEY!);

  const deployer = new Deployer(hre, zkWallet);

  const contract = await deployer.loadArtifact(contractName);
  const guildPin = await hre.zkUpgrades.deployProxy(
    deployer.zkWallet,
    contract,
    [name, symbol, treasury, validSigner],
    {
      initializer: "initialize"
    }
  );

  console.log(`Deploying ${contractName} to zkSync...`);
  console.log(`Tx hash: ${guildPin.deploymentTransaction()?.hash}`);

  await guildPin.waitForDeployment();

  console.log(`${contractName} deployed to:`, await guildPin.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

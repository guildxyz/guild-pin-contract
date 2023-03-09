import { ethers, upgrades } from "hardhat";

// The address where the contract was deployed (proxy)
const credentialAddress = "0x...";

// Note: only the constructor arguments are needed. To change initialized variables, a reinitializer function is needed.
// ORACLE CONFIG (default: Goerli)
// const chainlinkToken = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
// const oracleAddress = "0x188b71C9d27cDeE01B9b0dfF5C1aff62E8D6F434";
const jobId = "0x7599d3c8f31e4ce78ad2b790cbcfc673".padEnd(66, "0");
const oracleFee = ethers.utils.parseEther("0.05");

async function main() {
  const GuildCredential = await ethers.getContractFactory("GuildCredential");
  const guildCredential = await upgrades.upgradeProxy(credentialAddress, GuildCredential, {
    constructorArgs: [jobId, oracleFee]
  });

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

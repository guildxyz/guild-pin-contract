import { ethers } from "hardhat";

// CONFIG
const pinAddress = "0x..."; // The address where the contract was deployed (proxy).
const fee = ethers.parseEther(""); // The amount of fees to collect from every minter.

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

async function main() {
  const GuildPin = await ethers.getContractFactory("GuildPin");
  const pin = GuildPin.attach(pinAddress);

  await pin.setFee(fee);

  await pin.setPinStrings(GuildAction.JOINED_GUILD, pinStrings(GuildAction.JOINED_GUILD));
  await pin.setPinStrings(GuildAction.IS_OWNER, pinStrings(GuildAction.IS_OWNER));
  await pin.setPinStrings(GuildAction.IS_ADMIN, pinStrings(GuildAction.IS_ADMIN));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

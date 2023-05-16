# Post stealth launch operations

The direction we are taking after the stealth launch from the perspective of the contract, including a migration plan.

## Tasks

After the successful [release of the first version of the contract](https://github.com/agoraxyz/guild-pin-contract/releases/tag/v1.0.0), the BD team came up with new ideas that would make the product even more appealing. They can be broken down to three tasks:

1. rename to something more unique/fun that does not sound corporate or something that would be comparable to the protocols using KYC. The suggested name: Guild Pin.
2. move metadata to the contract (hybrid method described [here](metadata-storage#hybrid-metadata-in-the-contract-image-on-ipfs)). This is partially to support point #3, but also to make any future changes more feasible.
3. add a rank to the metadata. Currently there is no way to know how many people have minted the NFT for that specific guild before you (apart from traversing through all emitted events and counting them).

## Solutions

The contract is upgradeable, since it's built with the Transparent Proxy Pattern. It allows us to define a reinitializer function that can be run only once after the new deployment. We should do any one-time changes there, unless it's something heavy that should be broken down to more transactions. Let's look at the proposed solutions to the tasks:

### Renaming

We should simply set the new name in the reinitializer function. Additionally, we can change all occurences in the code to the new name.

### Moving metadata to the contract

For that, we should implement a new tokenURI function, similar to the examples described [here](metadata-storage#metadata-in-the-contract). An example for the current structure of our metadata can be seen [here](https://guild-xyz.mypinata.cloud/ipfs/QmPp7xsza4BWAcD2x7DVP8iBABXvJc6t5mVKtwhpYWsddZ). This requires storing additional variables in the contract:

- per token: the fields in [PinData](contracts/interfaces/IGuildPin.md#pindata). Most of them should be supplied as a parameter to the claim function call, thus they also have to be signed together with the other params. This needs a slight change on the backend. For _mintDate_ we can store `block.timestamp`. We should track the _pinNumber_ internally, so that also shouldn't be supplied from outside.
- once in the contract: some strings that vary based on pin type. Currently that's the pin _name_ and _description_.

A crucial element is what happens with the tokens already minted. A solution would be to treat them differently and display the same data for every token. This would work perfectly for guildName, but not for the others. We will have to backfill the data for every minted token, preferably in the reinitializer function. Since it's a large amount of data, we should run tests if this is feasible. If not, the execution should be broken down into more chunks. For that, we should create a function that can only be called by the owner to prevent misuse.

### Rank

We should add a rank attribute to the metadata:

```ts
{
  `trait_type": "rank", "value": "${value}"`;
}
```

The `value` field should be substituted with the actual rank of the token. For that, we should store the number of minted tokens per guild. Note that it's not the same as the total supply per guild, this number should ever only be incremented, never decremented.
For tokens minted before the upgrade, the rank should equal the tokenId. We guarantee it's validity by not opening up the use of the contract for any guild other than Our Guild until the upgrade.

## Migration plan

1. Temporarily disable the functionality on the frontend (both on guild pages and in the account modal).
2. Make sure there are no pending transactions and upgrade the contract on Polygon.
3. Update the metadata for all existing tokens using [backfillMetadata](contracts/interfaces/IGuildPin.md#backfillmetadata). According to previous tests, about 500 tokens can be updated in one call. The data for this should be obtained from multiple sources:

   - event log of the contract: filter it for the `Claimed` event.
   - the metadata previously uploaded to ipfs: note that the cids can only be obtained before the contract is upgraded.
   - Guild's API - the `createdAt` property should be queried from the Guild API directly because of a bug we discovered during development ([related PR comment](https://github.com/agoraxyz/guild-backend/pull/854#discussion_r1195202759)).

4. Call the [setPinStrings](contracts/interfaces/IGuildPin.md#setpinstrings) function for every GuildAction. This is the same logic as the one used in [tests](../test/GuildPin.spec.ts).
5. Merge the [changes](https://github.com/agoraxyz/guild-backend/pull/854) to the core.
6. After all the transactions are completed and the core is updated successfully, merge the [changes](https://github.com/agoraxyz/guild.xyz/pull/794) and enable the functionality on frontend.
7. Verify the contract on PolygonScan.
8. Commit the new deployment data to git and make a release.

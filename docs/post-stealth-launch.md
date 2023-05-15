# Post stealth launch operations

The direction we are taking after the stealth launch from the perspective of the contract, including a migration plan.

## Tasks

After the successful [release of the first version of the contract](https://github.com/agoraxyz/guild-credential-contract/releases/tag/v1.0.0), the BD team came up with new ideas that would make the product even more appealing. They can be broken down to three tasks:

1. rename to something more unique/fun that does not sound corporate or something that would be comparable to the protocols using KYC. The suggested name: Guild Pin.
2. move metadata to the contract (hybrid method described [here](metadata-storage#hybrid-metadata-in-the-contract-image-on-ipfs)). This is partially to support point #3, but also to make any future changes more feasible.
3. add a rank to the metadata. Currently there is no way to know how many people have minted the NFT for that specific guild before you (apart from traversing through all emitted events and counting them).

## Solutions

The contract is upgradable, since it's built with the Transparent Proxy Pattern. It allows us to define a reinitializer function that can be run only once after the new deployment. We should do any one-time changes there, unless it's something heavy that should be broken down to more transactions. Let's look at the proposed solutions to the tasks:

### Renaming

We should simply set the new name in the reinitializer function.

### Moving metadata to the contract

For that, we should implement a new tokenURI function, similar to the examples described [here](metadata-storage#metadata-in-the-contract). An example for the current structure of our metadata can be seen [here](https://guild-xyz.mypinata.cloud/ipfs/QmPp7xsza4BWAcD2x7DVP8iBABXvJc6t5mVKtwhpYWsddZ). This requires storing additional variables in the contract:

- per token: _userId_, _guildName_, _createdAt_ (a.k.a actionDate), _mintDate_. The first three should be supplied as a parameter to the claim function call, thus they also have to be signed together with the other params. This needs a slight change on the backend. For mintDate we can store `block.timestamp`.
- once in the contract: some strings that vary based on credential type. Currently that's the credential _name_ and _description_.

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

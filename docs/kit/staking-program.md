# Staking Program

The StakeProgram provides methods to interact with Nosana staking accounts on-chain.

::: warning Passive staking is sunset
Following [NNP-0001](https://vote.nosana.com/), passive staking rewards end on 28 November 2026 (12:07 UTC). New stakes and stake top-ups are disabled in the kit. See [Creating and topping up stakes](#creating-and-topping-up-stakes).
:::

## Get a Single Stake Account

Fetch a stake account by its address.

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
import { address, Stake } from '@nosana/kit';
const stake: Stake = await client.stake.get(address('stake-account-address'));

console.log('Stake Account:', stake.address);
console.log('Authority:', stake.authority);
console.log('Staked Amount:', stake.amount);
console.log('xNOS Tokens:', stake.xnos);
console.log('Duration:', stake.duration);
console.log('Time to Unstake:', stake.timeUnstake);
console.log('Vault:', stake.vault);
```

## Get Multiple Stake Accounts

Fetch multiple stake accounts by their addresses.

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
import { address, Stake } from '@nosana/kit';
import type { Address } from '@nosana/kit';
const addresses: Address[] = [address('address1'), address('address2'), address('address3')];
const stakes: Stake[] = await client.stake.multiple(addresses);

stakes.forEach((stake) => {
  console.log(`${stake.address}: ${stake.amount} staked`);
});
```

## Get All Stake Accounts

Fetch all stake accounts in the program.

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
import { Stake } from '@nosana/kit';
// Get all stakes
const allStakes: Stake[] = await client.stake.all();
console.log(`Found ${allStakes.length} stake accounts`);
```

## Creating and topping up stakes

Passive staking rewards are sunset ([NNP-0001](https://vote.nosana.com/)), so the kit no longer builds instructions that add NOS to a stake:

- `client.stake.stake()` only builds an empty stake account (`amount: 0`). Nodes need one to work on jobs. Any other amount throws.
- `client.stake.topup()` always throws.

Both throw a `NosanaError` with code `STAKING_DISABLED`. Reading stake accounts still works.

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
import { ErrorCodes, NosanaError } from '@nosana/kit';
// Still allowed: an empty stake account for a node
const instruction = await client.stake.stake({ amount: 0, days: 14 });
await client.solana.buildSignAndSend(instruction);

try {
  await client.stake.topup({ amount: 1_000_000_000 });
} catch (error) {
  if (error instanceof NosanaError && error.code === ErrorCodes.STAKING_DISABLED) {
    console.log(error.message);
  }
}
```

Low-level builders and account decoders for these programs are exported as the `StakingClient`, `RewardsClient` and `PoolsClient` namespaces.

## Type Definitions

```ts
interface Stake {
  address: Address;
  amount: number;
  authority: Address;
  duration: number;
  timeUnstake: number;
  vault: Address;
  vaultBump: number;
  xnos: number;
}
```

## Use Cases

- **Portfolio Tracking**: Monitor your staked NOS tokens
- **Analytics**: Analyze staking patterns and distributions
- **Governance**: Check voting power based on staked amounts
- **Rewards Calculation**: Calculate rewards based on stake duration and amount


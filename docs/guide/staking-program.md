# Staking Program

The StakeProgram provides methods to interact with Nosana staking accounts on-chain.

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


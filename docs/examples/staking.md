# Staking Examples

## Get Stake Account

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
import type { Stake } from '@nosana/kit';
// Get a single stake account
import { address } from '@nosana/kit';
const stake: Stake = await client.stake.get(address('stake-account-address'));

console.log('Staked Amount:', stake.amount);
console.log('xNOS Tokens:', stake.xnos);
console.log('Duration:', stake.duration);
console.log('Time to Unstake:', new Date(Number(stake.timeUnstake) * 1000));
```

## Analyze Staking Distribution

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
import type { Stake } from '@nosana/kit';
// Get all stake accounts
const allStakes: Stake[] = await client.stake.all();

// Calculate total staked
const totalStaked: number = allStakes.reduce((sum, stake) => sum + Number(stake.amount), 0);

// Find average stake
const averageStake: number = totalStaked / allStakes.length;

// Find largest stake
const largestStake: number = allStakes.reduce((max, stake) => Math.max(max, Number(stake.amount)), 0);

console.log('Staking Statistics:');
console.log(`Total Staked: ${totalStaked.toLocaleString()} NOS`);
console.log(`Average Stake: ${averageStake.toLocaleString()} NOS`);
console.log(`Largest Stake: ${largestStake.toLocaleString()} NOS`);
console.log(`Number of Stakers: ${allStakes.length}`);
```

## Get Multiple Stake Accounts

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
import type { Stake, Address } from '@nosana/kit';
import { address } from '@nosana/kit';
const addresses: Address[] = [address('address1'), address('address2'), address('address3')];
const stakes: Stake[] = await client.stake.multiple(addresses);

stakes.forEach((stake) => {
  console.log(`${stake.address}: ${stake.amount} staked`);
});
```


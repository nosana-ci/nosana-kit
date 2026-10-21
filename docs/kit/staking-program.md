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

## Top Up a Stake

Add NOS to the wallet's existing stake account. `topup` returns the instructions to send together in one transaction, in this order:

1. rewards `enter`, only when the wallet has no rewards account yet
2. pools `claimFee`, which moves the pool's accrued emission into the rewards vault
3. stake `topup(amount)`
4. rewards `sync`, which updates the rewards account to the new stake

`amount` is in NOS base units (6 decimals), as a `number` or `bigint`. `pool` is the pools-program pool that pays emission into the rewards vault (claim type `AddFee`). It is optional and defaults to `programs.rewardsPoolAddress` in the client config (set for mainnet and devnet, unset on localnet). That pool has rotated in the past, so it is config, not a constant: override it in the config or pass `pool` per call. The wallet is the authority and signer of every instruction; the stake account must already exist and must not be unstaking.

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
import { address, type TopupInstructions } from '@nosana/kit';
// Uses programs.rewardsPoolAddress from the client config
const instructions: TopupInstructions = await client.stake.topup({ amount: 1_000_000_000 }); // 1,000 NOS

const signature = await client.solana.buildSignAndSend(instructions);

// Or name the pool for this call
await client.stake.topup({ amount: 1_000_000_000, pool: address('pool-address') });
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


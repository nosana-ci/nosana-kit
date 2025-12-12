# Staking Program

The StakeProgram provides methods to interact with Nosana staking accounts on-chain.

## Get a Single Stake Account

Fetch a stake account by its address:

```ts
const stake: Stake = await client.stake.get('stake-account-address');

console.log('Stake Account:', stake.address);
console.log('Authority:', stake.authority);
console.log('Staked Amount:', stake.amount);
console.log('xNOS Tokens:', stake.xnos);
console.log('Duration:', stake.duration);
console.log('Time to Unstake:', stake.timeUnstake);
console.log('Vault:', stake.vault);
```

## Get Multiple Stake Accounts

Fetch multiple stake accounts by their addresses:

```ts
const addresses: Address[] = ['address1', 'address2', 'address3'];
const stakes: Stake[] = await client.stake.multiple(addresses);

stakes.forEach((stake) => {
  console.log(`${stake.address}: ${stake.amount} staked`);
});
```

## Get All Stake Accounts

Fetch all stake accounts in the program:

```ts
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


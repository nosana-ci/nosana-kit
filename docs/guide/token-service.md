# Token Service

The TokenService provides methods to interact with token accounts on Solana. In the NosanaClient, it's configured for the NOS token and accessible via `client.nos`.

## Get All Token Holders

Fetch all accounts holding NOS tokens using a single RPC call:

```ts
// Get all holders (excludes zero balance accounts by default)
const holders: TokenAccountWithBalance[] = await client.nos.getAllTokenHolders();

console.log(`Found ${holders.length} NOS token holders`);

holders.forEach((holder) => {
  console.log(`${holder.owner}: ${holder.uiAmount} NOS`);
});

// Include accounts with zero balance
const allAccounts: TokenAccountWithBalance[] = await client.nos.getAllTokenHolders({ includeZeroBalance: true });
console.log(`Total accounts: ${allAccounts.length}`);

// Exclude PDA accounts (smart contract-owned token accounts)
const userAccounts: TokenAccountWithBalance[] = await client.nos.getAllTokenHolders({ excludePdaAccounts: true });
console.log(`User-owned accounts: ${userAccounts.length}`);
```

## Get Token Account for Address

Retrieve the NOS token account for a specific owner:

```ts
const account: TokenAccountWithBalance | null = await client.nos.getTokenAccountForAddress('owner-address');

if (account) {
  console.log('Token Account:', account.pubkey);
  console.log('Owner:', account.owner);
  console.log('Balance:', account.uiAmount, 'NOS');
  console.log('Raw Amount:', account.amount.toString());
  console.log('Decimals:', account.decimals);
} else {
  console.log('No NOS token account found');
}
```

## Get Balance

Convenience method to get just the NOS balance for an address:

```ts
const balance: number = await client.nos.getBalance('owner-address');
console.log(`Balance: ${balance} NOS`);
// Returns 0 if no token account exists
```

## Transfer Tokens

Get instruction(s) to transfer SPL tokens. Returns either 1 or 2 instructions depending on whether the recipient's associated token account needs to be created:

```ts
// Get transfer instruction(s)
const instructions: Instruction[] = await client.nos.transfer({
  to: 'recipient-address',
  amount: 1000000, // token base units (can be number or bigint)
  // from is optional - uses wallet if not provided
});

// Execute the transfer
// instructions is a tuple:
// - [TransferInstruction] when recipient ATA exists (1 instruction)
// - [CreateAssociatedTokenIdempotentInstruction, TransferInstruction] when ATA needs creation (2 instructions)
await client.solana.buildSignAndSend(instructions);
```

The function automatically:
- Finds the sender's associated token account
- Finds the recipient's associated token account
- Creates the recipient's ATA if it doesn't exist (returns 2 instructions: create ATA + transfer)
- Returns only the transfer instruction if the recipient's ATA already exists (returns 1 instruction)

## Type Definitions

```ts
import type { Address, TokenAccount, TokenAccountWithBalance } from '@nosana/kit';

interface TokenAccount {
  pubkey: Address;
  owner: Address;
  mint: Address;
  amount: bigint;
  decimals: number;
}

interface TokenAccountWithBalance extends TokenAccount {
  uiAmount: number; // Balance with decimals applied
}
```


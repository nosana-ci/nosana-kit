# Token Service

The TokenService provides methods to interact with token accounts on Solana. In the NosanaClient, it's configured for the NOS token and accessible via `client.nos`.

## Get All Token Holders

Fetch all accounts holding NOS tokens using a single RPC call.

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
import type { TokenAccountWithBalance } from '@nosana/kit';
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

## Get Balance

Convenience method to get the exact NOS balance for an address in token base units.

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
import { address } from '@nosana/kit';
const balance: bigint = await client.nos.getBalance(address('owner-address'));
console.log(`Balance: ${balance} base units`);
// Returns 0n if no token account exists
```

## Get Balance Info

Get the exact amount together with display-oriented token metadata.

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
import { address } from '@nosana/kit';
const balance = await client.nos.getBalanceInfo(address('owner-address'));
console.log(`Token Account: ${balance.tokenAccount}`);
console.log(`Balance: ${balance.uiAmount} NOS`);
console.log(`Raw Amount: ${balance.amount}`);
console.log(`Decimals: ${balance.decimals}`);
```

## Transfer Tokens

Get instruction(s) to transfer SPL tokens. Returns either 1 or 2 instructions depending on whether the recipient's associated token account needs to be created.

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
import type { Wallet } from '@nosana/kit';
import { generateKeyPairSigner } from '@solana/kit';
const client = createNosanaClient();
const myWallet: Wallet = await generateKeyPairSigner();
// ---cut---
import { address } from '@nosana/kit';
import type { Instruction } from '@solana/kit';

// Get transfer instruction(s)
const instructions: Instruction[] = await client.nos.transfer({
  to: address('recipient-address'),
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
- finds the sender's associated token account;
- finds the recipient's associated token account;
- creates the recipient's ATA if it doesn't exist (returns 2 instructions: create ATA + transfer);
- returns only the transfer instruction if the recipient's ATA already exists (returns 1 instruction).

## Type Definitions

```ts
import type { Address, TokenAccount, TokenAccountWithBalance, TokenBalanceInfo } from '@nosana/kit';

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

interface TokenBalanceInfo {
  owner: Address;
  mint: Address;
  tokenAccount: Address | null;
  amount: bigint;
  decimals: number;
  uiAmount: number;
}
```


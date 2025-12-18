# Transaction Examples

## Send a Single Instruction

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
import type { Instruction, Signature } from '@solana/kit';
const client = createNosanaClient();
// ---cut---
// Create an instruction
import { address } from '@nosana/kit';
const instruction: Instruction = await client.jobs.post({
  market: address('market-address'),
  timeout: 3600,
  ipfsHash: 'QmXxx...',
});

// Send it (convenience method)
const signature: Signature = await client.solana.buildSignAndSend(instruction);
console.log('Transaction signature:', signature);
```

## Send Multiple Instructions Atomically

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
import type { Instruction, Signature } from '@solana/kit';
const client = createNosanaClient();
// ---cut---
// Create multiple instructions
import { address } from '@nosana/kit';
const instruction1: Instruction = await client.jobs.post({
  market: address('market-address'),
  timeout: 3600,
  ipfsHash: 'QmXxx...',
});
const instruction2: Instruction = await client.solana.transfer({
  to: address('recipient-address'),
  amount: 1000000,
});

// Send them together in one transaction
const signature: Signature = await client.solana.buildSignAndSend([
  instruction1,
  instruction2,
]);
```

## Build, Sign, and Send Separately

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
import type { Instruction, Signature } from '@solana/kit';
const client = createNosanaClient();
// ---cut---
// Build transaction from instructions
import { address } from '@nosana/kit';
const instruction: Instruction = await client.jobs.post({
  market: address('market-address'),
  timeout: 3600,
  ipfsHash: 'QmXxx...',
});
const transactionMessage = await client.solana.buildTransaction(instruction);

// Sign the transaction
const signedTransaction = await client.solana.signTransaction(transactionMessage);

// Send and confirm
const signature: Signature = await client.solana.sendTransaction(signedTransaction, {
  commitment: 'confirmed',
});
```

## Transfer SOL

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
import type { Instruction } from '@solana/kit';
const client = createNosanaClient();
// ---cut---
// Get instruction to transfer SOL
import { address } from '@nosana/kit';
const transferSolIx: Instruction = await client.solana.transfer({
  to: address('recipient-address'),
  amount: 1000000, // lamports (can be number or bigint)
  // from is optional - uses wallet if not provided
});

// Execute the transfer
await client.solana.buildSignAndSend(transferSolIx);
```

## Transfer Tokens

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
import type { Instruction } from '@solana/kit';
const client = createNosanaClient();
// ---cut---
// Get transfer instruction(s)
// Returns 1 or 2 instructions depending on whether recipient ATA exists
import { address } from '@nosana/kit';
const instructions: Instruction[] = await client.nos.transfer({
  to: address('recipient-address'),
  amount: 1000000, // token base units
});

// Execute the transfer
await client.solana.buildSignAndSend(instructions);
```

## Derive PDA

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
import type { Address } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
// Derive program derived address
import { address } from '@nosana/kit';
const programAddress = address('program-address');
const pda: Address = await client.solana.pda(
  ['seed1', 'seed2'],
  programAddress
);
console.log('PDA:', pda);
```

## Check Balance

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
// Check account balance
import { address } from '@nosana/kit';
const balance: number = await client.solana.getBalance(address('address'));
console.log(`Balance: ${balance} lamports`);
```


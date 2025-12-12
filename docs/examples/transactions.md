# Transaction Examples

## Send a Single Instruction

```ts twoslash
import type { Instruction, Signature } from '@solana/kit';

// Create an instruction
const instruction: Instruction = await client.jobs.post({
  market: 'market-address',
  timeout: 3600,
  ipfsHash: 'QmXxx...',
});

// Send it (convenience method)
const signature: Signature = await client.solana.buildSignAndSend(instruction);
console.log('Transaction signature:', signature);
```

## Send Multiple Instructions Atomically

```ts twoslash
import type { Instruction, Signature } from '@solana/kit';

// Create multiple instructions
const instruction1: Instruction = await client.jobs.post({ /* ... */ });
const instruction2: Instruction = await client.solana.transfer({
  to: 'recipient-address',
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
import type { Instruction, Signature } from '@solana/kit';

// Build transaction from instructions
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
import type { Instruction } from '@solana/kit';

// Get instruction to transfer SOL
const transferSolIx: Instruction = await client.solana.transfer({
  to: 'recipient-address',
  amount: 1000000, // lamports (can be number or bigint)
  // from is optional - uses wallet if not provided
});

// Execute the transfer
await client.solana.buildSignAndSend(transferSolIx);
```

## Transfer Tokens

```ts twoslash
import type { Instruction } from '@solana/kit';

// Get transfer instruction(s)
// Returns 1 or 2 instructions depending on whether recipient ATA exists
const instructions: Instruction[] = await client.nos.transfer({
  to: 'recipient-address',
  amount: 1000000, // token base units
});

// Execute the transfer
await client.solana.buildSignAndSend(instructions);
```

## Derive PDA

```ts twoslash
import type { Address } from '@nosana/kit';

// Derive program derived address
const pda: Address = await client.solana.pda(
  ['seed1', 'seed2'],
  programAddress
);
console.log('PDA:', pda);
```

## Check Balance

```ts twoslash
// Check account balance
const balance: bigint = await client.solana.getBalance('address');
console.log(`Balance: ${balance} lamports`);
```


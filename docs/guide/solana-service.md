# Solana Service

General Solana utility service for low-level RPC operations, transactions, and PDA derivations.

## Methods

### Build, Sign, and Send (Convenience Method)

```ts
buildSignAndSend(
  instructions: Instruction | Instruction[],
  options?: {
    feePayer?: TransactionSigner;
    commitment?: 'processed' | 'confirmed' | 'finalized';
  }
): Promise<Signature>
```

### Build Transaction

```ts
buildTransaction(
  instructions: Instruction | Instruction[],
  options?: { feePayer?: TransactionSigner }
): Promise<TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithBlockhashLifetime>
```

### Sign Transaction

```ts
signTransaction(
  transactionMessage: TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithBlockhashLifetime
): Promise<SendableTransaction & Transaction & TransactionWithBlockhashLifetime>
```

### Send Transaction

```ts
sendTransaction(
  transaction: SendableTransaction & Transaction & TransactionWithBlockhashLifetime,
  options?: { commitment?: 'processed' | 'confirmed' | 'finalized' }
): Promise<Signature>
```

### Get Balance

```ts
getBalance(address?: Address | string): Promise<bigint>
```

### Derive PDA

```ts
pda(seeds: Array<Address | string>, programId: Address): Promise<Address>
```

### Transfer SOL

```ts
transfer(params: {
  to: Address | string;
  amount: number | bigint;
  from?: TransactionSigner;
}): Promise<Instruction> // Returns TransferSolInstruction
```

## Examples

```ts
// Send a single instruction (convenience method)
const signature: Signature = await client.solana.buildSignAndSend(instruction);

// Send multiple instructions atomically
const signature: Signature = await client.solana.buildSignAndSend([ix1, ix2, ix3]);

// Or build, sign, and send separately for more control
const transactionMessage = await client.solana.buildTransaction(instruction);
const signedTransaction = await client.solana.signTransaction(transactionMessage);
const signature: Signature = await client.solana.sendTransaction(signedTransaction);

// Check account balance
const balance: bigint = await client.solana.getBalance('address');
console.log(`Balance: ${balance} lamports`);

// Derive PDA
const pda: Address = await client.solana.pda(['seed1', 'seed2'], programAddress);

// Get instruction to transfer SOL
const transferSolIx: Instruction = await client.solana.transfer({
  to: 'recipient-address',
  amount: 1000000, // lamports (can be number or bigint)
  // from is optional - uses wallet if not provided
});

// Execute the transfer
await client.solana.buildSignAndSend(transferSolIx);
```


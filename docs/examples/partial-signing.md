# Partial Signing Examples

Examples demonstrating how to build transactions where the backend partially signs a transaction and the user (fee payer) signs later.

## Backend: Create and Partially Sign Transaction

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
import { generateKeyPairSigner, lamports } from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import type { KeyPairSigner } from '@solana/kit';

const client = createNosanaClient();
const backendSigner: KeyPairSigner = await generateKeyPairSigner();
// ---cut---
// Create an instruction that requires the backend signer
import { address } from '@nosana/kit';
const transferInstruction = getTransferSolInstruction({
  source: backendSigner,
  destination: address('user-address'),
  amount: lamports(1000n),
});

// Build the transaction with the USER's address as fee payer (not their signer!)
// This sets up the transaction so the user will pay fees but sign later
const transactionMessage = await client.solana.buildTransaction([transferInstruction], {
  feePayer: address('user-address'), // Just the address, not the signer
});

// Partially sign the transaction with embedded signers (backend's signer)
// The fee payer (user) has NOT signed yet
const partiallySignedTx = await client.solana.partiallySignTransaction(transactionMessage);

// Serialize for transmission to the user
const serializedTx = client.solana.serializeTransaction(partiallySignedTx);
console.log('Serialized transaction:', serializedTx);
```

## User: Receive, Verify, and Sign Transaction

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
import { generateKeyPairSigner } from '@solana/kit';
import type { KeyPairSigner } from '@solana/kit';

const client = createNosanaClient();
const userSigner: KeyPairSigner = await generateKeyPairSigner();
const serializedTx = 'base64-encoded-transaction-from-backend';
// ---cut---
// Deserialize the received transaction
const receivedTx = await client.solana.deserializeTransaction(serializedTx);

// (Optional) Decompile to inspect the transaction before signing
const decompiled = client.solana.decompileTransaction(receivedTx);

console.log('Decompiled transaction for inspection:');
console.log('  - Fee payer:', decompiled.feePayer);
console.log('  - Number of instructions:', decompiled.instructions.length);

// Verify the fee payer is the user's address
if (decompiled.feePayer.address !== userSigner.address) {
  throw new Error('Fee payer mismatch!');
}

// Sign with the user's signer (the fee payer)
const fullySignedTx = await client.solana.signTransactionWithSigners(receivedTx, [userSigner]);

// Send to the network
import type { Signature } from '@solana/kit';
const signature: Signature = await client.solana.sendTransaction(fullySignedTx);
console.log('Transaction sent:', signature);
```

## Multiple Backend Signers

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
import { generateKeyPairSigner, lamports } from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import type { KeyPairSigner } from '@solana/kit';

const client = createNosanaClient();
const backendSigner1: KeyPairSigner = await generateKeyPairSigner();
const backendSigner2: KeyPairSigner = await generateKeyPairSigner();
// ---cut---
// Create instructions that require multiple backend signers
import { address } from '@nosana/kit';
const instruction1 = getTransferSolInstruction({
  source: backendSigner1,
  destination: address('user-address'),
  amount: lamports(500n),
});

const instruction2 = getTransferSolInstruction({
  source: backendSigner2,
  destination: address('user-address'),
  amount: lamports(500n),
});

// Build with user as fee payer
const transactionMessage = await client.solana.buildTransaction([instruction1, instruction2], {
  feePayer: address('user-address'),
});

// Partially sign - both backend signers will sign
const partiallySignedTx = await client.solana.partiallySignTransaction(transactionMessage);

// Serialize and send to user
const serializedTx = client.solana.serializeTransaction(partiallySignedTx);
```

## Complete Flow Example

This example shows the complete flow from backend to user:

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
import { generateKeyPairSigner, lamports } from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import type { KeyPairSigner, Transaction, TransactionWithBlockhashLifetime } from '@solana/kit';

// Setup
const client = createNosanaClient();
const backendSigner: KeyPairSigner = await generateKeyPairSigner();
const userSigner: KeyPairSigner = await generateKeyPairSigner();
// ---cut---
// ============================================================
// BACKEND SIDE: Create and partially sign a transaction
// ============================================================

import { address } from '@nosana/kit';
const transferInstruction = getTransferSolInstruction({
  source: backendSigner,
  destination: userSigner.address,
  amount: lamports(1000n),
});

// Build with user's address as fee payer (not their signer!)
const transactionMessage = await client.solana.buildTransaction([transferInstruction], {
  feePayer: userSigner.address,
});

// Partially sign with backend's signer
const partiallySignedTx: Transaction & TransactionWithBlockhashLifetime = 
  await client.solana.partiallySignTransaction(transactionMessage);

// Serialize for transmission
const serializedTx = client.solana.serializeTransaction(partiallySignedTx);

// ============================================================
// USER SIDE: Receive, verify, sign, and send
// ============================================================

// Deserialize the received transaction
const receivedTx = await client.solana.deserializeTransaction(serializedTx);

// (Optional) Inspect before signing
const decompiled = client.solana.decompileTransaction(receivedTx);

// Verify fee payer
if (decompiled.feePayer.address !== userSigner.address) {
  throw new Error('Fee payer mismatch!');
}

// Sign with user's signer
const fullySignedTx = await client.solana.signTransactionWithSigners(receivedTx, [userSigner]);

// Send to network
import type { Signature } from '@solana/kit';
const signature: Signature = await client.solana.sendTransaction(fullySignedTx);
console.log('Transaction confirmed:', signature);
```

::: tip

**When to use partial signing:**

- Backend needs to sign instructions (e.g., transferring from backend-controlled accounts)
- User should pay transaction fees
- You want to separate backend and user signing responsibilities
- You need to serialize/transmit transactions between services

:::

::: warning

Always verify the transaction contents (using `decompileTransaction`) before signing on the user side to ensure the transaction matches expectations.

:::


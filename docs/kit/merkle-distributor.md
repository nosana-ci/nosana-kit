# Merkle Distributor Program

The MerkleDistributorProgram provides methods to interact with merkle distributor accounts and claim tokens from distributions.

## Get a Single Distributor

Fetch a merkle distributor account by its address.

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
import { address, MerkleDistributor } from '@nosana/kit';
const distributor: MerkleDistributor = await client.merkleDistributor.get(address('distributor-address'));

console.log('Distributor:', distributor.address);
console.log('Admin:', distributor.admin);
console.log('Mint:', distributor.mint);
console.log('Root:', distributor.root);
```

## Get All Distributors

Fetch all merkle distributor accounts.

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
import { MerkleDistributor } from '@nosana/kit';
const distributors: MerkleDistributor[] = await client.merkleDistributor.all();
console.log(`Found ${distributors.length} distributors`);
```

## Get Claim Status

Fetch claim status for a specific distributor and claimant.

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
import { address } from '@nosana/kit';
import type { ClaimStatus } from '@nosana/kit';
// Get claim status for the wallet's address
const claimStatus: ClaimStatus | null =
  await client.merkleDistributor.getClaimStatusForDistributor(address('distributor-address'));

// Or specify a claimant address
const claimStatus2: ClaimStatus | null = await client.merkleDistributor.getClaimStatusForDistributor(
  address('distributor-address'),
  address('claimant-address')
);

if (claimStatus2) {
  console.log('Claimed:', claimStatus2.unlockedAmountClaimed > 0);
  console.log('Amount Unlocked:', claimStatus2.unlockedAmount);
  console.log('Amount Locked:', claimStatus2.lockedAmount);
} else {
  console.log('No claim status found');
}
```

## Claim Tokens

Claim tokens from a merkle distributor.

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
import type { Wallet } from '@nosana/kit';
import { generateKeyPairSigner } from '@solana/kit';
const client = createNosanaClient();
const yourWallet: Wallet = await generateKeyPairSigner();
// ---cut---
import { address, ClaimTarget } from '@nosana/kit';
import type { Instruction } from '@solana/kit';

// Set wallet first
client.wallet = yourWallet;

// Claim tokens
const instruction: Instruction = await client.merkleDistributor.claim({
  distributor: address('distributor-address'),
  amountUnlocked: 1000000, // Amount in smallest unit
  amountLocked: 500000,
  proof: [
    /* merkle proof array */
  ],
  target: ClaimTarget.YES, // or ClaimTarget.NO
});

// Submit the instruction
await client.solana.buildSignAndSend(instruction);
```

## Type Definitions

```ts
interface MerkleDistributor {
  address: Address;
  admin: Address;
  mint: Address;
  root: string; // Base58 encoded merkle root
  buffer0: string;
  buffer1: string;
  buffer2: string;
  // ... additional fields
}

interface ClaimStatus {
  address: Address;
  distributor: Address;
  claimant: Address;
  lockedAmount: number;
  lockedAmountWithdrawn: number;
  unlockedAmount: number;
  unlockedAmountClaimed: number;
  closable: boolean;
}

enum ClaimTarget {
  YES = 'YES',
  NO = 'NO',
}
```


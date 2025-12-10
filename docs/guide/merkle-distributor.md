# Merkle Distributor Program

The MerkleDistributorProgram provides methods to interact with merkle distributor accounts and claim tokens from distributions.

## Get a Single Distributor

Fetch a merkle distributor account by its address:

```typescript
const distributor: MerkleDistributor = await client.merkleDistributor.get('distributor-address');

console.log('Distributor:', distributor.address);
console.log('Admin:', distributor.admin);
console.log('Mint:', distributor.mint);
console.log('Root:', distributor.root);
```

## Get All Distributors

Fetch all merkle distributor accounts:

```typescript
const distributors: MerkleDistributor[] = await client.merkleDistributor.all();
console.log(`Found ${distributors.length} distributors`);
```

## Get Claim Status

Fetch claim status for a specific distributor and claimant:

```typescript
// Get claim status for the wallet's address
const claimStatus: ClaimStatus | null =
  await client.merkleDistributor.getClaimStatusForDistributor('distributor-address');

// Or specify a claimant address
const claimStatus: ClaimStatus | null = await client.merkleDistributor.getClaimStatusForDistributor(
  'distributor-address',
  'claimant-address'
);

if (claimStatus) {
  console.log('Claimed:', claimStatus.claimed);
  console.log('Amount Unlocked:', claimStatus.amountUnlocked);
  console.log('Amount Locked:', claimStatus.amountLocked);
} else {
  console.log('No claim status found');
}
```

## Claim Tokens

Claim tokens from a merkle distributor:

```typescript
// Set wallet first
client.wallet = yourWallet;

// Claim tokens
const instruction: Instruction = await client.merkleDistributor.claim({
  distributor: 'distributor-address',
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

```typescript
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
  claimed: boolean;
  amountUnlocked: number;
  amountLocked: number;
}

enum ClaimTarget {
  YES = 'YES',
  NO = 'NO',
}
```


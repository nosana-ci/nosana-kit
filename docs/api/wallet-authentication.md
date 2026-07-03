---
title: Wallet Authentication
---

# Using the API with Wallet Authentication

When using the Nosana API with wallet authentication instead of an API key, you gain access to additional features like vault management for funding your deployments directly from your Solana wallet.

## Overview

There are two ways to authenticate with the Nosana API:

1. **API Key Authentication** - Simple, uses credits from your account balance
2. **Wallet Authentication** - Uses your Solana wallet, enables vault management

Wallet authentication is required for:
- Creating and managing vaults
- Topping up vaults with SOL or NOS
- Withdrawing funds from vaults
- Getting vault balances

## Using with @nosana/kit

The easiest way to use wallet authentication is with the `@nosana/kit` SDK, which automatically handles wallet signing and authentication.

For detailed information on configuring wallets, see the [Wallet Configuration](/kit/wallet) guide.

### Installation

```bash
npm install @nosana/kit
```

### Initialization

```ts
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

// Initialize with wallet instead of API key
const client = createNosanaClient({
  wallet: {
    // Your wallet configuration
    // This can be a Keypair, Wallet, or other wallet adapter
  },
});
```

When you use `@nosana/kit` with a wallet, it automatically:
- Creates `SignerAuth` from your wallet
- Handles message signing for authentication
- Provides Solana functions for vault operations

### Creating Deployments with Vault

```ts
// Create a deployment with wallet authentication
const deployment = await client.deployments.create({
  name: 'My Deployment',
  market: 'CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ',
  replicas: 1,
  timeout: 60,
  strategy: 'SIMPLE',
  job_definition: {
    // ... your job definition
  },
});

// The deployment includes a vault
console.log('Vault address:', deployment.vault.address);
```

For detailed information on managing vaults, see the [Vault Management](/api/vault-management) guide.

## Using @nosana/api Directly

If you're using `@nosana/api` directly (without `@nosana/kit`), you need to provide `SignerAuth` manually:

```ts
import { createNosanaApi, NosanaNetwork } from '@nosana/api';
import type { SignerAuth } from '@nosana/api';

const signerAuth: SignerAuth = {
  identifier: wallet.publicKey.toBase58(), // Your wallet's public key
  generate: async (message: string) => {
    // Sign the message with your wallet
    const signature = await wallet.signMessage(new TextEncoder().encode(message));
    return signature.toString('base64');
  },
  solana: {
    getBalance: async (address: string) => {
      // Implement balance fetching
      return { SOL: 0, NOS: 0 };
    },
    transferTokensToRecipient: async (recipient: string, tokens: { SOL?: number; NOS?: number }) => {
      // Implement token transfer
    },
    deserializeSignSendAndConfirmTransaction: async (transaction: string) => {
      // Implement transaction signing and sending
      return 'signature';
    },
  },
};

const api = createNosanaApi(NosanaNetwork.MAINNET, signerAuth);
```

## HTTP API with Wallet Authentication

If you're making direct HTTP requests, you need to:

1. **Sign a message** with your wallet
2. **Include the signed message** in the `Authorization` header
3. **Include your public key** in the `x-user-id` header

### Authentication Header Format

```
Authorization: NosanaApiAuthentication:<base64-encoded-signature>
x-user-id: <your-wallet-public-key>
```

### Example Request

```bash
# Sign the message "NosanaApiAuthentication" with your wallet
# Then include it in the Authorization header

curl -X POST https://dashboard.k8s.prd.nos.ci/api/deployments/vaults/create \
  -H "Authorization: NosanaApiAuthentication:<signed-message>" \
  -H "x-user-id: <your-public-key>" \
  -H "Content-Type: application/json"
```

For vault management endpoints and operations, see the [Vault Management](/api/vault-management) guide.

## Differences from API Key Authentication

| Feature | API Key | Wallet Authentication |
|---------|---------|----------------------|
| Authentication | `Bearer <api-key>` | `NosanaApiAuthentication:<signed-message>` |
| Funding | Uses account credits | Uses vault (SOL/NOS) |
| Vault Management | ❌ Not available | ✅ Full vault operations |
| Setup Complexity | Simple | Requires wallet setup |



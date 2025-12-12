# API Service

The API service provides access to Nosana APIs for jobs, credits, and markets. It's automatically configured based on your authentication method.

## Authentication Methods

The API service supports two authentication methods:

1. **API Key Authentication** (Recommended for server-side applications)
   - Provide an API key in the configuration
   - API key takes precedence over wallet-based authentication

2. **Wallet-Based Authentication** (For client-side applications)
   - Set a wallet on the client
   - Uses message signing for authentication
   - Automatically enabled when a wallet is configured

## Configuration

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
import type { Wallet } from '@nosana/kit';
import { generateKeyPairSigner } from '@solana/kit';
const myWallet: Wallet = await generateKeyPairSigner();
// ---cut---
// Option 1: Use API key (recommended for servers)
const client1 = createNosanaClient(NosanaNetwork.MAINNET, {
  api: {
    apiKey: 'your-api-key-here',
  },
});

// Option 2: Use wallet-based auth (for client-side)
const client2 = createNosanaClient(NosanaNetwork.MAINNET);
client2.wallet = myWallet;

// Option 3: API key takes precedence when both are provided
const client3 = createNosanaClient(NosanaNetwork.MAINNET, {
  api: {
    apiKey: 'your-api-key-here',
  },
  wallet: myWallet, // API key will be used, not wallet
});
```

## Behavior

- **With API Key**: API is created immediately with API key authentication
- **With Wallet**: API is created when wallet is set, using wallet-based authentication
- **Without Both**: API is `undefined` until either an API key or wallet is provided
- **Priority**: If both API key and wallet are provided, API key is used

## API Structure

The API service provides access to three main APIs:

```ts
client.api?.jobs    // Jobs API
client.api?.credits // Credits API
client.api?.markets // Markets API
```

## Examples

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
import type { Wallet } from '@nosana/kit';
import { generateKeyPairSigner } from '@solana/kit';
const myWallet: Wallet = await generateKeyPairSigner();
const anotherWallet: Wallet = await generateKeyPairSigner();
// ---cut---
// Using API key
const client1 = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: 'your-api-key' },
});

// API is immediately available
if (client1.api) {
  // Use the API - methods available on client1.api.jobs, client1.api.credits, client1.api.markets
}

// Using wallet-based auth
const client2 = createNosanaClient(NosanaNetwork.MAINNET);
client2.wallet = myWallet;

// API is now available
if (client2.api) {
  // Methods available on client2.api.jobs, client2.api.credits, client2.api.markets
}

// API updates reactively when wallet changes
client2.wallet = undefined; // API becomes undefined
client2.wallet = anotherWallet; // API is recreated with new wallet
```


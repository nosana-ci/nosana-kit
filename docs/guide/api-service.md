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

```ts
// Option 1: Use API key (recommended for servers)
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: {
    apiKey: 'your-api-key-here',
  },
});

// Option 2: Use wallet-based auth (for client-side)
const client = createNosanaClient(NosanaNetwork.MAINNET);
client.wallet = myWallet;

// Option 3: API key takes precedence when both are provided
const client = createNosanaClient(NosanaNetwork.MAINNET, {
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

```ts
// Using API key
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: 'your-api-key' },
});

// API is immediately available
if (client.api) {
  // Use the API
  const jobs = await client.api.jobs.list();
}

// Using wallet-based auth
const client = createNosanaClient(NosanaNetwork.MAINNET);
client.wallet = myWallet;

// API is now available
if (client.api) {
  const credits = await client.api.credits.get();
}

// API updates reactively when wallet changes
client.wallet = undefined; // API becomes undefined
client.wallet = anotherWallet; // API is recreated with new wallet
```


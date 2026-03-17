# @nosana/api

TypeScript SDK for the Nosana API.

## Installation

```bash
npm install @nosana/api
```

## Quick Start

```typescript
import { createNosanaApi, NosanaNetwork } from '@nosana/api';

// Create API instance
const api = createNosanaApi(NosanaNetwork.MAINNET, 'your-api-key');

// Use the API
const jobs = await api.jobs.list();
const credits = await api.credits.get();
```

## Authentication

### API Key
```typescript
const api = createNosanaApi(NosanaNetwork.MAINNET, 'your-api-key');
```

### SignerAuth (for vault operations)

SignerAuth enables wallet-based authentication and is required for deployment vault operations (balance, topup, withdraw).

```typescript
import type { SignerAuth } from '@nosana/api';

const signerAuth: SignerAuth = {
  identifier: 'wallet-public-key',
  generate: async (message: string) => {
    // Sign message with wallet
    return signedMessage;
  },
  solana: {
    getBalance: async (address: string) => ({ SOL: 0, NOS: 0 }),
    transferTokensToRecipient: async (recipient, tokens) => { /* ... */ },
    deserializeSignSendAndConfirmTransaction: async (tx) => 'signature',
  },
};

const api = createNosanaApi(NosanaNetwork.MAINNET, signerAuth);

// Use vault methods
const vault = await api.deployments.vaults.create();
await vault.topup({ NOS: 100 });
```

**Note:** When using `@nosana/kit`, SignerAuth is automatically created from your wallet.

## API Modules

- `api.jobs` - Job management
- `api.credits` - Credit balance
- `api.markets` - Market data
- `api.deployments` - Deployments and vaults

## Development

```bash
npm install
npm test
npm run build
```

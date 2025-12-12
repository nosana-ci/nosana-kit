# Configuration

## Networks

The SDK supports two networks:

- **`NosanaNetwork.MAINNET`** - Production network (mainnet-beta)
- **`NosanaNetwork.DEVNET`** - Development network (devnet)

## Configuration Options

```ts
import { createNosanaClient, NosanaNetwork, LogLevel } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  solana: {
    cluster: 'mainnet-beta',
    rpcEndpoint: 'https://api.mainnet-beta.solana.com',
    commitment: 'confirmed',
  },
  ipfs: {
    api: 'https://api.pinata.cloud',
    jwt: 'your-pinata-jwt-token',
    gateway: 'https://gateway.pinata.cloud/ipfs/',
  },
  api: {
    apiKey: 'your-api-key', // Optional: API key for authentication
  },
  logLevel: LogLevel.DEBUG,
  wallet: myWallet, // Optional: Set wallet during initialization (must be a Wallet type)
});
```

## Logging

Configure logging levels:

```ts
import { LogLevel } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  logLevel: LogLevel.DEBUG, // DEBUG | INFO | WARN | ERROR | NONE
});
```


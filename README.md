# Nosana Kit

A TypeScript SDK for interacting with the Nosana Network on Solana. This kit provides a comprehensive set of tools for managing jobs, markets, runs, and other Nosana protocol operations.

## Features

- 🚀 **Full TypeScript Support** - Complete type safety and IntelliSense
- 🔗 **Solana Integration** - Built on top of the new Solana Kit client
- 📦 **Jobs Management** - Create, manage, and monitor nosana jobs
- 🌐 **IPFS** - Seamless IPFS hash handling and conversions, uploading and retrieving
- ⚙️ **Configurable Networks** - Support for mainnet and devnet
- 🧪 **Comprehensive Testing** - Well-tested with high coverage
- 📝 **Rich Logging** - Built-in logging with configurable levels

## Installation

```bash
npm install @nosana/kit
```

## Quick Start

```typescript
import { NosanaClient, NosanaNetwork } from '@nosana/kit';

// Initialize client with default mainnet configuration
const client = new NosanaClient();

// Or specify network and custom configuration
const client = new NosanaClient(NosanaNetwork.DEVNET, {
  solana: {
    rpcEndpoint: 'https://your-custom-rpc.com',
    commitment: 'confirmed'
  }
});

// Fetch a job
const job = await client.jobs.get('your-job-address');
console.log('Job state:', job.state);

// Get all completed jobs for a market
const jobs = await client.jobs.all({ 
  market: 'market-address',
  state: 2 // completed jobs
});
```

## Configuration

### Network Configuration

The SDK supports two networks:

- `NosanaNetwork.MAINNET` - Production network
- `NosanaNetwork.DEVNET` - Development network

### Custom Configuration

```typescript
import { NosanaClient, NosanaNetwork, NosanaLogLevel } from '@nosana/kit';

const client = new NosanaClient(NosanaNetwork.MAINNET, {
  solana: {
    cluster: 'mainnet-beta',
    rpcEndpoint: 'https://your-rpc-endpoint.com',
    commitment: 'confirmed'
  },
  ipfs: {
    api: 'https://your-ipfs-api.com',
    jwt: 'your-jwt-token',
    gateway: 'https://your-ipfs-gateway.com'
  },
  logLevel: NosanaLogLevel.DEBUG
});
```

## API Reference

### NosanaClient

The main client class that provides access to all Nosana protocol features.

```typescript
class NosanaClient {
  constructor(network?: NosanaNetwork, customConfig?: PartialClientConfig)
  
  readonly config: ClientConfig
  readonly jobs: JobsProgram
  readonly solana: SolanaUtils
  readonly logger: Logger
}
```

### JobsProgram

Manages job-related operations on the Nosana network.

#### Methods

```typescript
// Fetch a single job
async get(address: Address, checkRun?: boolean): Promise<Job>

// Fetch a run
async run(address: Address): Promise<Run>

// Fetch a market
async market(address: Address): Promise<Market>

// Fetch multiple jobs
async multiple(addresses: Address[], checkRuns?: boolean): Promise<Job[]>

// Fetch all jobs with optional filters
async all(filters?: {
  state?: number,
  market?: Address,
  node?: Address,
  project?: Address,
}, checkRuns?: boolean): Promise<Job[]>

// Get runs with optional filters
async runs(filters?: {
  job?: Address,
  node?: Address,
}): Promise<Run[]>

// Get markets with optional filters
async markets(filters?: {
  project?: Address,
}): Promise<Market[]>
```

#### Account Types
...

## Error Handling

The SDK provides structured error handling with specific error codes:

```typescript
import { NosanaError, ErrorCodes } from '@nosana/kit';

try {
  const job = await client.jobs.get('invalid-address');
} catch (error) {
  if (error instanceof NosanaError) {
    switch (error.code) {
      case ErrorCodes.RPC_ERROR:
        console.log('RPC connection failed');
        break;
      case ErrorCodes.INVALID_CONFIG:
        console.log('Invalid configuration');
        break;
      default:
        console.log('Unknown error:', error.message);
    }
  }
}
```
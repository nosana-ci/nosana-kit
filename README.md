# Nosana Kit

TypeScript SDK for interacting with the Nosana Network on Solana. Provides comprehensive tools for managing jobs, markets, runs, and protocol operations on the Nosana decentralized compute network.

## Installation

```bash
npm install @nosana/kit
```

### Requirements

- Node.js >= 20.18.0
- TypeScript >= 5.3.0 (for development)

## Quick Start

```typescript
import { NosanaClient, NosanaNetwork } from '@nosana/kit';

// Initialize with mainnet defaults
const client = new NosanaClient();

// Or specify network and configuration
const client = new NosanaClient(NosanaNetwork.DEVNET, {
  solana: {
    rpcEndpoint: 'https://your-custom-rpc.com',
    commitment: 'confirmed'
  }
});

// Fetch a job by address
const job = await client.jobs.get('job-address');
console.log('Job state:', job.state);

// Query jobs with filters
const completedJobs = await client.jobs.all({ 
  market: 'market-address',
  state: 2  // JobState.COMPLETED
});
```

## Configuration

### Networks

The SDK supports two networks:

- **`NosanaNetwork.MAINNET`** - Production network (mainnet-beta)
- **`NosanaNetwork.DEVNET`** - Development network (devnet)

### Configuration Options

```typescript
import { NosanaClient, NosanaNetwork, NosanaLogLevel } from '@nosana/kit';

const client = new NosanaClient(NosanaNetwork.MAINNET, {
  solana: {
    cluster: 'mainnet-beta',
    rpcEndpoint: 'https://api.mainnet-beta.solana.com',
    commitment: 'confirmed'
  },
  ipfs: {
    api: 'https://api.pinata.cloud',
    jwt: 'your-pinata-jwt-token',
    gateway: 'https://gateway.pinata.cloud/ipfs/'
  },
  logLevel: NosanaLogLevel.DEBUG,
  wallet: keypairArray  // Optional: Set wallet during initialization
});
```

## Core Components

### NosanaClient

Main entry point for SDK interactions.

**Properties:**
- `config: ClientConfig` - Active configuration
- `jobs: JobsProgram` - Jobs program interface
- `solana: SolanaService` - Solana RPC and transaction utilities
- `ipfs: IPFS` - IPFS operations and utilities
- `logger: Logger` - Logging instance
- `wallet?: KeyPairSigner` - Active wallet (if set)

**Methods:**
- `setWallet(wallet: WalletConfig): Promise<KeyPairSigner>` - Set the signing wallet

### Wallet Configuration

The SDK supports multiple wallet input formats:

```typescript
// Number array (raw keypair)
await client.setWallet([1, 2, 3, ..., 64]);

// JSON string
await client.setWallet(JSON.stringify(keypairArray));

// Base58 string
await client.setWallet('base58EncodedPrivateKey');

// File path
await client.setWallet('/path/to/keypair.json');

// Environment variable (JSON array or base58)
process.env.SOLANA_PRIVATE_KEY = JSON.stringify(keypairArray);
await client.setWallet('env:SOLANA_PRIVATE_KEY');

// Browser wallet adapter
await client.setWallet(browserWalletAdapter);

// Existing KeyPairSigner (passthrough)
await client.setWallet(existingKeypairSigner);
```

## Jobs Program API

### Fetching Accounts

#### Get Single Job

```typescript
async get(address: Address, checkRun?: boolean): Promise<Job>
```

Fetch a job account. If `checkRun` is true (default), automatically checks for associated run accounts to determine if a queued job is actually running.

```typescript
const job = await client.jobs.get('job-address');
console.log(job.state);      // JobState enum
console.log(job.price);      // Job price in smallest unit
console.log(job.ipfsJob);    // IPFS CID of job definition
console.log(job.timeStart);  // Start timestamp (if running)
```

#### Get Single Run

```typescript
async run(address: Address): Promise<Run>
```

Fetch a run account by address.

```typescript
const run = await client.jobs.run('run-address');
console.log(run.job);   // Associated job address
console.log(run.node);  // Node executing the run
console.log(run.time);  // Run start time
```

#### Get Single Market

```typescript
async market(address: Address): Promise<Market>
```

Fetch a market account by address.

```typescript
const market = await client.jobs.market('market-address');
console.log(market.queueType);  // MarketQueueType enum
console.log(market.jobPrice);   // Market job price
```

#### Get Multiple Jobs

```typescript
async multiple(addresses: Address[], checkRuns?: boolean): Promise<Job[]>
```

Batch fetch multiple jobs by addresses.

```typescript
const jobs = await client.jobs.multiple([
  'job-address-1',
  'job-address-2',
  'job-address-3'
], true);
```

### Querying with Filters

#### Query All Jobs

```typescript
async all(filters?: {
  state?: JobState,
  market?: Address,
  node?: Address,
  project?: Address
}, checkRuns?: boolean): Promise<Job[]>
```

Fetch all jobs matching filter criteria using getProgramAccounts.

```typescript
import { JobState } from '@nosana/kit';

// Get all running jobs in a market
const runningJobs = await client.jobs.all({
  state: JobState.RUNNING,
  market: 'market-address'
});

// Get all jobs for a project
const projectJobs = await client.jobs.all({
  project: 'project-address'
});
```

#### Query All Runs

```typescript
async runs(filters?: {
  job?: Address,
  node?: Address
}): Promise<Run[]>
```

Fetch runs with optional filtering.

```typescript
// Get all runs for a specific job
const jobRuns = await client.jobs.runs({ job: 'job-address' });

// Get all runs on a specific node
const nodeRuns = await client.jobs.runs({ node: 'node-address' });
```

#### Query All Markets

```typescript
async markets(filters?: {
  project?: Address
}): Promise<Market[]>
```

Fetch markets with optional project filtering.

```typescript
const projectMarkets = await client.jobs.markets({ 
  project: 'project-address' 
});
```

### Creating Jobs

#### Post a Job

```typescript
async post(params: {
  market: Address,
  timeout: number | bigint,
  ipfsHash: string,
  node?: Address
}): Promise<Instruction>
```

Create a list instruction for posting a job to a market. Returns an instruction that must be submitted to the network.

```typescript
// Set wallet first
await client.setWallet(yourKeypair);

// Create job instruction
const instruction = await client.jobs.post({
  market: 'market-address',
  timeout: 3600,           // Timeout in seconds
  ipfsHash: 'QmXxx...',    // IPFS CID of job definition
  node: 'node-address'     // Optional: target specific node
});

// Submit the instruction
await client.solana.send(instruction);
```

### Real-time Monitoring

#### Monitor Account Updates

```typescript
async monitor(options?: {
  onJobAccount?: (job: Job) => void | Promise<void>,
  onMarketAccount?: (market: Market) => void | Promise<void>,
  onRunAccount?: (run: Run) => void | Promise<void>,
  onError?: (error: Error, accountType?: string) => void | Promise<void>
}): Promise<() => void>
```

Subscribe to real-time account updates via WebSocket. Includes automatic reconnection on failure.

```typescript
// Start monitoring
const stopMonitoring = await client.jobs.monitor({
  onJobAccount: async (job) => {
    console.log('Job update:', job.address, job.state);
    
    // Process updates - save to database, trigger workflows, etc.
    if (job.state === JobState.COMPLETED) {
      await processCompletedJob(job);
    }
  },
  onRunAccount: async (run) => {
    console.log('Run started:', run.job, 'on node', run.node);
  },
  onError: (error) => {
    console.error('Monitor error:', error);
  }
});

// Stop monitoring when done
stopMonitoring();
```

The monitor handles WebSocket reconnection automatically and continues processing updates until explicitly stopped.

## Account Types

### Job

```typescript
type Job = {
  address: Address;
  state: JobState;           // QUEUED | RUNNING | COMPLETED | STOPPED
  ipfsJob: string | null;    // IPFS CID of job definition
  ipfsResult: string | null; // IPFS CID of job result
  market: Address;
  node: Address;
  payer: Address;
  project: Address;
  price: number;
  timeStart: number;         // Unix timestamp
  timeEnd: number;           // Unix timestamp
  timeout: number;           // Seconds
};

enum JobState {
  QUEUED = 0,
  RUNNING = 1,
  COMPLETED = 2,
  STOPPED = 3
}
```

### Run

```typescript
type Run = {
  address: Address;
  job: Address;      // Associated job
  node: Address;     // Node executing the job
  time: number;      // Unix timestamp
};
```

### Market

```typescript
type Market = {
  address: Address;
  queueType: MarketQueueType;  // JOB_QUEUE | NODE_QUEUE
  jobPrice: number;
  nodeStakeMinimum: number;
  jobTimeout: number;
  jobType: number;
  project: Address;
  // ... additional fields
};

enum MarketQueueType {
  JOB_QUEUE = 0,
  NODE_QUEUE = 1
}
```

## Solana Service

Low-level Solana operations.

### Methods

```typescript
// Send transaction (instruction, array, or transaction object)
send(tx: IInstruction | IInstruction[] | Transaction): Promise<Signature>

// Get account balance
getBalance(address: Address | string): Promise<bigint>

// Get latest blockhash
getLatestBlockhash(): Promise<{ blockhash: string, lastValidBlockHeight: number }>

// Derive program derived address
pda(seeds: Array<Address | string>, programId: Address): Promise<Address>
```

### Examples

```typescript
// Send a single instruction
const signature = await client.solana.send(instruction);

// Send multiple instructions atomically
const signature = await client.solana.send([ix1, ix2, ix3]);

// Check account balance
const balance = await client.solana.getBalance('address');
console.log(`Balance: ${balance} lamports`);

// Derive PDA
const pda = await client.solana.pda(
  ['seed1', 'seed2'],
  programAddress
);
```

## IPFS Utilities

### Static Methods

```typescript
// Convert Solana hash to IPFS CID
IPFS.solHashToIpfsHash(hash: Uint8Array | number[]): string | null

// Convert IPFS hash to byte array
IPFS.IpfsHashToByteArray(ipfsHash: string): Uint8Array
```

### Instance Methods

```typescript
// Pin JSON data to Pinata
pin(data: object, name?: string): Promise<string>

// Pin file to Pinata
pinFile(filePath: string, name?: string): Promise<string>

// Pin buffer/stream to Pinata
pinFileFromBuffer(source: Buffer | Readable, filename: string): Promise<string>

// Retrieve data from IPFS
retrieve(hash: string | Uint8Array, options?: AxiosRequestConfig): Promise<any>
```

### Examples

```typescript
// Convert between Solana and IPFS hash formats
const ipfsCid = IPFS.solHashToIpfsHash(solanaHashBytes);
const solanaHash = IPFS.IpfsHashToByteArray(ipfsCid);

// Pin job definition
const cid = await client.ipfs.pin({
  version: 1,
  type: 'docker',
  image: 'ubuntu:latest',
  command: ['echo', 'hello']
}, 'job-definition');

// Retrieve job results
const results = await client.ipfs.retrieve(job.ipfsResult);
```

## Error Handling

The SDK provides structured error handling with specific error codes.

### NosanaError

```typescript
class NosanaError extends Error {
  code: string;
  details?: any;
}
```

### Error Codes

```typescript
enum ErrorCodes {
  INVALID_NETWORK = 'INVALID_NETWORK',
  INVALID_CONFIG = 'INVALID_CONFIG',
  RPC_ERROR = 'RPC_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  PROGRAM_ERROR = 'PROGRAM_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NO_WALLET = 'NO_WALLET',
  FILE_ERROR = 'FILE_ERROR',
  WALLET_CONVERSION_ERROR = 'WALLET_CONVERSION_ERROR'
}
```

### Examples

```typescript
import { NosanaError, ErrorCodes } from '@nosana/kit';

try {
  const job = await client.jobs.get('invalid-address');
} catch (error) {
  if (error instanceof NosanaError) {
    switch (error.code) {
      case ErrorCodes.RPC_ERROR:
        console.error('RPC connection failed:', error.message);
        break;
      case ErrorCodes.NO_WALLET:
        console.error('Wallet not configured');
        await client.setWallet(keypair);
        break;
      case ErrorCodes.TRANSACTION_ERROR:
        console.error('Transaction failed:', error.details);
        break;
      default:
        console.error('Unknown error:', error.message);
    }
  } else {
    throw error;  // Re-throw non-Nosana errors
  }
}
```

## Logging

The SDK includes a built-in singleton logger with configurable levels.

### Log Levels

```typescript
enum NosanaLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  NONE = 'none'
}
```

### Configuration

```typescript
import { NosanaClient, NosanaLogLevel } from '@nosana/kit';

// Set log level during initialization
const client = new NosanaClient(NosanaNetwork.MAINNET, {
  logLevel: NosanaLogLevel.DEBUG
});

// Access logger directly
client.logger.info('Information message');
client.logger.error('Error message');
client.logger.debug('Debug details');
```

## Testing

The SDK includes comprehensive test coverage.

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Development

```bash
# Build the SDK
npm run build

# Lint code
npm run lint

# Format code
npm run format

# Generate Solana program clients
npm run generate-clients
```

## TypeScript Support

The SDK is written in TypeScript and provides complete type definitions. All types are exported for use in your applications:

```typescript
import type { 
  Job, 
  Run, 
  Market, 
  JobState,
  MarketQueueType,
  ClientConfig,
  NosanaClient,
  KeyPairSigner,
  Address
} from '@nosana/kit';
```

## Dependencies

Core dependencies:
- `gill` ^0.9.0 - Solana web3 library
- `@solana-program/token` ^0.5.1 - Token program utilities
- `axios` ^1.6.0 - HTTP client
- `bs58` ^6.0.0 - Base58 encoding
- `form-data` ^4.0.0 - Multipart form data

## License

MIT

## Links

- [Nosana Documentation](https://docs.nosana.com)
- [Nosana Network](https://nosana.com)
- [GitHub Repository](https://github.com/nosana-ci/nosana-kit)
- [NPM Package](https://www.npmjs.com/package/@nosana/kit)

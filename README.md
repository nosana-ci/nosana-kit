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
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

// Initialize with mainnet defaults
const client = createNosanaClient();

// Or specify network and configuration
const client = createNosanaClient(NosanaNetwork.DEVNET, {
  solana: {
    rpcEndpoint: 'https://your-custom-rpc.com',
    commitment: 'confirmed',
  },
});

// Fetch a job by address
const job = await client.jobs.get('job-address');
console.log('Job state:', job.state);

// Query jobs with filters
const completedJobs = await client.jobs.all({
  market: 'market-address',
  state: 2, // JobState.COMPLETED
});
```

## Architecture

The SDK is organized into clear, purpose-driven modules using a factory function pattern:

- **`services/`** - Utility services and program interfaces
  - **`SolanaService`** - Low-level Solana RPC operations, transactions, and PDA derivations
  - **`TokenService`** - Token account operations (configured for NOS token)
  - **`programs/`** - On-chain program interfaces
    - **`JobsProgram`** - Jobs, runs, and markets management
    - **`StakeProgram`** - Staking account operations
    - **`MerkleDistributorProgram`** - Merkle distributor and claim operations
- **`ipfs/`** - IPFS integration for pinning and retrieving data
- **`config/`** - Network configurations and defaults
- **`utils/`** - Helper utilities and type conversions
- **`generated_clients/`** - Auto-generated Solana program clients (exported as namespaces)

The SDK uses factory functions (`createNosanaClient`, `createJobsProgram`, etc.) to build instances with dependency injection, making the architecture modular and testable.

## Configuration

### Networks

The SDK supports two networks:

- **`NosanaNetwork.MAINNET`** - Production network (mainnet-beta)
- **`NosanaNetwork.DEVNET`** - Development network (devnet)

### Configuration Options

```typescript
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
  logLevel: LogLevel.DEBUG,
  wallet: myWallet, // Optional: Set wallet during initialization (must be a Wallet type)
});
```

## Core Components

### NosanaClient

Main entry point for SDK interactions. Created using the `createNosanaClient()` factory function.

**Properties:**

- `config: ClientConfig` - Active configuration
- `jobs: JobsProgram` - Jobs program interface
- `stake: StakeProgram` - Staking program interface
- `merkleDistributor: MerkleDistributorProgram` - Merkle distributor program interface
- `solana: SolanaService` - General Solana utilities (RPC, transactions, PDAs)
- `nos: TokenService` - Token operations service (configured for NOS token)
- `ipfs: ReturnType<typeof createIpfsClient>` - IPFS operations for pinning and retrieving data
- `authorization: NosanaAuthorization | Omit<NosanaAuthorization, 'generate' | 'generateHeaders'>` - Authorization service for message signing and validation
- `logger: Logger` - Logging instance
- `wallet?: Wallet` - Active wallet (if set). Set this property directly to configure the wallet.

**Factory Function:**

- `createNosanaClient(network?: NosanaNetwork, customConfig?: PartialClientConfig): NosanaClient` - Creates a new client instance

### Wallet Configuration

The SDK uses a `Wallet` type that must support both message and transaction signing (`MessageSigner & TransactionSigner`). Set the wallet by directly assigning to the `wallet` property:

```typescript
import { createNosanaClient } from '@nosana/kit';
import type { Wallet } from '@nosana/kit';

// Create client
const client = createNosanaClient();

// Set wallet directly (must be a Wallet type that supports both message and transaction signing)
client.wallet = myWallet;

// The wallet can be set during initialization
const clientWithWallet = createNosanaClient(NosanaNetwork.MAINNET, {
  wallet: myWallet,
});
```

The wallet must implement both `MessageSigner` and `TransactionSigner` interfaces from `@solana/kit`. This allows the SDK to use the wallet for both message signing (for authentication) and transaction signing (for on-chain operations).

## Jobs Program API

### Fetching Accounts

#### Get Single Job

```typescript
async get(address: Address, checkRun?: boolean): Promise<Job>
```

Fetch a job account. If `checkRun` is true (default), automatically checks for associated run accounts to determine if a queued job is actually running.

```typescript
const job = await client.jobs.get('job-address');
console.log(job.state); // JobState enum
console.log(job.price); // Job price in smallest unit
console.log(job.ipfsJob); // IPFS CID of job definition
console.log(job.timeStart); // Start timestamp (if running)
```

#### Get Single Run

```typescript
async run(address: Address): Promise<Run>
```

Fetch a run account by address.

```typescript
const run = await client.jobs.run('run-address');
console.log(run.job); // Associated job address
console.log(run.node); // Node executing the run
console.log(run.time); // Run start time
```

#### Get Single Market

```typescript
async market(address: Address): Promise<Market>
```

Fetch a market account by address.

```typescript
const market = await client.jobs.market('market-address');
console.log(market.queueType); // MarketQueueType enum
console.log(market.jobPrice); // Market job price
```

#### Get Multiple Jobs

```typescript
async multiple(addresses: Address[], checkRuns?: boolean): Promise<Job[]>
```

Batch fetch multiple jobs by addresses.

```typescript
const jobs = await client.jobs.multiple(['job-address-1', 'job-address-2', 'job-address-3'], true);
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
  market: 'market-address',
});

// Get all jobs for a project
const projectJobs = await client.jobs.all({
  project: 'project-address',
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
async markets(): Promise<Market[]>
```

Fetch all market accounts.

```typescript
const markets = await client.jobs.markets();
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
client.wallet = yourWallet;

// Create job instruction
const instruction = await client.jobs.post({
  market: 'market-address',
  timeout: 3600, // Timeout in seconds
  ipfsHash: 'QmXxx...', // IPFS CID of job definition
  node: 'node-address', // Optional: target specific node
});

// Submit the instruction
await client.solana.buildSignAndSend(instruction);
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
  },
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
  state: JobState; // QUEUED | RUNNING | COMPLETED | STOPPED
  ipfsJob: string | null; // IPFS CID of job definition
  ipfsResult: string | null; // IPFS CID of job result
  market: Address;
  node: Address;
  payer: Address;
  project: Address;
  price: number;
  timeStart: number; // Unix timestamp
  timeEnd: number; // Unix timestamp
  timeout: number; // Seconds
};

enum JobState {
  QUEUED = 0,
  RUNNING = 1,
  COMPLETED = 2,
  STOPPED = 3,
}
```

### Run

```typescript
type Run = {
  address: Address;
  job: Address; // Associated job
  node: Address; // Node executing the job
  time: number; // Unix timestamp
};
```

### Market

```typescript
type Market = {
  address: Address;
  queueType: MarketQueueType; // JOB_QUEUE | NODE_QUEUE
  jobPrice: number;
  nodeStakeMinimum: number;
  jobTimeout: number;
  jobType: number;
  project: Address;
  // ... additional fields
};

enum MarketQueueType {
  JOB_QUEUE = 0,
  NODE_QUEUE = 1,
}
```

## Solana Service

General Solana utility service for low-level RPC operations, transactions, and PDA derivations.

### Methods

```typescript
// Build, sign, and send transaction in one call (convenience method)
buildSignAndSend(
  instructions: Instruction | Instruction[],
  options?: {
    feePayer?: TransactionSigner;
    commitment?: 'processed' | 'confirmed' | 'finalized';
  }
): Promise<Signature>

// Build transaction from instructions
buildTransaction(
  instructions: Instruction | Instruction[],
  options?: { feePayer?: TransactionSigner }
): Promise<TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithBlockhashLifetime>

// Sign a transaction message
signTransaction(
  transactionMessage: TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithBlockhashLifetime
): Promise<SendableTransaction & Transaction & TransactionWithBlockhashLifetime>

// Send and confirm a signed transaction
sendTransaction(
  transaction: SendableTransaction & Transaction & TransactionWithBlockhashLifetime,
  options?: { commitment?: 'processed' | 'confirmed' | 'finalized' }
): Promise<Signature>

// Get account balance
getBalance(address?: Address | string): Promise<bigint>

// Derive program derived address
pda(seeds: Array<Address | string>, programId: Address): Promise<Address>
```

### Examples

```typescript
// Send a single instruction (convenience method)
const signature = await client.solana.buildSignAndSend(instruction);

// Send multiple instructions atomically
const signature = await client.solana.buildSignAndSend([ix1, ix2, ix3]);

// Or build, sign, and send separately for more control
const transactionMessage = await client.solana.buildTransaction(instruction);
const signedTransaction = await client.solana.signTransaction(transactionMessage);
const signature = await client.solana.sendTransaction(signedTransaction);

// Check account balance
const balance = await client.solana.getBalance('address');
console.log(`Balance: ${balance} lamports`);

// Derive PDA
const pda = await client.solana.pda(['seed1', 'seed2'], programAddress);
```

## IPFS Service

The IPFS service provides methods to pin data to IPFS and retrieve data from IPFS. It's configured via the `ipfs` property in the client configuration.

### Configuration

```typescript
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  ipfs: {
    api: 'https://api.pinata.cloud',
    jwt: 'your-pinata-jwt-token',
    gateway: 'https://gateway.pinata.cloud/ipfs/',
  },
});
```

### Methods

```typescript
// Pin JSON data to IPFS
pin(data: object): Promise<string>

// Pin a file to IPFS
pinFile(filePath: string): Promise<string>

// Retrieve data from IPFS
retrieve(hash: string | Uint8Array): Promise<any>
```

### Examples

```typescript
// Pin job definition to IPFS
const cid = await client.ipfs.pin({
  version: 1,
  type: 'docker',
  image: 'ubuntu:latest',
  command: ['echo', 'hello'],
});
console.log('Pinned to IPFS:', cid);

// Pin a file to IPFS
const fileCid = await client.ipfs.pinFile('/path/to/file.txt');

// Retrieve job results from IPFS
const results = await client.ipfs.retrieve(job.ipfsResult);
console.log('Job results:', results);
```

### Utility Functions

The SDK also exports utility functions for converting between Solana hash formats and IPFS CIDs:

```typescript
import { solBytesArrayToIpfsHash, ipfsHashToSolBytesArray } from '@nosana/kit';

// Convert Solana hash bytes to IPFS CID
const ipfsCid = solBytesArrayToIpfsHash(solanaHashBytes);

// Convert IPFS CID to Solana hash bytes
const solanaHash = ipfsHashToSolBytesArray(ipfsCid);
```

## Authorization Service

The authorization service provides cryptographic message signing and validation using Ed25519 signatures. It's automatically available on the client and adapts based on whether a wallet is configured.

### Behavior

- **With Wallet**: When a wallet is set, the authorization service provides all methods including `generate`, `validate`, `generateHeaders`, and `validateHeaders`.
- **Without Wallet**: When no wallet is set, the authorization service only provides `validate` and `validateHeaders` methods (read-only validation).

### Methods

```typescript
// Generate a signed message (requires wallet)
generate(message: string | Uint8Array, options?: GenerateOptions): Promise<string>

// Validate a signed message
validate(
  message: string | Uint8Array,
  signature: string | Uint8Array,
  publicKey?: string | Uint8Array
): Promise<boolean>

// Generate signed HTTP headers (requires wallet)
generateHeaders(
  method: string,
  path: string,
  body?: string | Uint8Array,
  options?: GenerateHeaderOptions
): Promise<Headers>

// Validate HTTP headers
validateHeaders(headers: Headers | Record<string, string>): Promise<boolean>
```

### Examples

```typescript
// Set wallet first to enable signing
client.wallet = myWallet;

// Generate a signed message
const signedMessage = await client.authorization.generate('Hello, Nosana!');
console.log('Signed message:', signedMessage);

// Validate a signed message
const isValid = await client.authorization.validate('Hello, Nosana!', signedMessage);
console.log('Message is valid:', isValid);

// Generate signed HTTP headers for API requests
const headers = await client.authorization.generateHeaders(
  'POST',
  '/api/jobs',
  JSON.stringify({ data: 'example' })
);

// Use headers in HTTP request
fetch('https://api.nosana.com/api/jobs', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({ data: 'example' }),
});

// Validate incoming HTTP headers
const isValidRequest = await client.authorization.validateHeaders(requestHeaders);
if (!isValidRequest) {
  throw new Error('Invalid authorization');
}
```

### Use Cases

- **API Authentication**: Sign requests to Nosana APIs using message signatures
- **Message Verification**: Verify signed messages from other parties
- **Secure Communication**: Establish authenticated communication channels
- **Request Authorization**: Validate incoming API requests

## Merkle Distributor Program

The MerkleDistributorProgram provides methods to interact with merkle distributor accounts and claim tokens from distributions.

### Get a Single Distributor

Fetch a merkle distributor account by its address:

```typescript
const distributor = await client.merkleDistributor.get('distributor-address');

console.log('Distributor:', distributor.address);
console.log('Admin:', distributor.admin);
console.log('Mint:', distributor.mint);
console.log('Root:', distributor.root);
```

### Get All Distributors

Fetch all merkle distributor accounts:

```typescript
const distributors = await client.merkleDistributor.all();
console.log(`Found ${distributors.length} distributors`);
```

### Get Claim Status

Fetch claim status for a specific distributor and claimant:

```typescript
// Get claim status for the wallet's address
const claimStatus =
  await client.merkleDistributor.getClaimStatusForDistributor('distributor-address');

// Or specify a claimant address
const claimStatus = await client.merkleDistributor.getClaimStatusForDistributor(
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

### Get Claim Status PDA

Derive the ClaimStatus PDA address:

```typescript
// Derive for wallet's address
const pda = await client.merkleDistributor.getClaimStatusPda('distributor-address');

// Or specify a claimant address
const pda = await client.merkleDistributor.getClaimStatusPda(
  'distributor-address',
  'claimant-address'
);
```

### Claim Tokens

Claim tokens from a merkle distributor:

```typescript
// Set wallet first
client.wallet = yourWallet;

// Claim tokens
const instruction = await client.merkleDistributor.claim({
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

### Clawback Tokens

Clawback tokens from a merkle distributor (admin only):

```typescript
// Set wallet first (must be admin)
client.wallet = adminWallet;

// Clawback tokens
const instruction = await client.merkleDistributor.clawback({
  distributor: 'distributor-address',
});

// Submit the instruction
await client.solana.buildSignAndSend(instruction);
```

### Type Definitions

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

### Use Cases

- **Airdrop Claims**: Allow users to claim tokens from merkle tree distributions
- **Reward Distribution**: Distribute rewards to eligible addresses
- **Token Vesting**: Manage locked and unlocked token distributions
- **Governance**: Distribute governance tokens to eligible participants

## Staking Program

The StakeProgram provides methods to interact with Nosana staking accounts on-chain.

### Get a Single Stake Account

Fetch a stake account by its address:

```typescript
const stake = await client.stake.get('stake-account-address');

console.log('Stake Account:', stake.address);
console.log('Authority:', stake.authority);
console.log('Staked Amount:', stake.amount);
console.log('xNOS Tokens:', stake.xnos);
console.log('Duration:', stake.duration);
console.log('Time to Unstake:', stake.timeUnstake);
console.log('Vault:', stake.vault);
```

### Get Multiple Stake Accounts

Fetch multiple stake accounts by their addresses:

```typescript
const addresses = ['address1', 'address2', 'address3'];
const stakes = await client.stake.multiple(addresses);

stakes.forEach((stake) => {
  console.log(`${stake.address}: ${stake.amount} staked`);
});
```

### Get All Stake Accounts

Fetch all stake accounts in the program:

```typescript
// Get all stakes
const allStakes = await client.stake.all();
console.log(`Found ${allStakes.length} stake accounts`);
```

### Type Definitions

```typescript
interface Stake {
  address: Address;
  amount: number;
  authority: Address;
  duration: number;
  timeUnstake: number;
  vault: Address;
  vaultBump: number;
  xnos: number;
}
```

### Use Cases

- **Portfolio Tracking**: Monitor your staked NOS tokens
- **Analytics**: Analyze staking patterns and distributions
- **Governance**: Check voting power based on staked amounts
- **Rewards Calculation**: Calculate rewards based on stake duration and amount

### Example: Analyze Staking Distribution

```typescript
const allStakes = await client.stake.all();

// Calculate total staked
const totalStaked = allStakes.reduce((sum, stake) => sum + stake.amount, 0);

// Find average stake
const averageStake = totalStaked / allStakes.length;

// Find largest stake
const largestStake = allStakes.reduce((max, stake) => Math.max(max, stake.amount), 0);

console.log('Staking Statistics:');
console.log(`Total Staked: ${totalStaked.toLocaleString()} NOS`);
console.log(`Average Stake: ${averageStake.toLocaleString()} NOS`);
console.log(`Largest Stake: ${largestStake.toLocaleString()} NOS`);
console.log(`Number of Stakers: ${allStakes.length}`);
```

## Token Service

The TokenService provides methods to interact with token accounts on Solana. In the NosanaClient, it's configured for the NOS token and accessible via `client.nos`.

### Get All Token Holders

Fetch all accounts holding NOS tokens using a single RPC call:

```typescript
// Get all holders (excludes zero balance accounts by default)
const holders = await client.nos.getAllTokenHolders();

console.log(`Found ${holders.length} NOS token holders`);

holders.forEach((holder) => {
  console.log(`${holder.owner}: ${holder.uiAmount} NOS`);
});

// Include accounts with zero balance
const allAccounts = await client.nos.getAllTokenHolders({ includeZeroBalance: true });
console.log(`Total accounts: ${allAccounts.length}`);

// Exclude PDA accounts (smart contract-owned token accounts)
const userAccounts = await client.nos.getAllTokenHolders({ excludePdaAccounts: true });
console.log(`User-owned accounts: ${userAccounts.length}`);

// Combine filters
const activeUsers = await client.nos.getAllTokenHolders({
  includeZeroBalance: false,
  excludePdaAccounts: true,
});
console.log(`Active user accounts: ${activeUsers.length}`);
```

### Get Token Account for Address

Retrieve the NOS token account for a specific owner:

```typescript
const account = await client.nos.getTokenAccountForAddress('owner-address');

if (account) {
  console.log('Token Account:', account.pubkey);
  console.log('Owner:', account.owner);
  console.log('Balance:', account.uiAmount, 'NOS');
  console.log('Raw Amount:', account.amount.toString());
  console.log('Decimals:', account.decimals);
} else {
  console.log('No NOS token account found');
}
```

### Get Balance

Convenience method to get just the NOS balance for an address:

```typescript
const balance = await client.nos.getBalance('owner-address');
console.log(`Balance: ${balance} NOS`);
// Returns 0 if no token account exists
```

### Type Definitions

```typescript
interface TokenAccount {
  pubkey: Address;
  owner: Address;
  mint: Address;
  amount: bigint;
  decimals: number;
}

interface TokenAccountWithBalance extends TokenAccount {
  uiAmount: number; // Balance with decimals applied
}
```

### Use Cases

- **Analytics**: Analyze token distribution and holder statistics
- **Airdrops**: Get list of all token holders for campaigns
- **Balance Checks**: Check NOS balances for specific addresses
- **Leaderboards**: Create holder rankings sorted by balance
- **Monitoring**: Track large holder movements

### Example: Filter Large Holders

```typescript
const holders = await client.nos.getAllTokenHolders();

// Find holders with at least 1000 NOS
const largeHolders = holders.filter((h) => h.uiAmount >= 1000);

// Sort by balance descending
largeHolders.sort((a, b) => b.uiAmount - a.uiAmount);

// Display top 10
largeHolders.slice(0, 10).forEach((holder, i) => {
  console.log(`${i + 1}. ${holder.owner}: ${holder.uiAmount.toLocaleString()} NOS`);
});
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
  WALLET_CONVERSION_ERROR = 'WALLET_CONVERSION_ERROR',
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
        client.wallet = myWallet;
        break;
      case ErrorCodes.TRANSACTION_ERROR:
        console.error('Transaction failed:', error.details);
        break;
      default:
        console.error('Unknown error:', error.message);
    }
  } else {
    throw error; // Re-throw non-Nosana errors
  }
}
```

## Logging

The SDK includes a built-in singleton logger with configurable levels.

### Log Levels

```typescript
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  NONE = 'none',
}
```

### Configuration

```typescript
import { createNosanaClient, LogLevel } from '@nosana/kit';

// Set log level during initialization
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  logLevel: LogLevel.DEBUG,
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
  Stake,
  MerkleDistributor,
  ClaimStatus,
  ClaimTarget,
  ClientConfig,
  NosanaClient,
  Wallet,
} from '@nosana/kit';
import type { Address } from '@solana/kit';
```

## Dependencies

Core dependencies:

- `@solana/kit` ^5.0.0 - Solana web3 library
- `@solana-program/token` ^0.8.0 - Token program utilities
- `@solana-program/system` ^0.10.0 - System program utilities
- `@solana-program/compute-budget` ^0.11.0 - Compute budget utilities
- `bs58` ^6.0.0 - Base58 encoding

## License

MIT

## Links

- [Nosana Documentation](https://docs.nosana.com)
- [Nosana Network](https://nosana.com)
- [GitHub Repository](https://github.com/nosana-ci/nosana-kit)
- [NPM Package](https://www.npmjs.com/package/@nosana/kit)

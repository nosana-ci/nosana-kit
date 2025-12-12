# Jobs Program

The Jobs Program provides methods to interact with jobs, runs, and markets on the Nosana Network.

## Fetching Accounts

### Get Single Job

```ts
async get(address: Address, checkRun?: boolean): Promise<Job>
```

Fetch a job account. If `checkRun` is true (default), automatically checks for associated run accounts to determine if a queued job is actually running.

```ts
const job: Job = await client.jobs.get('job-address');
console.log(job.state); // JobState enum
console.log(job.price); // Job price in smallest unit
console.log(job.ipfsJob); // IPFS CID of job definition
console.log(job.timeStart); // Start timestamp (if running)
```

### Get Single Run

```ts
async run(address: Address): Promise<Run>
```

Fetch a run account by address.

```ts
const run: Run = await client.jobs.run('run-address');
console.log(run.job); // Associated job address
console.log(run.node); // Node executing the run
console.log(run.time); // Run start time
```

### Get Single Market

```ts
async market(address: Address): Promise<Market>
```

Fetch a market account by address.

```ts
const market: Market = await client.jobs.market('market-address');
console.log(market.queueType); // MarketQueueType enum
console.log(market.jobPrice); // Market job price
```

### Get Multiple Jobs

```ts
async multiple(addresses: Address[], checkRuns?: boolean): Promise<Job[]>
```

Batch fetch multiple jobs by addresses.

```ts
const jobs: Job[] = await client.jobs.multiple(['job-address-1', 'job-address-2', 'job-address-3'], true);
```

## Querying with Filters

### Query All Jobs

```ts
async all(filters?: {
  state?: JobState,
  market?: Address,
  node?: Address,
  project?: Address
}, checkRuns?: boolean): Promise<Job[]>
```

Fetch all jobs matching filter criteria using getProgramAccounts.

```ts
import { JobState } from '@nosana/kit';

// Get all running jobs in a market
const runningJobs: Job[] = await client.jobs.all({
  state: JobState.RUNNING,
  market: 'market-address',
});

// Get all jobs for a project
const projectJobs: Job[] = await client.jobs.all({
  project: 'project-address',
});
```

### Query All Runs

```ts
async runs(filters?: {
  job?: Address,
  node?: Address
}): Promise<Run[]>
```

Fetch runs with optional filtering.

```ts
// Get all runs for a specific job
const jobRuns: Run[] = await client.jobs.runs({ job: 'job-address' });

// Get all runs on a specific node
const nodeRuns: Run[] = await client.jobs.runs({ node: 'node-address' });
```

### Query All Markets

```ts
async markets(): Promise<Market[]>
```

Fetch all market accounts.

```ts
const markets: Market[] = await client.jobs.markets();
```

## Creating Jobs

### Post a Job

```ts
async post(params: {
  market: Address,
  timeout: number | bigint,
  ipfsHash: string,
  node?: Address
}): Promise<Instruction>
```

Create a list instruction for posting a job to a market. Returns an instruction that must be submitted to the network.

```ts
// Set wallet first
client.wallet = yourWallet;

// Create job instruction
const instruction: Instruction = await client.jobs.post({
  market: 'market-address',
  timeout: 3600, // Timeout in seconds
  ipfsHash: 'QmXxx...', // IPFS CID of job definition
  node: 'node-address', // Optional: target specific node
});

// Submit the instruction
await client.solana.buildSignAndSend(instruction);
```

## Real-time Monitoring

The SDK provides monitoring methods using async iterators for real-time account updates via WebSocket. See the [Examples](/examples/jobs) section for detailed monitoring examples.

## Account Types

### Job

```ts
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

```ts
type Run = {
  address: Address;
  job: Address; // Associated job
  node: Address; // Node executing the job
  time: number; // Unix timestamp
};
```

### Market

```ts
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


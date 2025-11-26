# Test Helpers & Factories

This directory contains reusable test utilities and factory functions that make tests more maintainable, readable, and easier to write.

## Purpose

Test factories provide:

- **Consistent test data** with sensible defaults
- **Reduced boilerplate** in test files
- **Clear intent** - factory names describe what's being created
- **Easy customization** - override only what you need
- **Type safety** - full TypeScript support

## Usage

### Import

```typescript
import {
  AddressFactory,
  MockClientFactory,
  JobAccountFactory,
  RunAccountFactory,
  MarketAccountFactory,
  IpfsFactory,
  ConfigFactory,
  MockBuilder,
  ScenarioBuilder,
} from './helpers/index.js';
```

## Factories

### AddressFactory

Creates Solana addresses for testing.

```typescript
// Create a unique address (auto-incrementing seed)
const addr1 = AddressFactory.create();
const addr2 = AddressFactory.create(); // Different from addr1

// Create address with specific seed
const addr3 = AddressFactory.create(42);

// Create a valid 32-byte address
const validAddr = AddressFactory.createValid();

// Reset counter (useful in beforeEach)
AddressFactory.reset();
```

### MockClientFactory

Creates mock NosanaClient instances for testing.
Use ClientFactory for real client instances.

```typescript
// Basic mock client
const sdk = MockClientFactory.createBasic();

// Mock client with RPC mocking for testing getProgramAccounts
const { sdk, sentArgs } = MockClientFactory.createWithRpc();
await sdk.solana.rpc.getProgramAccounts(...);
// Check what arguments were sent
console.log(sentArgs);

// Mock client with WebSocket subscriptions
const sdk = MockClientFactory.createWithSubscriptions();

// Mock client with wallet
const sdk = MockClientFactory.createWithWallet();
```

### JobAccountFactory

Creates job account test data.

```typescript
// Basic job with defaults
const job = JobAccountFactory.create();

// Job with custom state
const job = JobAccountFactory.create({ state: JobState.RUNNING });

// Job with custom address and price
const job = JobAccountFactory.create({
  address: myAddress,
  price: BigInt(500),
});

// Pre-configured factories
const queuedJob = JobAccountFactory.createQueued();
const runningJob = JobAccountFactory.createRunning();
const completedJob = JobAccountFactory.createCompleted();

// Multiple jobs
const jobs = JobAccountFactory.createMany(10, JobState.QUEUED);
```

**Default values:**

- `price`: BigInt(1)
- `state`: JobState.QUEUED
- `timeStart`: BigInt(0)
- `timeEnd`: BigInt(0)
- `timeout`: BigInt(0)

### RunAccountFactory

Creates run account test data.

```typescript
// Basic run
const run = RunAccountFactory.create();

// Run with custom properties
const run = RunAccountFactory.create({
  job: jobAddress,
  time: BigInt(1234567890),
  node: nodeAddress,
});

// Run for a specific job
const run = RunAccountFactory.createForJob(jobAddress);

// Multiple runs
const runs = RunAccountFactory.createMany(5, jobAddress);
```

### MarketAccountFactory

Creates market account test data.

```typescript
// Basic market
const market = MarketAccountFactory.create();

// Market with custom properties
const market = MarketAccountFactory.create({
  jobPrice: BigInt(100),
  jobTimeout: BigInt(7200),
});

// Pre-configured factories
const jobQueue = MarketAccountFactory.createJobQueue();
const nodeQueue = MarketAccountFactory.createNodeQueue();

// Multiple markets
const markets = MarketAccountFactory.createMany(3);
```

**Default values:**

- `nodeXnosMinimum`: BigInt(5)
- `jobPrice`: BigInt(10)
- `jobTimeout`: BigInt(200)
- `queueType`: MarketQueueType.NODE_QUEUE

### IpfsFactory

Creates IPFS-related test data.

```typescript
// 32-byte hash
const hash = IpfsFactory.createHashBytes(seed);

// Empty/null hash
const emptyHash = IpfsFactory.createEmptyHash();

// IPFS CID string
const cid = IpfsFactory.createCid();

// File buffer
const buffer = IpfsFactory.createFileBuffer('custom content');
```

### ConfigFactory

Creates configuration objects.

```typescript
// IPFS config
const ipfsConfig = ConfigFactory.createIpfsConfig({
  api: 'https://custom-api.example',
  jwt: 'my-token',
});

// Solana config
const solanaConfig = ConfigFactory.createSolanaConfig({
  rpcEndpoint: 'https://my-rpc.example',
  cluster: 'devnet',
});
```

### ScenarioBuilder

Creates common test scenarios.

```typescript
// Job lifecycle (queued -> running -> completed)
const { queued, running, completed } = ScenarioBuilder.createJobLifecycle(jobAddr);

// Market with jobs
const { market, jobs } = ScenarioBuilder.createMarketWithJobs(5);

// Job with runs
const { job, runs } = ScenarioBuilder.createJobWithRuns(3);
```

## Best Practices

### 1. Use Factories in Tests

**Before:**

```typescript
const job = {
  address: address('...'),
  data: {
    discriminator: new Uint8Array(8),
    ipfsJob: new Uint8Array(32).map((_, i) => i),
    ipfsResult: new Uint8Array(32).map((_, i) => i),
    market: address('...'),
    // ... many more fields
  },
} as any;
```

**After:**

```typescript
const job = JobAccountFactory.createQueued();
```

### 2. Override Only What Matters

```typescript
// Good: Override only what's relevant to the test
const job = JobAccountFactory.create({
  state: JobState.COMPLETED,
  timeEnd: BigInt(Date.now()),
});

// Avoid: Creating everything from scratch
```

### 3. Use beforeEach for Cleanup

```typescript
beforeEach(() => {
  AddressFactory.reset(); // Reset counters for consistent tests
  vi.clearAllMocks();
});
```

### 4. Use Scenario Builders for Complex Tests

```typescript
// Testing job lifecycle
it('transitions job through states', () => {
  const { queued, running, completed } = ScenarioBuilder.createJobLifecycle(addr);

  expect(queued.data.state).toBe(JobState.QUEUED);
  expect(running.data.state).toBe(JobState.RUNNING);
  expect(completed.data.state).toBe(JobState.COMPLETED);
});
```

### 5. Descriptive Test Names

Factories make test intentions clear:

```typescript
// Clear what's being tested
it('transforms completed job correctly', () => {
  const job = JobAccountFactory.createCompleted();
  const result = transform(job);
  expect(result.state).toBe(JobState.COMPLETED);
});
```

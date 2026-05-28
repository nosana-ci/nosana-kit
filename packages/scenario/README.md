# @nosana/scenario

Network-aware scenario test helpers for Nosana. Run the same tests against localnet, devnet, or mainnet — controlled entirely via environment variables.

Uses [`@nosana/localnet`](../localnet) for Docker infrastructure and [`@nosana/kit`](../kit) for the Nosana SDK.

## Quick Start

```bash
npm install --save-dev @nosana/scenario
```

### Write Tests

```ts
import { describe, it, expect } from 'vitest';
import { getScenarioClient, createMarket, listJob } from '@nosana/scenario';

describe('scenario: basic', () => {
  it('works with the Nosana SDK', async () => {
    const client = await getScenarioClient();
    const balance = await client.solana.getBalance();
    expect(balance).toBeGreaterThan(0);
  });

  it('creates a market and lists a job', async () => {
    const marketAddress = await createMarket();
    const jobAddress = await listJob({ market: marketAddress });
    expect(jobAddress).toBeDefined();
  });
});
```

### Multiple Clients

Use the `key` option to create independently funded clients — useful for multi-party scenarios:

```ts
const deployer = await getScenarioClient();                          // cached as 'default'
const node     = await getScenarioClient({ key: 'node' });           // separate wallet
const node2    = await getScenarioClient({ key: 'node2' });          // another separate wallet
```

Each unique key gets its own keypair, SOL airdrop, and NOS mint on localnet.

### Run Against Different Networks

No code changes needed — just set environment variables:

```bash
# Localnet (default) — starts a local Solana validator via Docker
npm run test:scenario:localnet

# Devnet — requires a funded wallet
NOSANA_NETWORK=devnet NOSANA_WALLET=~/.config/solana/id.json npm run test:scenario

# Mainnet
NOSANA_NETWORK=mainnet NOSANA_WALLET=/path/to/keypair.json npm run test:scenario
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NOSANA_NETWORK` | `localnet` | Target network: `localnet`, `devnet`, or `mainnet` |
| `NOSANA_WALLET` | — | Path to a Solana keypair JSON file (required for devnet/mainnet) |

### Vitest Integration

```ts
// vitest.scenario.config.ts
import { defineScenarioVitestConfig } from '@nosana/scenario';

export default defineScenarioVitestConfig({
  test: {
    include: ['tests/scenarios/**/*.test.ts'],
  },
});
```

### npm Scripts

These scripts are already included in `@nosana/scenario`'s `package.json`:

| Script | Description |
|--------|-------------|
| `test:scenario` | Run scenario tests with vitest |
| `test:scenario:localnet` | Start localnet + run scenario tests |
| `localnet:up` | Start the Docker-based Solana validator |
| `localnet:down` | Stop the validator and clean up |

From the workspace root:

```bash
# Run everything
pnpm --filter @nosana/scenario run test:scenario:localnet

# Or step by step
pnpm run localnet:up
pnpm --filter @nosana/scenario run test:scenario
pnpm run localnet:down
```

## API Reference

### `getScenarioClient(options?): Promise<NosanaClient>`

Returns a cached `NosanaClient` for the target network. Each unique `key` gets its own independently funded client instance.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `key` | `string` | `'default'` | Cache key — each unique key creates a separate client with its own wallet |
| `network` | `'localnet' \| 'devnet' \| 'mainnet'` | `NOSANA_NETWORK` env or `'localnet'` | Target network |
| `wallet` | `Wallet` | `NOSANA_WALLET` env or auto-generated (localnet) | Wallet signer |
| `airdropAmount` | `bigint` | `2_000_000_000n` | SOL airdrop amount (localnet only) |
| `mintAmount` | `bigint` | `1_000_000_000n` | NOS mint amount (localnet only) |
| `config` | `Partial<NosanaClientConfig>` | — | Override client config |

**Localnet** (default): generates a random keypair, airdrops SOL, and mints NOS tokens.

**Devnet / Mainnet**: connects with the provided wallet (via option or `NOSANA_WALLET` env var). No airdrop or minting is performed.

### `getLocalnetClient(options?): Promise<NosanaClient>`

Returns a cached `NosanaClient` connected to localnet. Equivalent to `getScenarioClient({ network: 'localnet' })`.

---

### Helper Functions

All helper functions include built-in vitest `expect` assertions and accept an optional `clientOverride` parameter. When omitted, they use the default scenario client (`getScenarioClient()`).

#### Jobs

##### `createMarket(params?, clientOverride?): Promise<Address>`

Create a market on-chain and return its address.

```ts
const marketAddress = await createMarket();
const marketAddress = await createMarket({ jobPrice: 1000n });
```

##### `closeMarket(marketAddress, clientOverride?): Promise<void>`

Close an existing market.

```ts
await closeMarket(marketAddress.toString());
```

##### `listJob(params, clientOverride?): Promise<Address>`

List (submit) a job to a market and return the job address. `timeout` defaults to `3600` and `ipfsHash` defaults to a test hash — only `market` is required.

```ts
const jobAddress = await listJob({ market: marketAddress });
const jobAddress = await listJob({ market: marketAddress, timeout: 7200 });
```

##### `joinMarketQueue(marketAddress, options?, clientOverride?): Promise<void>`

Join a market's node queue. Verifies the node is queued by default.

```ts
const nodeClient = await getScenarioClient({ key: 'node' });
await joinMarketQueue(marketAddress.toString(), {}, nodeClient);

// Disable queue verification
await joinMarketQueue(marketAddress.toString(), { verifyQueued: false }, nodeClient);
```

##### `waitForJobState(jobAddress, expectedState, clientOverride?): Promise<void>`

Poll until a job reaches the expected state using vitest's `expect.poll`.

```ts
import { JobState } from '@nosana/scenario';

await waitForJobState(jobAddress.toString(), JobState.RUNNING);
```

#### Nodes

##### `finishJob(jobAddress, clientOverride?): Promise<void>`

Finish (complete) a job as a node, submitting a default IPFS results hash.

```ts
const nodeClient = await getScenarioClient({ key: 'node' });
await finishJob(jobAddress.toString(), nodeClient);
```

##### `verifyJobAssignedToNode(jobAddress, options?, clientOverride?): Promise<void>`

Assert that a job is assigned to the client's wallet. Optionally verify the job state.

```ts
const nodeClient = await getScenarioClient({ key: 'node' });
await verifyJobAssignedToNode(jobAddress.toString(), { expectedState: 1 }, nodeClient);
```

---

### Utilities

#### `mintNosTo(client, recipient, amount): Promise<void>`

Mint NOS tokens to any address on the localnet.

#### `ensureLocalnetMint(client): Promise<{ mintAuthority, mintAddress }>`

Ensures the NOS mint exists on localnet. Creates it if it doesn't exist.

#### `executeInstructionPlan(client, plan): Promise<void>`

Execute a Solana instruction plan using the client's wallet as fee payer.

#### `defineScenarioVitestConfig(overrides?): object`

Returns a Vitest config object with the scenario setup file pre-configured.

### Re-exports from `@nosana/localnet`

- `startLocalnet`, `stopLocalnet`
- `LOCALNET_RPC_ENDPOINT`, `LOCALNET_WS_ENDPOINT`

### Re-exports from `@nosana/kit`

- `NosanaNetwork`, `JobState`, `type NosanaClient`, `type Wallet`, `type Address`

For more info go to [learn.nosana.com](https://learn.nosana.com)
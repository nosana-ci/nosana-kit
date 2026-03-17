# @nosana/localnet

Nosana localnet: a Solana test validator with Nosana programs pre-baked into the Docker image, plus helpers for localnet testing.

For network-aware scenario testing (localnet/devnet/mainnet), see [`@nosana/scenario`](../scenario).

## What's Inside

- **Docker image** — a self-contained Solana validator with Nosana programs pre-loaded (no devnet fetching at startup)
- **Test helpers** — `getLocalnetClient()`, `mintNosTo()`, and more
- **Vitest integration** — one-line setup and a config helper

## Quick Start

### 1. Install

```bash
npm install --save-dev @nosana/localnet
# or
pnpm add -D @nosana/localnet
```

### 2. Start the Validator

**Option A: Use the published Docker image**

```bash
docker run -d --name nosana-localnet \
  -p 8899:8899 -p 8900:8900 -p 8001:8001 \
  nosana/localnet:latest
```

Nosana programs are pre-baked into the image — no network access needed at startup.

**Option B: Use the bundled Docker Compose file**

```bash
docker compose -f node_modules/@nosana/localnet/docker/docker-compose.yml up -d --wait
```

**Option C: Use the programmatic API**

```ts
import { startLocalnet, stopLocalnet } from '@nosana/localnet';

startLocalnet();
// ... run tests ...
stopLocalnet();
```

### 3. Write Tests

```ts
import { describe, it, expect } from 'vitest';
import { getLocalnetClient, mintNosTo } from '@nosana/localnet';

describe('localnet', () => {
  it('works with the Nosana SDK', async () => {
    const client = await getLocalnetClient();
    const balance = await client.solana.getBalance();
    expect(balance).toBeGreaterThan(0);
  });

  it('can mint NOS to any address', async () => {
    const client = await getLocalnetClient();
    await mintNosTo(client, client.wallet!.address, 500_000_000n);
  });
});
```

### 4. Vitest Integration

```ts
// vitest.config.ts
import { defineLocalnetVitestConfig } from '@nosana/localnet';

export default defineLocalnetVitestConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
```

### 5. npm Scripts

```json
{
  "scripts": {
    "localnet:up": "docker compose -f node_modules/@nosana/localnet/docker/docker-compose.yml up -d --wait --force-recreate",
    "localnet:down": "docker compose -f node_modules/@nosana/localnet/docker/docker-compose.yml down -v",
    "test:localnet": "pnpm run localnet:up && vitest run --config vitest.localnet.config.ts"
  }
}
```

## API Reference

### `getLocalnetClient(options?): Promise<NosanaClient>`

Returns a cached `NosanaClient` connected to localnet. Generates a random keypair, airdrops SOL, and mints NOS tokens.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `wallet` | `Wallet` | auto-generated | Wallet to use |
| `airdropAmount` | `bigint` | `2_000_000_000n` | SOL airdrop amount (lamports) |
| `mintAmount` | `bigint` | `1_000_000_000n` | NOS mint amount (raw units) |
| `config` | `Partial<NosanaClientConfig>` | — | Override client config |

### `mintNosTo(client, recipient, amount): Promise<void>`

Mint NOS tokens to any address on the localnet.

### `ensureLocalnetMint(client): Promise<{ mintAuthority, mintAddress }>`

Ensures the NOS mint exists on localnet. Creates it if it doesn't exist.

### `executeInstructionPlan(client, plan): Promise<void>`

Execute a Solana instruction plan using the client's wallet as fee payer.

### `startLocalnet(options?): void`

Start the localnet Docker container. Waits for healthcheck.

### `stopLocalnet(options?): void`

Stop the localnet Docker container and clean up volumes.

### `defineLocalnetVitestConfig(overrides?): object`

Returns a Vitest config object with the localnet setup file pre-configured.

### Re-exports

For convenience, the following are re-exported from `@nosana/kit`:

- `NosanaClient`
- `Wallet`
- `Address`
- `NosanaNetwork`

## Docker Image

Nosana programs and accounts are pre-fetched from devnet during `docker build`
and stored as fixtures inside the image. At startup the validator loads these
fixtures via `--account-dir` — **no network access is needed at runtime**.

Build the image locally:

```bash
cd node_modules/@nosana/localnet
docker build -t nosana/localnet:latest .
```

The image exposes:
- **8899** — Solana RPC
- **8900** — Solana WebSocket
- **8001** — Gossip

## NOS Mint

The NOS mint (`devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP`) is **pre-baked
into the Docker image** as a fixture with the bundled mint authority
(`dumQVNHZ1KNcLmzjMaDPEA5vFCzwHEEcQmZ8JHmmCNH`). The authority private key
ships with this package in `keys/`, so anyone can mint NOS tokens on localnet.

On devnet/mainnet, the real NOS token uses a different authority whose key is
not public — that's why localnet uses its own mint authority.

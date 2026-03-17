# @nosana/scenario

Network-aware scenario test helpers for Nosana. Run the same tests against localnet, devnet, or mainnet — controlled entirely via environment variables.

## Quick Start

```bash
npm install --save-dev @nosana/scenario
```

### Write Tests

```ts
import { describe, it, expect } from 'vitest';
import { getScenarioClient } from '@nosana/scenario';

describe('scenario: basic', () => {
  it('works with the Nosana SDK', async () => {
    const client = await getScenarioClient();
    const balance = await client.solana.getBalance();
    expect(balance).toBeGreaterThan(0);
  });
});
```

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

```json
{
  "scripts": {
    "localnet:up": "docker compose -f node_modules/@nosana/localnet/docker/docker-compose.yml up -d --wait --force-recreate",
    "localnet:down": "docker compose -f node_modules/@nosana/localnet/docker/docker-compose.yml down -v",
    "test:scenario": "vitest run --config vitest.scenario.config.ts",
    "test:scenario:localnet": "npm run localnet:up && npm run test:scenario"
  }
}
```

## API Reference

### `getScenarioClient(options?): Promise<NosanaClient>`

Returns a cached `NosanaClient` for the target network.

The network is determined by (in order of precedence):
1. `options.network`
2. `NOSANA_NETWORK` environment variable
3. `'localnet'` (default)

The wallet is determined by (in order of precedence):
1. `options.wallet`
2. `NOSANA_WALLET` environment variable (path to a Solana keypair JSON file)
3. Auto-generated keypair (localnet only)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `network` | `'localnet' \| 'devnet' \| 'mainnet'` | `NOSANA_NETWORK` env or `'localnet'` | Target network |
| `wallet` | `Wallet` | `NOSANA_WALLET` env or auto-generated (localnet) | Wallet signer |
| `airdropAmount` | `bigint` | `2_000_000_000n` | SOL airdrop amount (localnet only) |
| `mintAmount` | `bigint` | `1_000_000_000n` | NOS mint amount (localnet only) |
| `config` | `Partial<NosanaClientConfig>` | — | Override client config |

**Localnet** (default): delegates to `getLocalnetClient()` from `@nosana/localnet` — generates a random keypair, airdrops SOL, and mints NOS tokens.

**Devnet / Mainnet**: connects with the provided wallet (via option or `NOSANA_WALLET` env var). No airdrop or minting is performed.

### Re-exports

For convenience, `@nosana/scenario` re-exports everything from `@nosana/localnet`:

- `getLocalnetClient`, `startLocalnet`, `stopLocalnet`
- `mintNosTo`, `ensureLocalnetMint`, `executeInstructionPlan`
- `NosanaNetwork`, `type NosanaClient`, `type Wallet`, `type Address`

# Nosana Kit Monorepo

Monorepo for the [Nosana](https://nosana.com) developer toolkit: TypeScript packages and documentation for the [Nosana Network](https://docs.nosana.com) on Solana.

## Packages

| Package | Description |
|--------|-------------|
| [**@nosana/kit**](./packages/kit) | Main SDK for jobs, markets, runs, staking, IPFS, and API integration. Start here for building on Nosana. |
| [@nosana/types](./packages/types) | Shared types and schemas. |
| [@nosana/api](./packages/api) | Nosana API client. |
| [@nosana/authorization](./packages/authorisation) | Message signing and validation for API auth. |
| [@nosana/endpoints](./packages/endpoints) | Endpoint and environment configuration. |
| [@nosana/ipfs](./packages/ipfs) | IPFS pinning and retrieval. |
| [@nosana/jobs-program](./packages/generated_clients/jobs) | Generated Solana jobs program client. |
| [@nosana/stake-program](./packages/generated_clients/stake) | Generated Solana stake program client. |
| [@nosana/merkle-distributor-program](./packages/generated_clients/merkle_distributor) | Generated Solana merkle distributor program client. |
| [**@nosana/localnet**](./packages/localnet) | Docker-based Solana test validator with pre-baked Nosana programs. |
| [**@nosana/scenario**](./packages/scenario) | Network-aware scenario test helpers (localnet / devnet / mainnet). |
| [**@nosana/docs**](./docs) | Documentation site (VitePress). |

For detailed SDK usage, see the [**Nosana Kit** README](./packages/kit/README.md).

## Requirements

- **Node.js** >= 20.18.0  
- **pnpm** >= 9.15.0  
- **TypeScript** >= 5.3.0 (for development)

## Development

All commands below are run from the **repository root** unless stated otherwise.

### Setup

```bash
pnpm install
pnpm build
pnpm test
```

### Building a subset

Build only a package and its workspace dependencies:

```bash
# Kit and its deps (generated clients), skip docs
pnpm --filter @nosana/kit run build:with-deps

# Docs (builds kit first, then docs)
pnpm --filter @nosana/docs run build:with-deps
```

From a package directory:

```bash
cd packages/kit && pnpm run build:with-deps
```

Use `pnpm build` when you want everything built (e.g. before a PR or publish).

### Regenerating program clients

After changing IDLs in `/idl`:

```bash
pnpm run generate-clients
```

Then run `pnpm build` so the rest of the workspace picks up the changes.

### Development mode

Run all watch processes and the docs dev server:

```bash
pnpm dev
```

Run watch for a single package and its deps:

```bash
pnpm --filter @nosana/kit run dev:with-deps
pnpm --filter @nosana/docs run dev:with-deps
```

### Lint and format

```bash
pnpm lint
pnpm format
pnpm format:fix
```

For one package: `pnpm --filter @nosana/kit run lint` (or `format` / `format:fix`).

### Documentation

```bash
pnpm --filter @nosana/docs dev      # Dev server
pnpm --filter @nosana/docs build   # Production build
pnpm --filter @nosana/docs preview # Preview built docs
```

### Scenario Testing

Run SDK integration tests against a local Solana validator with pre-baked Nosana programs:

```bash
# Start localnet and run scenario tests
pnpm --filter @nosana/scenario run test:scenario:localnet

# Or manage the validator manually
pnpm --filter @nosana/scenario run localnet:up
pnpm --filter @nosana/scenario run test:scenario
pnpm --filter @nosana/scenario run localnet:down
```

Run the same tests against devnet or mainnet by setting environment variables:

```bash
NOSANA_NETWORK=devnet NOSANA_WALLET=~/.config/solana/id.json pnpm --filter @nosana/scenario run test:scenario
```

See [`@nosana/localnet`](./packages/localnet) for Docker validator details and [`@nosana/scenario`](./packages/scenario) for the full API reference.

## License

MIT

## Links

- [Nosana Documentation](https://learn.nosana.com)
- [Nosana Network](https://nosana.com)
- [GitHub Repository](https://github.com/nosana-ci/nosana-kit)
- [NPM: @nosana/kit](https://www.npmjs.com/package/@nosana/kit)

# @nosana/localnet

Docker-based Solana test validator with pre-baked Nosana programs. This package provides the Docker infrastructure only — for test helpers (`getLocalnetClient`, `mintNosTo`, vitest integration), see [`@nosana/scenario`](../scenario).

## What's Inside

- **Docker image** — a self-contained Solana validator with Nosana programs pre-loaded (no devnet fetching at startup)
- **Docker Compose** — bundled compose file with healthcheck
- **Programmatic API** — `startLocalnet()` / `stopLocalnet()` to manage the container from code
- **Config constants** — `LOCALNET_RPC_ENDPOINT`, `KEYS_DIR`, etc.

## Quick Start

### 1. Install

```bash
npm install --save-dev @nosana/localnet
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

### 3. npm Scripts

```json
{
  "scripts": {
    "localnet:up": "docker compose -f node_modules/@nosana/localnet/docker/docker-compose.yml up -d --wait --force-recreate",
    "localnet:down": "docker compose -f node_modules/@nosana/localnet/docker/docker-compose.yml down -v"
  }
}
```

## API Reference

### `startLocalnet(options?): void`

Start the localnet Docker container. Waits for healthcheck.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `composeFile` | `string` | bundled compose file | Path to a custom docker-compose file |
| `containerName` | `string` | `nosana-localnet` | Container name |
| `verbose` | `boolean` | `false` | Print docker-compose output |

### `stopLocalnet(options?): void`

Stop the localnet Docker container and clean up volumes.

### Constants

| Export | Value |
|--------|-------|
| `LOCALNET_RPC_ENDPOINT` | `http://127.0.0.1:8899` |
| `LOCALNET_WS_ENDPOINT` | `ws://127.0.0.1:8900` |
| `KEYS_DIR` | Absolute path to bundled NOS mint keypairs |
| `FIXTURES_DIR` | Absolute path to bundled account fixtures |

## Docker Image

Nosana programs and accounts are pre-fetched from devnet during `docker build`
and stored as fixtures inside the image. At startup the validator loads these
fixtures via `--bpf-program` and `--account` flags — **no network access is needed at runtime**.

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

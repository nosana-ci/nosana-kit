# Localnet Harness (Docker)

This harness runs a Solana local validator in Docker so contributors and
downstream projects do not need the Solana CLI installed locally.

## Quick Start

1) Copy the env template and edit as needed (optional: `localnet/localnet.env`
is already prefilled for devnet):

```
cp localnet/localnet.env.example localnet/localnet.env
```

2) Start the validator (entrypoint runs `localnet/validator-entrypoint.sh`):

```
docker compose -f docker-compose.localnet.yml up
```

By default, the RPC endpoint is `http://127.0.0.1:8899` and WS is
`ws://127.0.0.1:8900`.

Debugging notes:
- `LOCALNET_PREFLIGHT=1` (default) checks program IDs on the source cluster before starting.
- Use `pnpm test:localnet:logs` to stream validator logs.

## Localnet Test Command

Run the scenario tests (this will start/recreate the validator and wait for it to be healthy):

```
pnpm test:localnet
```

Optional helpers:

```
pnpm test:localnet:logs
pnpm test:localnet:down
```

The test command uses the localnet defaults from the SDK. You can still
override RPC/WS via environment variables in your own shell if needed.

Localnet test layout:
- `tests/scenarios/specs/` - scenario tests
- `tests/scenarios/helpers/` - shared setup and utilities

## Option A: Clone from Devnet/Mainnet

Set program IDs to clone in `localnet/localnet.env`:

```
SOURCE_CLUSTER_URL=https://api.devnet.solana.com
CLONE_UPGRADEABLE_PROGRAMS=ProgramIdA,ProgramIdB
CLONE_ACCOUNTS=SomeConfigPda,SomeMint
```

## Using the SDK Against Localnet

You can either point the SDK at localhost manually or use the built-in
localnet helper.

Manual configuration:

```
createNosanaClient(NosanaNetwork.DEVNET, {
  solana: {
    rpcEndpoint: 'http://127.0.0.1:8899',
    wsEndpoint: 'ws://127.0.0.1:8900',
    commitment: 'confirmed',
  },
  programs: {
    jobsAddress: 'ProgramIdA',
    stakeAddress: 'ProgramIdB',
    merkleDistributorAddress: 'ProgramIdC',
    poolsAddress: 'ProgramIdD',
    rewardsAddress: 'ProgramIdE',
    nosTokenAddress: 'MintAddress',
  },
});
```

Helper configuration:

```
createLocalnetClient({
  solana: {
    rpcEndpoint: 'http://127.0.0.1:8899',
    wsEndpoint: 'ws://127.0.0.1:8900',
  },
  programs: {
    jobsAddress: 'ProgramIdA',
    stakeAddress: 'ProgramIdB',
    nosTokenAddress: 'MintAddress',
  },
});
```

## Notes

- If your programs CPI into SPL Token/ATA/Metaplex, you may need to clone
  those programs and any required accounts too.
- The validator stores its ledger under `localnet/ledger/`.


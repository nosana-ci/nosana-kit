# Basic Usage Examples

This page demonstrates common patterns for using Nosana Kit.

## Initialize Client

<Tabs :items="[
  { label: 'Mainnet (Default)' },
  { label: 'Custom Configuration' }
]">
  <template #tab-0>

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
```

  </template>
  <template #tab-1>

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
const client = createNosanaClient(NosanaNetwork.DEVNET);
```

  </template>
</Tabs>

::: tip

The `createNosanaClient` function returns a fully typed `NosanaClient` instance. All methods and properties are type-checked at compile time.

:::

## Fetch a Job

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
```

::: info

The `Job` type includes all properties from the on-chain account data. Hover over `job` in your IDE to see the full type definition, or check the [SDK Reference](/api/type-aliases/Job).

:::

## Query Jobs with Filters

```ts twoslash
import { createNosanaClient, JobState } from '@nosana/kit';
const client = createNosanaClient();
```

## Set Up Wallet

<Card title="Wallet Configuration">
  A wallet is required for signing transactions. You can set it during client initialization or dynamically.

<Tabs :items="[
  { label: 'During Initialization' },
  { label: 'Dynamic Assignment' }
]">
  <template #tab-0>

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
import { generateKeyPairSigner } from '@solana/kit';
import type { Wallet } from '@nosana/kit';

// Option 1: Set wallet during initialization
const keypair: Wallet = await generateKeyPairSigner();
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  wallet: keypair,
});
```

  </template>
  <template #tab-1>

```ts twoslash
import { Wallet, createNosanaClient, address } from '@nosana/kit';
import { generateKeyPairSigner } from '@solana/kit';

const client = createNosanaClient();
// Option 2: Set wallet dynamically
const keypair: Wallet = await generateKeyPairSigner();
client.wallet = keypair;

// Now you can perform transactions
const instruction = await client.jobs.post({
  market: address('market-address'),
  timeout: 3600,
  ipfsHash: 'QmXxx...',
});

await client.solana.buildSignAndSend(instruction);
```

  </template>
</Tabs>
</Card>

::: warning

Never share your private key or seed phrase. Always use secure key management practices in production.

:::


# Installation

## Install the Package

<Tabs :items="[
  { label: 'npm' },
  { label: 'yarn' },
  { label: 'pnpm' }
]">
  <template #tab-0>

```bash
npm install @nosana/kit
```

  </template>
  <template #tab-1>

```bash
yarn add @nosana/kit
```

  </template>
  <template #tab-2>

```bash
pnpm add @nosana/kit
```

  </template>
</Tabs>

## Requirements

- **Node.js** >= 20.18.0
- **TypeScript** >= 5.3.0 (for development)

::: info

The SDK is fully typed with TypeScript. While TypeScript is not required at runtime, we highly recommend using it for the best developer experience.

:::

## TypeScript Support

The SDK is written in TypeScript and provides complete type definitions. All types are exported for use in your applications:

```ts twoslash
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
  Address,
} from '@nosana/kit';

// The `address` utility is also available
import { address } from '@nosana/kit';
```

::: tip

All exported types are documented in the [SDK Reference](/api/). Hover over types in your IDE or click through to see detailed documentation.

:::


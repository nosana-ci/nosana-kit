# Quick Start

Get started with Nosana Kit in minutes.

::: tip

This guide assumes you have a basic understanding of TypeScript and Solana. If you're new to Solana, check out the [Solana documentation](https://docs.solana.com/) first.

:::

## Installation

```bash
npm install @nosana/kit
```

## Basic Usage

```ts
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
import type { Job, NosanaClient } from '@nosana/kit';

// Initialize with mainnet defaults
const client = createNosanaClient();

// Or specify network and configuration
const client2: NosanaClient = createNosanaClient(NosanaNetwork.DEVNET, {
  solana: {
    rpcEndpoint: 'https://your-custom-rpc.com',
    commitment: 'confirmed' as const,
    cluster: 'devnet' as const,
  },
});

// Fetch a job by address
const job: Job = await client.jobs.get('job-address' as any);
console.log('Job state:', job.state);

// Query jobs with filters
import { JobState } from '@nosana/kit';

const completedJobs: Job[] = await client.jobs.all({
  market: 'market-address' as any,
  state: JobState.COMPLETED,
});
```

::: info

The `client` object is typed as `NosanaClient`, which provides full TypeScript autocomplete and type checking for all available methods and properties.

:::

## Next Steps

- Learn about [Configuration](/guide/configuration) to customize your client
- Explore the [Jobs Program](/guide/jobs-program) for more advanced usage
- Check out [Examples](/examples/) for real-world use cases


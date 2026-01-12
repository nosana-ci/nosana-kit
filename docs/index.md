---
layout: home

hero:
  name: "Nosana"
  text: "Documentation"
  tagline: "Complete documentation for the Nosana Network - Deployments, API, and protocol guides"
  actions:
    - theme: brand
      text: Get Started
      link: /deployments/intro
    - theme: alt
      text: API
      link: /api/intro
    - theme: alt
      text: Deployments
      link: /deployments/intro

features:
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg> Deployments'
    details: Create and manage deployments on the Nosana Network using the API or dashboard with credits.
    link: /deployments/intro
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Nosana API'
    details: REST API and TypeScript SDK for creating and managing deployments programmatically.
    link: /api/intro
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><path d="m6 18 7-4 7 4"></path><path d="m12 2 7 4v12c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6z"></path><path d="M6 8h12"></path><path d="M6 12h12"></path><path d="M6 16h12"></path></svg> Nosana CLI'
    details: Command-line interface for running inference jobs and managing deployments on Nosana.
    link: /inference/quick_start
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg> Host GPUs'
    details: Earn $NOS by joining the Nosana Grid and hosting your GPUs on the marketplace.
    link: /hosts/grid
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Advanced: Programs'
    details: Learn about the Solana smart contracts - staking, jobs, nodes, pools, and rewards.
    link: /programs/start
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><rect width="18" height="14" x="3" y="5" rx="2"></rect><path d="M3 10h18"></path><path d="M7 15h.01"></path><path d="M11 15h2"></path></svg> Advanced: SDK'
    details: TypeScript SDK for direct blockchain interaction with the Nosana protocol.
    link: /kit/quick-start
---

## Getting Started

Discover the expansive realm of Nosana through our documentation. Whether you're deploying AI workloads with the API, building with the SDK, or contributing as a GPU host, we have guides for every use case.

:::tabs

== Using Nosana API (Recommended)

The easiest way to get started is using the Nosana API with credits. Create deployments, manage jobs, and run AI workloads without managing wallets or blockchain transactions.

Start with our [Deployments Guide](/deployments/intro):

- **Deployments**: Create and manage long-running workloads
- **Job Definitions**: Define your container workloads
- **API & SDK**: Use the REST API or TypeScript SDK
- **Guides**: Step-by-step tutorials for common scenarios

```bash
# Install the Nosana SDK
npm install @nosana/kit
```

```ts
import { createNosanaClient } from '@nosana/kit';

const client = createNosanaClient({
  api: {
    apiKey: process.env.NOSANA_API_KEY,
  },
});
```

== Advanced: TypeScript SDK

For direct blockchain interaction, use the Nosana SDK to interact with Solana programs directly.

Start with our [SDK Guide](/kit/quick-start):

```bash
npm install @nosana/kit
```

```ts twoslash
import { createNosanaClient, NosanaNetwork, address } from '@nosana/kit';

// Initialize with mainnet defaults
const client = createNosanaClient();

// Fetch a job by address
const job = await client.jobs.get(address('job-address'));
console.log('Job state:', job.state);
```

== Advanced: Blockchain Programs

The Nosana Programs are Solana smart contracts that power the decentralized GPU network. Interact with staking, jobs, nodes, pools, and rewards programs directly on-chain.

Start with our [Programs Documentation](/programs/start) to learn about:

- **Staking**: Stake NOS tokens to earn xNOS and participate in governance
- **Jobs**: Post and manage compute jobs on the marketplace
- **Nodes**: Register GPU nodes to participate in the network
- **Pools**: Join vesting pools for token distribution
- **Rewards**: Earn rewards for network participation

== For GPU Hosts

Earn $NOS by contributing your GPU resources to the Nosana Network. As a GPU Host, you run the Nosana Node software to connect your hardware to the decentralized marketplace.

Get started with our [Host GPUs Guide](/hosts/grid):

**Requirements:**
- NVIDIA GPU (compatible with CUDA)
- 12GB+ RAM
- 256GB+ NVMe SSD
- Ubuntu 20.04+ (Linux recommended)

```bash
# Install and run the Nosana Node
bash <(wget -qO- https://nosana.com/start.sh)
```

:::


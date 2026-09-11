---
title: Getting Started
---

# Getting Started with Nosana

This guide will help you choose the best way to interact with Nosana based on your needs.

## What Do You Want to Do?

### Deploy AI Workloads

If you want to run AI models, inference jobs, or other GPU workloads on the Nosana Network, choose one of these methods:

:::tabs

== Dashboard

**Easiest - No Code Required**

The web-based dashboard is perfect for getting started quickly without writing any code.

- **Best for**: Visual management, quick deployments, learning the platform
- **Get started**: Visit [deploy.nosana.com](https://deploy.nosana.com)
- **Features**:
  - Create and manage deployments visually
  - Monitor job status and logs
  - Manage credits and billing

== REST API

**Most Flexible**

Direct HTTP API access works with any programming language.

- **Best for**: Custom integrations, automation
- **Get started**: [API Documentation](/api/intro)

```bash
curl -X POST "https://api.nosana.com/deployments/create" \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hello World",
    "market": "7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq",
    "job_definition": {
      "ops": [{
        "type": "container/run",
        "id": "hello",
        "args": {
          "image": "ubuntu",
          "cmd": "for i in `seq 1 30`; do echo $i; sleep 1; done"
        }
      }]
    }
  }'
```

== TypeScript SDK

**Recommended for JS/TS**

High-level, type-safe interface for Node.js and browser applications.

- **Best for**: Web apps, Node.js services
- **Get started**: [SDK Documentation](/kit/)

```ts
import { createNosanaClient } from '@nosana/kit';

const client = createNosanaClient('mainnet', {
  api: {
    apiKey: process.env.NOSANA_API_KEY,
  },
});

const deployment = await client.api.deployments.create({
  name: 'Hello World',
  market: '7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq',
  timeout: 60,
  replicas: 1,
  strategy: 'SIMPLE',
  job_definition: {
    version: '0.1',
    type: 'container',
    meta: {
      trigger: 'api',
    },
    ops: [{
      type: 'container/run',
      id: 'hello',
      args: {
        image: 'ubuntu',
        cmd: 'for i in `seq 1 30`; do echo $i; sleep 1; done'
      }
    }]
  }
});
```

== CLI

**Command Line**

Run inference jobs directly from your terminal.

- **Best for**: Quick testing, scripts, CI/CD
- **Get started**: [CLI Documentation](/inference/quick_start)

```bash
nosana job post "for i in \`seq 1 30\`; do echo \$i; sleep 1; done" \
  --market 7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq
```

== Blockchain Programs

**Advanced**

Direct interaction with Solana smart contracts.

- **Best for**: Direct blockchain interaction, custom integrations
- **Get started**: [Programs Documentation](/programs/start)

:::

### Host GPUs

If you want to earn $NOS by providing GPU resources to the network:

- **Get started**: [Host GPUs Guide](/hosts/grid)
- **Requirements**:
  - NVIDIA GPU (CUDA compatible)
  - 12GB+ RAM
  - 256GB+ NVMe SSD
  - Ubuntu 20.04+ (Linux recommended)
- **Monitor your host & earnings**: Once your host is running, go to [host.nosana.com](https://host.nosana.com) to see its status, statistics, and $NOS earnings.
- **View markets & queues**: Use [explore.nosana.com](https://explore.nosana.com) to inspect GPU markets, queues, and host positions.

## Understanding the Basics

Before you start, it's helpful to understand a few key concepts:

- **[Jobs](/deployments/jobs/)** - Individual compute workloads that run on the network
- **[Deployments](/deployments/intro)** - Orchestration layer that manages job lifecycles
- **[GPU Markets](/deployments/gpu-markets)** - Pools of GPU resources where jobs are scheduled
- **[Credits](/api/credits)** - Prepaid credits used to pay for compute resources
- **[Hosts](/hosts/grid)** - GPU machines that run your jobs on the network

Learn more in the [Key Concepts](/about/key-concepts) guide.

## Authentication Methods

Depending on your chosen method, you'll need different authentication:

- **Dashboard**: Google login or Solana wallet
- **API/SDK with API Key**: Get your API key from [deploy.nosana.com](https://deploy.nosana.com) → Account page
- **API/SDK with Wallet**: Use wallet-based authentication (see [Wallet Authentication](/api/wallet-authentication))
- **CLI**: API key or wallet
- **Blockchain Programs**: Solana wallet

## Next Steps

Once you've chosen your path:

1. **Read the relevant documentation** for your chosen method
2. **Follow the quick start guide** for your use case
3. **Explore examples** in the documentation
4. **Join the community** for support and updates

## Need Help?

Join our [Discord server](https://discord.gg/nosana-ai) to get help from the community and the Nosana team.

Ready to get started? Choose your path above and dive into the documentation!


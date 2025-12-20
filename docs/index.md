---
layout: home

hero:
  name: "Nosana"
  text: "Documentation"
  tagline: "Complete documentation for the Nosana Network - Kit, smart contracts, and guides"
  actions:
    - theme: brand
      text: Quick Start
      link: /guide/quick-start
    - theme: alt
      text: Host GPUs
      link: /hosts/grid
    - theme: alt
      text: Run Inference
      link: /inference/quick_start

features:
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg> TypeScript SDK'
    details: Simple, intuitive API designed for developers. Get started in minutes with comprehensive TypeScript support.
    link: /guide/quick-start
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Smart Contracts'
    details: Learn how to use the Nosana Smart Contracts - staking, jobs, nodes, pools, and rewards.
    link: /protocols/start
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> AI Inference'
    details: Get started running your AI workloads on the Nosana Network using the CLI.
    link: /inference/quick_start
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg> Host GPUs'
    details: Earn $NOS by joining the Nosana Grid and hosting your GPUs on the marketplace.
    link: /hosts/grid
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><rect width="18" height="14" x="3" y="5" rx="2"></rect><path d="M3 10h18"></path><path d="M7 15h.01"></path><path d="M11 15h2"></path></svg> Complete Reference'
    details: Comprehensive documentation with examples, SDK reference, and protocol guides.
    link: /api/
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> Well Documented'
    details: Step-by-step guides, code examples, and interactive documentation for all levels.
    link: /guide/
---

## Getting Started

Discover the expansive realm of Nosana through our documentation. Dive deep into the functionalities and features that Nosana has to offer, with step-by-step guides designed to enhance your understanding and usage of the platform.

### For Developers

If you're building with the Nosana KIT, start with our [TypeScript KIT Guide](/guide/quick-start):

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

### For Smart Contract Users

Learn how to use the Nosana Smart Contracts - [Smart Contracts Documentation](/protocols/start)

### For GPU Hosts

Get started earning $NOS by joining our Nosana Grid - [Host GPUs Guide](/hosts/grid)

### For AI Inference

Run AI workloads on the Nosana Network - [Inference Quick Start](/inference/quick_start)

::: info
Are you looking for how to run inference using the API, SDK or Dashboard with Nosana Credits? The easiest place to start is [learn.nosana.com](https://learn.nosana.com).
:::


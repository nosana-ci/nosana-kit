---
layout: home

hero:
  name: "Nosana Kit"
  text: "TypeScript SDK"
  tagline: "Comprehensive tools for managing jobs, markets, runs, and protocol operations on the Nosana decentralized compute network"
  actions:
    - theme: brand
      text: Get Started
      link: /guide/quick-start
    - theme: alt
      text: View Examples
      link: /examples/
    - theme: alt
      text: API Reference
      link: /api/

features:
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg> Easy to Use'
    details: Simple, intuitive API designed for developers. Get started in minutes with comprehensive TypeScript support.
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Type Safe'
    details: Full TypeScript support with complete type definitions. Catch errors at compile time, not runtime.
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Powerful'
    details: Complete SDK for interacting with Nosana Network - jobs, markets, staking, IPFS, and more.
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg> Well Documented'
    details: Comprehensive documentation with examples, API reference, and interactive code samples.
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><rect width="18" height="14" x="3" y="5" rx="2"></rect><path d="M3 10h18"></path><path d="M7 15h.01"></path><path d="M11 15h2"></path></svg> Universal Wallet Support'
    details: Works with both browser wallets (wallet-standard) and keypair-based wallets seamlessly.
  - title: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> Modular'
    details: Functional architecture with factory functions for improved modularity and testability.
---

## Installation

```bash
npm install @nosana/kit
```

## Quick Start

```ts twoslash
import { createNosanaClient, NosanaNetwork, address } from '@nosana/kit';

// Initialize with mainnet defaults
const client = createNosanaClient();

// Or specify network and configuration
const clientDev = createNosanaClient(NosanaNetwork.DEVNET, {
  solana: {
    rpcEndpoint: 'https://your-custom-rpc.com',
    commitment: 'confirmed',
  },
});

// Fetch a job by address
const job = await client.jobs.get(address('job-address'));
console.log('Job state:', job.state);
```


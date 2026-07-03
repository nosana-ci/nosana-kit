---
layout: home

hero:
  name: "Nosana"
  text: "Documentation"
  tagline: "Complete documentation for the Nosana Network - Deployments, API, and protocol guides"
  actions:
    - theme: brand
      text: Get Started
      link: /about/getting-started
    - theme: alt
      text: Deployments
      link: /deployments/intro
    - theme: alt
      text: API
      link: /api/intro

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

## Documentation Overview

Explore our documentation organized by what you want to accomplish:

<div class="doc-overview">

<div class="doc-section">

### Deploy AI Workloads

- **[Getting Started](/about/getting-started)** - Choose your deployment method
- **[Deployments Guide](/deployments/intro)** - Create and manage deployments
- **[API Documentation](/api/intro)** - REST API and TypeScript SDK
- **[Job Definitions](/deployments/jobs/job-definition/intro)** - Define container workloads
- **[My First Deployment](/deployments/my-first-deployment)** - Step-by-step tutorial

</div>

<div class="doc-section">

### Host GPUs

- **[Host GPUs Guide](/hosts/grid)** - Join the network as a GPU provider
- **[Ubuntu Setup & Running](/hosts/grid-run)** - System setup and hosting instructions
- **[Troubleshooting](/hosts/troubleshoot)** - Common issues and solutions

</div>

<div class="doc-section">

### Developer Resources

- **[SDK Documentation](/kit/)** - TypeScript SDK for blockchain interaction
- **[SDK Reference](/kit/reference/)** - Complete SDK reference
- **[CLI Documentation](/inference/quick_start)** - Command-line interface
- **[Programs Documentation](/programs/start)** - Solana smart contracts
- **[Examples](/kit/examples/)** - Code examples and tutorials

</div>

<div class="doc-section">

### Learn More

- **[Key Concepts](/about/key-concepts)** - Core concepts explained
- **[Glossary](/about/glossary)** - Terminology reference
- **[GPU Markets](/deployments/gpu-markets)** - Available compute resources
- **[Solana Wallet](/about/wallet)** - Wallet setup and configuration
- **[Discord Community](https://discord.gg/nosana-ai)** - Get help and join the community

</div>

</div>

<style>
.doc-overview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .doc-overview {
    grid-template-columns: 1fr;
  }
}

.doc-section {
  padding: 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.doc-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  font-weight: 600;
}

.doc-section ul {
  margin: 0;
  padding-left: 1.25rem;
}

.doc-section li {
  margin: 0.75rem 0;
  line-height: 1.6;
}

.doc-section a {
  font-weight: 500;
}
</style>


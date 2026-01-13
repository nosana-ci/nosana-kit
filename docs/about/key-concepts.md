---
title: Key Concepts
---

# Key Concepts

## Jobs

<p>Jobs are the concrete set of operations to be executed. A job lists the operations to be executed, their order, whether they need to be executed sequentially or in parallel, and how input and output are passed around between them. Operations are executed as containers and offer similar ability to integrate with storage, networking, and resources like CPU and memory.</p>

The job definition is a JSON specification that describes the container image, commands, and runtime requirements for each workload.

- Start with **[Job Definition Intro](/deployments/jobs/job-definition/intro)**.
- Explore schemas and examples in the Job Definition section.

## Deployments

<p>Deployments are an orchestration layer on top of jobs. Through deployments, user can pick different strategies for how the underlying job lifecycles should be managed, for example, whether a job should run indefinitely is a possible strategy.</p>

- Learn more in **[Deployments Intro](/deployments/intro)**.
- See configuration details in **[Deployment Options](/deployments/options)**.

## GPU Markets

<p>GPU Markets represent pools of GPU resources where jobs are scheduled.</p>

- See **[GPU Markets](/deployments/gpu-markets)** for available markets.

## Hosts

<p>Hosts are the individual GPU machines that actually run your jobs. Each host belongs to a specific GPU Market, and are matched onto suitable hosts in the selected market based on their resource requirements.</p>

- Want to become a GPU host? Learn how to **[Host GPUs on the Nosana Network](/hosts/grid)**.

## Access Methods

You can interact with Nosana through multiple methods:

- **[Dashboard](https://deploy.nosana.com)** – Web-based interface at [deploy.nosana.com](https://deploy.nosana.com) for managing deployments visually
- **[REST API](/api/intro)** – Direct HTTP API calls for programmatic access
- **[TypeScript SDK](/kit/)** – High-level client library (`@nosana/kit`) for seamless integration
- **[CLI](/inference/quick_start)** – Command-line interface for running inference jobs directly
- **[Blockchain Programs](/programs/start)** – Direct interaction with Solana smart contracts for advanced use cases

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
  - No installation required

== REST API

**Most Flexible**

Direct HTTP API access gives you full control and works with any programming language.

- **Best for**: Custom integrations, server-side applications, automation
- **Get started**: [API Documentation](/api/intro)
- **Features**:
  - Full programmatic control
  - Works with any language (Python, JavaScript, Go, etc.)
  - Create, manage, and monitor deployments
  - Vault management and credit operations

== TypeScript SDK

**Recommended for JavaScript/TypeScript**

The `@nosana/kit` SDK provides a high-level, type-safe interface for Node.js and browser applications.

- **Best for**: JavaScript/TypeScript applications, web apps, Node.js services
- **Get started**: [SDK Documentation](/kit/)
- **Installation**: `npm install @nosana/kit`
- **Features**:
  - Type-safe API client
  - Automatic authentication handling
  - Built-in error handling
  - Support for both API key and wallet authentication

== CLI

**Command Line**

The Nosana CLI lets you run inference jobs directly from your terminal.

- **Best for**: Quick testing, scripts, CI/CD pipelines
- **Get started**: [CLI Documentation](/inference/quick_start)
- **Features**:
  - Run jobs from command line
  - Simple job submission
  - Perfect for automation

== Blockchain Programs

**Advanced**

Direct interaction with Solana smart contracts for maximum control.

- **Best for**: Advanced users, custom integrations, direct blockchain interaction
- **Get started**: [Programs Documentation](/programs/start)
- **Features**:
  - Direct on-chain interaction
  - Full control over transactions
  - Access to all protocol features

:::

### Host GPUs

If you want to earn $NOS by providing GPU resources to the network:

- **Get started**: [Host GPUs Guide](/hosts/grid)
- **Requirements**:
  - NVIDIA GPU (CUDA compatible)
  - 12GB+ RAM
  - 256GB+ NVMe SSD
  - Ubuntu 20.04+ (Linux recommended)
- **Earnings**: Earn $NOS tokens for running jobs on your hardware

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


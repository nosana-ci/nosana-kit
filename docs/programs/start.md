# Nosana Programs

The Nosana Network is powered by a suite of Solana smart contracts (programs) that enable decentralized GPU compute. These programs work together to create a permissionless marketplace where users can stake tokens, run compute jobs, host GPUs, and earn rewards.

## Source Code

All Nosana programs are open source and available on GitHub:

**[View on GitHub →](https://github.com/nosana-ci/nosana-programs)**

## Programs Overview

The Nosana Program Library consists of four core programs:

| Program | Address | Documentation |
|---------|---------|---------------|
| **[Nosana Staking](staking)** | `nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE` | [View Docs](staking) |
| **[Nosana Rewards](rewards)** | `nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp` | [View Docs](rewards) |
| **[Nosana Pools](pools)** | `nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD` | [View Docs](pools) |
| **[Nosana Jobs](jobs)** | `nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM` | [View Docs](jobs) |

## What You Can Do

With the Nosana programs, you can:

- **[Stake NOS tokens](staking)** - Lock up NOS tokens to earn xNOS and participate in governance
- **[Post compute jobs](jobs)** - Submit GPU workloads to the decentralized marketplace
- **[Register GPU nodes](nodes)** - Join the network as a GPU provider and earn rewards
- **[Earn rewards](rewards)** - Receive NOS tokens for network participation
- **[Join vesting pools](pools)** - Participate in token distribution pools
- **[Use the Nosana Token](token)** - The native token powering the network

## Getting Started

To interact with Nosana programs, you can:

1. **Use the TypeScript SDK** - The easiest way to interact with programs
   - See the [SDK documentation](/kit/) for examples and guides
   - Install: `npm install @nosana/kit`

2. **Use Anchor** - Direct interaction with Solana programs
   - See individual program documentation for Anchor examples
   - Each program page includes code samples

3. **Use the CLI** - Command-line interface for common operations
   - See the [CLI documentation](/inference/quick_start)

## Security & Audits

External security audits have been conducted on the Nosana Staking program:

- [Audit Report 1](https://github.com/nosana-ci/nosana-programs/blob/main/audits/NOSANA_STAKING_REPORT_1.pdf) by [Op Codes](https://opcodes.fr) (10-08-2022) ✅
- [Audit Report 2](https://github.com/nosana-ci/nosana-programs/blob/main/audits/NOSANA_STAKING_REPORT_2.pdf) by [Op Codes](https://opcodes.fr) (23-08-2022) ✅

All audit reports are available in the [audits folder](https://github.com/nosana-ci/nosana-programs/tree/main/audits) of the repository.

## Documentation

Each program has detailed documentation covering:

- **Instructions** - Available operations and how to invoke them
- **Accounts** - Data structures and account layouts
- **Types** - Custom types and enums
- **Errors** - Error codes and their meanings
- **Examples** - Code samples using Anchor and the TypeScript SDK

Start exploring:

- **[Staking Program](staking)** - Stake tokens and earn xNOS
- **[Jobs Program](jobs)** - Post and manage compute jobs
- **[Rewards Program](rewards)** - Earn rewards for participation
- **[Pools Program](pools)** - Join vesting pools
- **[Nodes Program](nodes)** - Register and manage GPU nodes
- **[Token Program](token)** - Learn about the NOS token

## Contributing

Contributions to the Nosana programs are welcome! See the [contributing guidelines](https://github.com/nosana-ci/nosana-programs/blob/main/CONTRIBUTING.md) on GitHub.

Significant contributions may be compensated with a grant from the Nosana Foundation.

## License

The Nosana programs are licensed under the [MIT License](https://github.com/nosana-ci/nosana-programs/blob/main/LICENSE).

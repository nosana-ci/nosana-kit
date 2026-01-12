# Architecture

The SDK uses a functional architecture with factory functions for improved modularity and testability.

## Structure

- **`services/`** - Utility services and program interfaces
  - **`SolanaService`** - Low-level Solana RPC operations, transactions, and PDA derivations
  - **`TokenService`** - Token account operations (configured for NOS token)
  - **`programs/`** - On-chain program interfaces
    - **`JobsProgram`** - Jobs, runs, and markets management
    - **`StakeProgram`** - Staking account operations
    - **`MerkleDistributorProgram`** - Merkle distributor and claim operations
- **`ipfs/`** - IPFS integration for pinning and retrieving data
- **`config/`** - Network configurations and defaults
- **`utils/`** - Helper utilities and type conversions
- **`generated_clients/`** - Auto-generated Solana program clients (exported as namespaces)

All components use factory functions with explicit dependency injection, making the codebase modular, testable, and maintainable.

## NosanaClient

Main entry point for SDK interactions. Created using the `createNosanaClient()` factory function.

**Properties:**

- `config: ClientConfig` - Active configuration
- `jobs: JobsProgram` - Jobs program interface
- `stake: StakeProgram` - Staking program interface
- `merkleDistributor: MerkleDistributorProgram` - Merkle distributor program interface
- `solana: SolanaService` - General Solana utilities (RPC, transactions, PDAs)
- `nos: TokenService` - Token operations service (configured for NOS token)
- `api: NosanaApi | undefined` - Nosana API client for interacting with Nosana APIs (jobs, credits, markets)
- `ipfs: ReturnType<typeof createIpfsClient>` - IPFS operations for pinning and retrieving data
- `authorization: NosanaAuthorization | Omit<NosanaAuthorization, 'generate' | 'generateHeaders'>` - Authorization service for message signing and validation
- `logger: Logger` - Logging instance
- `wallet?: Wallet` - Active wallet (if set). Set this property directly to configure the wallet.


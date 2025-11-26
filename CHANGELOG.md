# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-19

### 🎉 Major Release

We're excited to announce v2.0.0 of the Nosana Kit SDK! This major release includes a complete architectural refactor to improve maintainability, testability, and developer experience.

### 🏗️ Functional Architecture Refactor

- **Refactored to functional architecture**: Moved from class-based to factory function pattern throughout the SDK
- **Reorganized program services**: Moved all program services (`JobsProgram`, `StakeProgram`, `MerkleDistributorProgram`) into a unified `services/programs/` folder structure
- **Improved dependency injection**: All services now use factory functions with explicit dependency injection, making the codebase more modular and testable
- **Replaced `@solana/gill` with `@solana/kit`**: Migrated to the latest Solana toolkit for better type safety and modern API patterns

### 🧪 Enhanced Unit Testing

- **Comprehensive test coverage**: Added extensive unit tests for all major components including `SolanaService`, `TokenService`, and all program services
- **Improved test infrastructure**: Created reusable test factories and helpers to reduce mocking complexity
- **Better test organization**: Restructured tests with clearer separation and improved setup/teardown patterns
- **Reduced test brittleness**: Simplified mocking strategies to make tests more maintainable and less fragile

### ⚡ Improved SolanaService

- **Enhanced transaction handling**: Refactored transaction building, signing, and sending into separate, composable methods (`buildTransaction`, `signTransaction`, `sendTransaction`)
- **Added convenience method**: New `buildSignAndSend()` method for common use cases
- **Better compute unit estimation**: Automatic compute unit limit estimation and injection
- **Improved fee payer handling**: Added support for configurable fee payers at both service and transaction levels
- **More flexible API**: Better separation of concerns allows for more granular control over transaction lifecycle

### 🔐 Universal Wallet Support

- **Unified wallet interface**: New `Wallet` type that supports both `MessageSigner` and `TransactionSigner` interfaces
- **Browser wallet compatibility**: Full support for wallet-standard browser wallets (Phantom, Solflare, etc.)
- **Keypair wallet support**: Seamless support for keypair-based wallets
- **Flexible wallet configuration**: Wallets can be set at client initialization or dynamically assigned
- **Type-safe wallet operations**: Leverages `@solana/kit` types for compile-time safety

### 📦 Additional Improvements

- **Better error handling**: Improved error types and error codes throughout the SDK
- **Enhanced logging**: More structured logging with configurable log levels
- **Improved configuration**: More flexible configuration options with better defaults
- **Code cleanup**: Removed deprecated code, improved code organization, and better separation of concerns

### ⚠️ Breaking Changes

- Some APIs have changed from v1.x. Please review the migration guide and update your code accordingly.
- The `SolanaService.send()` method has been replaced with `buildSignAndSend()`, `buildTransaction()`, `signTransaction()`, and `sendTransaction()` methods.
- Program services have been moved to the `services/programs/` folder structure.

### Migration Guide

#### Client Initialization (Class-based to Functional Architecture)

The SDK has moved from a class-based to a functional architecture using factory functions.

**Before (v1.x):**
```typescript
import { NosanaClient } from '@nosana/kit';

const client = new NosanaClient(config);
```

**After (v2.0.0):**
```typescript
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

// Initialize with mainnet defaults
const client = createNosanaClient();

// Or specify network and configuration
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  solana: {
    rpcEndpoint: 'https://your-custom-rpc.com',
    commitment: 'confirmed'
  }
});
```

#### Updating SolanaService Transaction Methods

The `SolanaService.send()` method has been replaced with more granular methods. Here's how to migrate:

**Before (v1.x):**
```typescript
// Send a single instruction
await client.solana.send(instruction);

// Send multiple instructions
await client.solana.send([ix1, ix2, ix3]);
```

**After (v2.0.0):**
```typescript
// Option 1: Use the convenience method (recommended for most cases)
await client.solana.buildSignAndSend(instruction);
await client.solana.buildSignAndSend([ix1, ix2, ix3]);

// Option 2: Use separate methods for more control
const transactionMessage = await client.solana.buildTransaction(instruction);
const signedTransaction = await client.solana.signTransaction(transactionMessage);
const signature = await client.solana.sendTransaction(signedTransaction);
```

#### Wallet Configuration

v2.0.0 introduces universal wallet support. Previously, only keypair wallets were supported via `WalletConfig`. Now, the SDK supports both browser wallets (wallet-standard) and keypair wallets through a unified `Wallet` interface.

**Before (v1.x):**
```typescript
// Only keypair wallets were supported via WalletConfig
// WalletConfig accepted either a private key array or file path
const client = new NosanaClient({
  wallet: .../* private key bytes or location to key file */
});
// The private key was internally converted to a keypair
// Browser wallets were not supported
```

**After (v2.0.0):**
```typescript
// Wallet must support both MessageSigner & TransactionSigner
// This works with wallet-standard browsers wallets and keypair wallets
const client = createNosanaClient();

// Browser wallets (wallet-standard compatible)
// Using the wallet standard account and the @nosana/solana-vue package to
// convert to a Wallet type with useWalletAccountSigner
client.wallet = useWalletAccountSigner(account, currentChain);

// Keypair wallets
import { generateKeyPairSigner } from '@solana/kit';
client.wallet = generateKeyPairSigner();

// Can also be set during initialization
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  wallet: myWallet
});
```

#### Import Paths

Program services are now organized under `services/programs/`, but this is an internal change and shouldn't affect most users. If you were importing internal modules directly, you may need to update paths.

**Note:** If you're using the public API (`createNosanaClient`, `client.jobs`, `client.stake`, etc.), no import changes are needed.

---

v2.0.0 sets a solid foundation for future development. The functional architecture makes the codebase easier to test, maintain, and extend.


# Wallet Configuration

The SDK supports universal wallet configuration through a unified `Wallet` type that must support both message and transaction signing (`MessageSigner & TransactionSigner`). This enables compatibility with both browser wallets (wallet-standard) and keypair-based wallets.

## Wallet Requirements

The wallet must implement both `MessageSigner` and `TransactionSigner` interfaces from `@solana/kit`. This allows the SDK to use the wallet for:

- **Message signing** - For API authentication and authorization
- **Transaction signing** - For on-chain operations

## Browser Wallets (Wallet-Standard)

Full support for wallet-standard compatible browser wallets (Phantom, Solflare, etc.):

```typescript
import { createNosanaClient } from '@nosana/kit';
import { useWalletAccountSigner } from '@nosana/solana-vue';

// Create client
const client = createNosanaClient();

// Set browser wallet (wallet-standard compatible)
client.wallet = useWalletAccountSigner(account, currentChain);
```

## Keypair Wallets

Seamless support for keypair-based wallets:

```typescript
import { createNosanaClient } from '@nosana/kit';
import { generateKeyPairSigner } from '@solana/kit';

// Create client
const client = createNosanaClient();

// Set keypair wallet
const keypair = generateKeyPairSigner();
client.wallet = keypair;
```

## Configuration Options

Wallets can be set at client initialization or dynamically assigned:

```typescript
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
import type { Wallet } from '@nosana/kit';

// Option 1: Set wallet during initialization
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  wallet: myWallet,
});

// Option 2: Set wallet dynamically
const client = createNosanaClient();
client.wallet = myWallet;

// Option 3: Change wallet at runtime
client.wallet = anotherWallet;
```

## Type Safety

The SDK leverages `@solana/kit` types for compile-time safety, ensuring wallet compatibility before runtime.


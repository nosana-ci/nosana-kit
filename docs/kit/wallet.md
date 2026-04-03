# Wallet Configuration

The SDK supports universal wallet configuration through a unified `Wallet` type that must support both message and transaction signing (`MessageSigner & TransactionSigner`). This enables compatibility with both browser wallets (wallet-standard) and keypair-based wallets.

## Wallet Requirements

The wallet must implement both `MessageSigner` and `TransactionSigner` interfaces from `@solana/kit`. This allows the SDK to use the wallet for:

- **Message signing** - For API authentication and authorization
- **Transaction signing** - For on-chain operations

## Keypair Helpers

The SDK provides convenient helper functions to create wallets without needing to install `@solana/kit` directly.

### Generate a New Wallet

```ts twoslash
import { createNosanaClient, generateWallet } from '@nosana/kit';

const wallet = await generateWallet();
console.log(wallet.address);

const client = createNosanaClient();
client.wallet = wallet;
```

### Load from a Keypair File

Load a wallet from a Solana CLI keypair JSON file (as created by `solana-keygen`). Defaults to `~/.config/solana/id.json`.

```ts twoslash
import { createNosanaClient, loadWalletFromFile } from '@nosana/kit';

// Load the default Solana CLI keypair
const wallet = await loadWalletFromFile();

// Or specify a custom path
const wallet2 = await loadWalletFromFile('/path/to/keypair.json');

const client = createNosanaClient();
client.wallet = wallet;
```

### Create from a Base58 Private Key

```ts twoslash
import { createNosanaClient, createWalletFromBase58 } from '@nosana/kit';

const wallet = await createWalletFromBase58(
  'your-base-58-encoded-private-key'
);

const client = createNosanaClient();
client.wallet = wallet;
```

### Create from Bytes

```ts twoslash
import { createNosanaClient, createWalletFromBytes } from '@nosana/kit';

const secretKey = new Uint8Array([174, 47, 154, 16, 202, 193, 206, 113, /* ... */]);
const wallet = await createWalletFromBytes(secretKey);

const client = createNosanaClient();
client.wallet = wallet;
```

### Using `@solana/kit` Directly

The SDK also re-exports the underlying `@solana/kit` keypair functions if you need more control:

```ts twoslash
import {
  generateKeyPairSigner,
  createKeyPairSignerFromBytes,
  createKeyPairFromBytes,
  createSignerFromKeyPair,
} from '@nosana/kit';

const signer = await generateKeyPairSigner();
```

## Browser Wallets (Wallet-Standard)

Full support for wallet-standard compatible browser wallets (Phantom, Solflare, etc.).

```ts
import { createNosanaClient } from '@nosana/kit';
import { useWalletAccountSigner } from '@nosana/solana-vue';

// Create client
const client = createNosanaClient();

// Set browser wallet (wallet-standard compatible)
client.wallet = useWalletAccountSigner(account, currentChain);
```

## Configuration Options

Wallets can be set at client initialization or dynamically assigned.

```ts twoslash
import { createNosanaClient, NosanaNetwork, generateWallet } from '@nosana/kit';

const myWallet = await generateWallet();
const anotherWallet = await generateWallet();

// Option 1: Set wallet during initialization
const client1 = createNosanaClient(NosanaNetwork.MAINNET, {
  wallet: myWallet,
});

// Option 2: Set wallet dynamically
const client2 = createNosanaClient();
client2.wallet = myWallet;

// Option 3: Change wallet at runtime
client2.wallet = anotherWallet;
```

## Type Safety

The SDK leverages `@solana/kit` types for compile-time safety, ensuring wallet compatibility before runtime.


# Wallet

Nosana runs on the **Solana** blockchain, so every interaction with the network is a signed transaction. To sign a transaction you need a Solana **keypair** stored in a wallet.

If you are new to Solana, the official _Intro to Cryptography_ course explains how keypairs work: [Intro to keypairs](https://solana.com/developers/courses/intro-to-solana/intro-to-cryptography).

There are three ways to interact with the Nosana Network:

1. **Nosana Dashboard** – no‑code web UI
2. **`@nosana/cli`** – command‑line interface
3. **`@nosana/sdk`** – TypeScript/JavaScript library

This guide shows how to import and export the same keypair between those three environments.

## 1. Nosana Dashboard

The Dashboard is the quickest way to submit jobs. It runs in your browser and relies on a browser wallet extension to sign transactions.

Supported Solana browser wallets:

- [Phantom](https://phantom.com/)
- [Solflare](https://www.solflare.com/)

### Phantom

- [**Import Key into Phantom:**](https://help.phantom.com/hc/en-us/articles/15079894392851-Importing-an-existing-wallet-into-Phantom)
- [**Export Key from Phantom:**](https://help.phantom.com/hc/en-us/articles/28355165637011-How-to-export-your-private-key)

### Solflare

- [**Import Key into Solflare:**](https://docs.solflare.com/solflare/onboarding/web-app-and-extension/import-any-solana-wallet)
- [**Export Key from Solflare:**](https://help.solflare.com/en/articles/9081347-export-recovery-phrase-or-private-key-web-extension)

---

## 2. `@nosana/cli`

`@nosana/cli` expects the private key as a JSON array containing 64 bytes (the same format used by the Solana CLI).

### Importing a key

If your wallet exports the key as a **base58** string (Phantom) or a **seed phrase**, convert it to the JSON array once:

```bash
npm install --global @solana/web3.js bs58
```

```js
const web3 = require('@solana/web3.js');
const bs58 = require('bs58');

const secretKey = bs58.decode(process.argv[2]); // pass the base58 key as first arg
console.log(JSON.stringify([...web3.Keypair.fromSecretKey(secretKey).secretKey]));
```

Save the script output to `~/.nosana/nosana_key.json`, then verify:

```bash
npx @nosana/cli address
```

The printed address should match your wallet.

### Exporting a key

To move your CLI key back into Phantom or Solflare:

1. Read the JSON file:

   ```bash
   cat ~/.nosana/nosana_key.json
   ```

2. Convert the array to base58 or a seed phrase with a tool such as `solana-keygen` or the Node script above (run in reverse).
3. Follow the _Import_ guide for your chosen wallet.

---

## 3. `@nosana/sdk`

The SDK accepts:

- 64‑byte JSON arrays
- base58 private keys
- 12/24‑word seed phrases

Pass any of these to `new Client('mainnet', private)` and the SDK will handle the rest. Use your preferred wallet export format; no conversion is usually necessary.

You can read more on how to use the `@nosana/sdk` at [SDK Start](../sdk/sdk_start.md)

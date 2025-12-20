# Wallet

Nosana runs on the **Solana** blockchain, so every interaction with the network is a signed transaction. To sign a transaction you need a Solana **keypair** stored in a wallet.

If you are new to Solana, the official _Intro to Cryptography_ course explains how keypairs work: [Intro to keypairs](https://solana.com/developers/courses/intro-to-solana/intro-to-cryptography).

There are three ways to interact with the Nosana Network:

1. **Nosana Dashboard** – no‑code web UI
2. **`@nosana/cli`** – command‑line interface
3. **`@nosana/kit`** – TypeScript/JavaScript library

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

## 3. `@nosana/kit`

The Kit accepts:

- 64‑byte JSON arrays
- base58 private keys
- 12/24‑word seed phrases
- Browser wallets (Phantom, Solflare, etc.)

Pass any of these to `createNosanaClient()` and configure the wallet. Use your preferred wallet export format; no conversion is usually necessary.

You can read more on how to use the `@nosana/kit` at the [Wallet Configuration](./guide/wallet.md) page.

---

# NOS Token

Nosana is powered by the [Solana](https://solana.com/) blockchain. All deployments on Nosana are paid by the [NOS Token](https://nosana.com/token/). **To be explicit; This means you will need to load your wallet with both [NOS](https://nosana.com/token/) and [Sol](https://solana.com/) to pay for the deployments.** SOL is used to pay for the blockchain transactions, and NOS is used to pay for the deployments.

## Funding Your Wallet

Regardless of how you interact with Nosana—whether through the Dashboard, `@nosana/cli`, or `@nosana/kit`—you need to ensure your wallet has sufficient funds. You will need:

- A minimum of `0.05 SOL` to pay for blockchain transaction fees
- A sufficient amount of NOS tokens to pay for your Nosana deployments

Follow this link to learn where to purchase NOS Tokens: [NOS token page](https://nosana.com/token/). NOS can be purchased via swaps from any Solana wallet.

- [Swapping on Phantom](https://help.phantom.com/hc/en-us/articles/6048249796243-Phantom-Swapper-FAQ)
- [Swapping on Solflare](https://academy.solflare.com/guides/how-to-swap-tokens/)

::: warning NOS Token Address
Please take note of the official Nosana Token address: [nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7](https://explorer.solana.com/address/nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7)
:::

## Token Protocol

To read more about how the Nosana NOS Token protocol, please continue reading the [NOS Token Protocol Page](./protocols/token.md)


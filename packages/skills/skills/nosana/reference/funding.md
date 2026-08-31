# Funding

Which half of this file applies is decided by how you authenticated. API key →
credits. Wallet → vaults. You never use both.

## Credits (API key)

```ts
const b = await client.api.credits.balance();
const available = b.assignedCredits - b.reservedCredits - b.settledCredits;
```

| Field | Meaning |
|---|---|
| `assignedCredits` | Total ever assigned |
| `reservedCredits` | Held against currently running work |
| `settledCredits` | Consumed by finished work |

**Available** is `assigned - reserved - settled`. There is no `available` field;
compute it. Running out mid-deployment surfaces as status `INSUFFICIENT_FUNDS`.

```ts
await client.api.credits.claim('CREDIT-CODE-123');

const e = await client.api.credits.checkEligibility();
if (e.eligible) await client.api.credits.request();

await client.api.credits.getSpendingHistory({ start_date: '2026-01-01', group_by: 'month' });
await client.api.credits.getTransactions({ limit: 50, offset: 0 });

await client.api.credits.invitations.get(token);
await client.api.credits.invitations.claim(token);
```

Top up at [deploy.nosana.com](https://deploy.nosana.com). Stopping a deployment
releases its reserved credits.

## Vaults (wallet)

A vault is a Solana account holding SOL and NOS that pays for a deployment.

```ts
import { createNosanaClient, NosanaNetwork, loadWalletFromFile } from '@nosana/kit';
import type { NosanaApi } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET); // no apiKey
client.wallet = await loadWalletFromFile();
const api = client.api as NosanaApi;
```

Wallet loaders, all from `@nosana/kit`: `loadWalletFromFile(path?)` (defaults to
`~/.config/solana/id.json`), `createWalletFromBase58`, `createWalletFromBytes`,
`generateWallet`. Browser wallets: assign any wallet-standard
`MessageSigner & TransactionSigner` to `client.wallet`.

### Operations

```ts
const deployment = await api.deployments.get(id);

await deployment.vault.getBalance();       // { SOL, NOS } — client-side RPC read
await deployment.vault.topup({ NOS: 100 }); // client-side token transfer
await deployment.vault.topup({ SOL: 0.5, NOS: 100 });
await deployment.vault.withdraw();          // API returns a tx; SDK signs and sends
```

Standalone vaults:

```ts
const vault  = await api.deployments.vaults.create();
const vaults = await api.deployments.vaults.list();
```

`getBalance` and `topup` are **not API endpoints** — they are Solana RPC calls
and token transfers made from your wallet. Only `create`, `list` and `withdraw`
hit the deployment manager. `withdraw()` empties the vault back to your wallet.

### Vault selection on create

| Field | Effect |
|---|---|
| *(neither)* | Reuse your oldest shared vault |
| `vault: '<address>'` | Use that specific vault |
| `new_vault: true` | Create a fresh vault for this deployment |

Deleting a deployment does **not** delete its vault — withdraw first, or the
funds sit there.

### Keeping a deployment funded

`SIMPLE-EXTEND` and `INFINITE` keep extending jobs until the vault empties, then
land in `INSUFFICIENT_FUNDS`. For long-running services, check the balance on a
schedule and top up before it bottoms out:

```ts
const { SOL, NOS } = await deployment.vault.getBalance();
if (NOS < 50) await deployment.vault.topup({ NOS: 200 });
```

## HTTP auth headers

```bash
# API key
-H "Authorization: Bearer $NOSANA_API_KEY"

# Wallet
-H "Authorization: NosanaApiAuthentication:<base64-signature>" \
-H "x-user-id: <wallet-public-key>"
```

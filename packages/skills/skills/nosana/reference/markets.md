# Markets

A market is a pool of hosts with a given GPU type and price. Every deployment
targets exactly one, by Solana address.

## Listing

```ts
const markets = await client.api.markets.list();
const market  = await client.api.markets.get(address);
const req     = await client.api.markets.getRequiredResources(address);
```

## Live fields

The published docs show `vram` and `price_per_hour_usd`. **Neither exists.** The
host-manager returns:

| Field | Meaning |
|---|---|
| `address` | Solana address — this is what `market` takes |
| `slug` | Stable handle, e.g. `nvidia-4090` |
| `name` | Display name |
| `type` | `PREMIUM` (validated), `COMMUNITY` (unvalidated), `OTHER` (multi-GPU/enterprise) |
| `usd_reward_per_hour` | What the host earns per hour — the practical price signal |
| `nos_job_price_per_second` | What the job costs, per second, in NOS |
| `nos_reward_per_second` | Host reward per second |
| `network_fee_percentage` | Protocol fee |
| `required_images` | Images pre-cached on hosts in this market |
| `required_remote_resources` | Resources pre-cached — see resources.md |
| `sft`, `premium_community_relation`, `utilization_target`, `nodes`, `client`, `max_usd_uptime_reward_per_day` | Metadata |

There is no VRAM field. Infer capability from the GPU in `name`/`slug`, or
pick a market whose GPU fits. `meta.system_resources.required_vram` only
documents the requirement — it does not constrain scheduling (see
job-definition.md).

## Choosing

```ts
const markets = await client.api.markets.list();

const cheapest = markets
  .filter((m) => String(m.slug).includes('4090') && m.type === 'PREMIUM')
  .sort((a, b) => Number(a.usd_reward_per_hour) - Number(b.usd_reward_per_hour))[0];
```

Guidance:
- **`PREMIUM`** for anything user-facing — validated hosts, better reliability.
- **`COMMUNITY`** is meaningfully cheaper and fine for batch work.
- Prefer a market whose `required_images` already contains your image: a cached
  image cuts minutes off `STARTING`.
- Availability varies; a market with no free hosts leaves you queued. Check
  [explore.nosana.com/markets](https://explore.nosana.com/markets) for live queue
  depth.

## Common mainnet addresses

Verify with `markets.list()` — these change.

| GPU | Slug | Address |
|---|---|---|
| RTX 3060 | `nvidia-3060` | `7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq` |
| RTX 3090 | `nvidia-3090` | `CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ` |
| RTX 4090 | `nvidia-4090` | `97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf` |
| RTX 5090 | `nvidia-5090` | `6Xt8hgVLLL2PSHC9NtJP8E8oTdA5ZJc95hZEnHcdqKqb` |
| A100 40GB | `nvidia-a100-40gb` | `F3aGGSMb73XHbJbDXVbcXo7iYM9fyevvAZGQfwgrnWtB` |
| A100 80GB | `nvidia-a100-80gb` | `GLJHzqRN9fKGBsvsFzmGnaQGknUtLN1dqaFR8n3YdM22` |
| H100 | `nvidia-h100` | `Crop49jpc7prcgAcS82WbWyGHwbN5GgDym3uFbxxCTZg` |
| 8×H100 | `nvidia-8x-h100` | `37VPcEfrA34vLRygFQd7bWiosBwv3a5jPv4hcXdumytC` |
| 6000 Ada | `nvidia-6000-ada` | `6eMivCx49anWFYwNgg8KNJQfSJYB5nBdif8CK6z52dem` |

## Pricing and catalogues

```ts
await client.api.markets.getPrices();          // all market prices
await client.api.markets.getPrice();           // NOS/USD
await client.api.markets.getDockerImages();    // cached image catalogue
await client.api.markets.getRemoteResources(); // cached resource catalogue
```

# Errors and retries

## Two conventions

**Curated methods throw.** `client.api.deployments.create(...)` rejects on
failure.

**Raw clients don't.** `client.api.clients.hostManager.GET(...)` resolves to
`{ data, error }`. Checking `try/catch` around a raw client silently ignores
every failure.

## `NosanaApiError`

```ts
import { isNosanaApiError } from '@nosana/kit';

try {
  await client.api.jobs.list(request);
} catch (e) {
  if (isNosanaApiError(e)) {
    e.statusCode;  // always set
    e.retryAfter;  // seconds, from Retry-After when present
    e.code;        // machine-readable — only on control signals
  }
}
```

## `NosanaError` (SDK-side)

Thrown by the Solana/config layer, with `code` from `ErrorCodes`:
`INVALID_NETWORK`, `INVALID_CONFIG`, `RPC_ERROR`, `TRANSACTION_ERROR`,
`PROGRAM_ERROR`, `VALIDATION_ERROR`, `NO_WALLET`, `FILE_ERROR`,
`WALLET_CONVERSION_ERROR`.

```ts
import { NosanaError, ErrorCodes, loadWalletFromFile } from '@nosana/kit';

if (e instanceof NosanaError && e.code === ErrorCodes.NO_WALLET) {
  client.wallet = await loadWalletFromFile();
}
```

## Idempotency

Job **post**, **extend** and **stop** accept an idempotency key. Batch endpoints
**require** one — they reject with `400` without it.

```ts
import { generateIdempotencyKey } from '@nosana/kit';

const key = generateIdempotencyKey();
await client.api.jobs.list(request, { idempotencyKey: key });
await client.api.jobs.list(request, { idempotencyKey: key }); // de-duplicated
```

Generate one key per **logical operation** and reuse it across retries of that
operation. A fresh key per attempt gives you no de-duplication at all — which is
the whole point.

### Control signals

The distinction is **`code`, not HTTP status**. A `409` carrying a `code` is a
control signal; an error without one is an ordinary rejection.

```ts
import { IdempotencyCode, isIdempotencyControlSignal } from '@nosana/kit';

try {
  await client.api.jobs.list(request, { idempotencyKey: key });
} catch (e) {
  if (!isIdempotencyControlSignal(e)) throw e;

  switch (e.code) {
    case IdempotencyCode.IN_PROGRESS:
      // still in flight — wait e.retryAfter, retry the SAME key
      break;
    case IdempotencyCode.EXPIRED:
      // prepared transaction is dead — re-post with a FRESH key
      break;
    case IdempotencyCode.PAYLOAD_MISMATCH:
      // same key, different payload — a bug. Do not retry
      break;
  }
}
```

### Batch results

Batches return per-item results keyed by request `index`:

```ts
const res = await client.api.jobs.listBatch({ jobs }, { idempotencyKey: key });
const expired = res.items.filter((i) => i.status === 'expired');
```

- `confirmed` — landed; `job`/`run`/`tx` included.
- `expired` — did not land. Re-post **only those items**, under a **fresh** key.
- Items sharing a transaction share one `tx`. Absent on `expired` and on
  already-terminal no-ops.

A `409 IDEMPOTENCY_KEY_IN_PROGRESS` on a batch means retry with the **same**
batch key; items already landed stay landed.

## Terminal no-ops

Extending or stopping a job that already finished is **not** an error. `tx` comes
back `null` (and `credits` is omitted on extend) — a confirmed no-op, nothing
charged.

```ts
const r = await client.api.jobs.extend({ address, seconds: 600 });
if (r.tx === null) { /* already finished */ }
```

## Retry policy

| Situation | Do |
|---|---|
| `IN_PROGRESS` | Wait `retryAfter`, retry same key |
| `EXPIRED` | Retry with a fresh key |
| `PAYLOAD_MISMATCH` | Don't retry — fix the caller |
| 5xx, network failure | Exponential backoff, same key |
| 4xx without `code` | Don't retry — fix the request |
| `INSUFFICIENT_FUNDS` status | Top up, then `start()` |
| Stream `onError` | Do nothing; it reconnects itself |

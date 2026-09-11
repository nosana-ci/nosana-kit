# @nosana/types

Shared TypeScript types for Nosana SDKs.

## Installation

```bash
npm install @nosana/types
```

## Usage

Import types directly:

```typescript
import { Job, Market, JobDefinition } from '@nosana/types';
```

## Solana Integration

Configure Solana types in your `types.ts` or `index.d.ts` file.

### Using @solana/kit

```typescript
import type { Address as SolanaAddress } from '@solana/kit';

declare module '@nosana/types' {
  interface Address {
    _type: SolanaAddress<string>;
  }
}
```

### Using @solana/web3.js

```typescript
import type { PublicKey as SolanaPublicKey } from '@solana/web3.js';

declare module '@nosana/types' {
  interface PublicKey {
    _type: SolanaPublicKey;
  }
}
```

For more info go to [learn.nosana.com](https://learn.nosana.com)
## Node API contract

`src/Schemas/nodeOpenApi.ts` is the OpenAPI 3.1 document for the HTTP API every node
serves for its jobs, and the single source of truth for it. `JobDefinition`, `FlowState`
and everything they reach are taken from the TypeScript types through typia at build
time, so the document cannot drift from them. `pnpm generate:node` (after `pnpm build`)
exports it to `openapi/node.openapi.json`, which ships with the package, and regenerates
`src/Schemas/node.ts`, exported as the `NodeApiSchema` namespace. `@nosana/api` builds
its node client from those types, and the node repository can type its route handlers
against the same ones and serve `nodeOpenApiDocument()` at `/openapi.json` to join the
gateway spec, its swagger and the MCP.

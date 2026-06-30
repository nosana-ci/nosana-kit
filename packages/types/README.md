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
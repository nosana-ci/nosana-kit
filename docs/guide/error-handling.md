# Error Handling

The SDK provides structured error handling with specific error codes.

## NosanaError

```ts twoslash
class NosanaError extends Error {
  code: string;
  details?: any;
}
```

## Error Codes

```ts twoslash
enum ErrorCodes {
  INVALID_NETWORK = 'INVALID_NETWORK',
  INVALID_CONFIG = 'INVALID_CONFIG',
  RPC_ERROR = 'RPC_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  PROGRAM_ERROR = 'PROGRAM_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NO_WALLET = 'NO_WALLET',
  FILE_ERROR = 'FILE_ERROR',
  WALLET_CONVERSION_ERROR = 'WALLET_CONVERSION_ERROR',
}
```

## Examples

```ts twoslash
import { NosanaError, ErrorCodes } from '@nosana/kit';

try {
  const job: Job = await client.jobs.get('invalid-address');
} catch (error) {
  if (error instanceof NosanaError) {
    switch (error.code) {
      case ErrorCodes.RPC_ERROR:
        console.error('RPC connection failed:', error.message);
        break;
      case ErrorCodes.NO_WALLET:
        console.error('Wallet not configured');
        client.wallet = myWallet;
        break;
      case ErrorCodes.TRANSACTION_ERROR:
        console.error('Transaction failed:', error.details);
        break;
      default:
        console.error('Unknown error:', error.message);
    }
  } else {
    throw error; // Re-throw non-Nosana errors
  }
}
```


# Authorization Service

The authorization service provides cryptographic message signing and validation using Ed25519 signatures. It's automatically available on the client and adapts based on whether a wallet is configured.

## Behavior

- **With Wallet**: When a wallet is set, the authorization service provides all methods including `generate`, `validate`, `generateHeaders`, and `validateHeaders`.
- **Without Wallet**: When no wallet is set, the authorization service only provides `validate` and `validateHeaders` methods (read-only validation).

## Methods

### Generate Message Signature

```ts
generate(message: string | Uint8Array, options?: GenerateOptions): Promise<string>
```

Generate a signed message (requires wallet).

### Validate Signed Message

```ts
validate(
  message: string | Uint8Array,
  signature: string | Uint8Array,
  publicKey?: string | Uint8Array
): Promise<boolean>
```

Validate a signed message.

### Generate HTTP Header Signatures

```ts
generateHeaders(
  method: string,
  path: string,
  body?: string | Uint8Array,
  options?: GenerateHeaderOptions
): Promise<Headers>
```

Signing HTTP headers requires wallet.

### Validate HTTP Header Signatures

```ts
validateHeaders(headers: Headers | Record<string, string>): Promise<boolean>
```

Validate HTTP header signatures.

## Examples

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
import type { Wallet } from '@nosana/kit';
import { generateKeyPairSigner } from '@solana/kit';
const client = createNosanaClient();
const myWallet: Wallet = await generateKeyPairSigner();
const requestHeaders: Record<string, string | string[] | undefined> = { 'authorization': 'some-token' };
// ---cut---
// Set wallet first to enable signing
client.wallet = myWallet;

// Generate message signature
const messageToSign = 'Hello, Nosana!';
const signedMessage: string = await client.authorization.generate(messageToSign);
console.log('Signed message:', signedMessage);

// Validate a signed message (requires validationString with message+signature, and publicKey)
// Note: validationString typically contains both message and signature separated
const validationString = `${messageToSign}:${signedMessage}`; // Format may vary
// Get publicKey from wallet (in real usage, extract from wallet's public key)
const publicKey = new Uint8Array(32); // Placeholder - extract actual public key from wallet
const isValid: boolean = client.authorization.validate(validationString, publicKey);
console.log('Message is valid:', isValid);

// Generate signed HTTP headers for API requests
// generateHeaders takes a message string and optional options
const requestMessage = 'POST /api/jobs';
const headers: Headers = await client.authorization.generateHeaders(requestMessage, {
  expiry: Date.now() + 3600000, // 1 hour from now
  key: 'authorization',
  includeTime: true,
  separator: ':',
});

// Use headers in HTTP request
fetch('https://api.nosana.com/api/jobs', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({ data: 'example' }),
});

// Validate incoming HTTP headers (requires headers as IncomingHttpHeaders and publicKey)
const publicKeyForValidation = new Uint8Array(32); // Placeholder - extract actual public key
// Convert Headers to IncomingHttpHeaders format (Record<string, string | string[] | undefined>)
const isValidRequest: boolean = client.authorization.validateHeaders(requestHeaders, publicKeyForValidation);
if (!isValidRequest) {
  throw new Error('Invalid authorization');
}
```

## Use Cases

- **API Authentication**: Sign requests to Nosana APIs using message signatures
- **Message Verification**: Verify signed messages from other parties
- **Secure Communication**: Establish authenticated communication channels
- **Request Authorization**: Validate incoming API requests


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

Generating message signatures (requires wallet).

### Validate Message Signature

```ts
validate(
  validationString: string,
  address: string,
  options?: Partial<ValidateOptions>
): boolean
```

Validate a signed message against the signer's address (its public key in base58).

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
validateHeaders(
  headers: IncomingHttpHeaders,
  address: string,
  options?: Partial<Pick<GenerateHeaderOptions, 'key'>> & Partial<ValidateOptions>
): boolean
```

Validate a signed HTTP header against the signer's address.

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
const messageSignature: string = await client.authorization.generate(messageToSign);
console.log('Message signature:', messageSignature);

// Validate message signature (requires validationString with message+signature, and the signer's address)
// Note: validationString typically contains both message and signature separated
const validationString = `${messageToSign}:${messageSignature}`; // Format may vary
const isValid: boolean = client.authorization.validate(validationString, myWallet.address);
console.log('Message is valid:', isValid);

// Generate HTTP header signatures for API requests
// generateHeaders takes a message string and optional options
const requestMessage = 'POST /jobs';
const headers: Headers = await client.authorization.generateHeaders(requestMessage, {
  expiry: Date.now() + 3600000, // 1 hour from now
  key: 'authorization',
  includeTime: true,
  separator: ':',
});

// Use headers in HTTP request
fetch('https://api.nosana.com/jobs', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({ data: 'example' }),
});

// Validate incoming HTTP header signatures (requires headers as IncomingHttpHeaders and the signer's address)
// Convert Headers to IncomingHttpHeaders format (Record<string, string | string[] | undefined>)
const isValidRequest: boolean = client.authorization.validateHeaders(requestHeaders, myWallet.address);
if (!isValidRequest) {
  throw new Error('Invalid authorization');
}
```

## Use Cases

- **API Authentication**: Sign requests to Nosana APIs using message signatures
- **Message Verification**: Verify message signatures from other parties
- **Secure Communication**: Establish authenticated communication channels
- **Request Authorization**: Validate incoming API requests


# Authorization Service

The authorization service provides cryptographic message signing and validation using Ed25519 signatures. It's automatically available on the client and adapts based on whether a wallet is configured.

## Behavior

- **With Wallet**: When a wallet is set, the authorization service provides all methods including `generate`, `validate`, `generateHeaders`, and `validateHeaders`.
- **Without Wallet**: When no wallet is set, the authorization service only provides `validate` and `validateHeaders` methods (read-only validation).

## Methods

### Generate Signed Message

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

### Generate Signed HTTP Headers

```ts
generateHeaders(
  method: string,
  path: string,
  body?: string | Uint8Array,
  options?: GenerateHeaderOptions
): Promise<Headers>
```

Generate signed HTTP headers (requires wallet).

### Validate HTTP Headers

```ts
validateHeaders(headers: Headers | Record<string, string>): Promise<boolean>
```

Validate HTTP headers.

## Examples

```ts
// Set wallet first to enable signing
client.wallet = myWallet;

// Generate a signed message
const signedMessage: string = await client.authorization.generate('Hello, Nosana!');
console.log('Signed message:', signedMessage);

// Validate a signed message
const isValid: boolean = await client.authorization.validate('Hello, Nosana!', signedMessage);
console.log('Message is valid:', isValid);

// Generate signed HTTP headers for API requests
const headers: Headers = await client.authorization.generateHeaders(
  'POST',
  '/api/jobs',
  JSON.stringify({ data: 'example' })
);

// Use headers in HTTP request
fetch('https://api.nosana.com/api/jobs', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({ data: 'example' }),
});

// Validate incoming HTTP headers
const isValidRequest: boolean = await client.authorization.validateHeaders(requestHeaders);
if (!isValidRequest) {
  throw new Error('Invalid authorization');
}
```

## Use Cases

- **API Authentication**: Sign requests to Nosana APIs using message signatures
- **Message Verification**: Verify signed messages from other parties
- **Secure Communication**: Establish authenticated communication channels
- **Request Authorization**: Validate incoming API requests


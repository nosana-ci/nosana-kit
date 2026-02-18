# @nosana/authorization

A lightweight, secure authorization module for signing and validating messages using Ed25519 cryptographic signatures. Perfect for API authentication, message verification, and secure communications in both Node.js and browser environments.

## Features

- 🔐 **Cryptographic Message Signing** - Sign messages using Ed25519 (via TweetNaCl)
- ✅ **Message Validation** - Verify signatures with public keys
- 🌐 **Universal** - Works in both Node.js and browser environments
- 🦊 **Phantom Wallet Support** - Automatic integration with Phantom wallet in browser
- ⏰ **Time-based Expiry** - Built-in timestamp support for time-limited signatures
- 🎯 **HTTP Headers Integration** - Easy-to-use functions for HTTP authorization headers
- 📦 **Zero Config** - Works out of the box with sensible defaults
- 🔧 **Flexible** - Customizable separators, expiry times, and header keys

## Installation

```bash
npm install @nosana/authorization
```

## Quick Start

### Generate a Signed Message

```typescript
import { generate } from '@nosana/authorization';
import nacl from 'tweetnacl';

// Generate a keypair
const keypair = nacl.sign.keyPair();

// Sign a message
const signedMessage = await generate('Hello, World!', keypair.secretKey);
console.log(signedMessage);
// Output: "Hello, World!:5K8X9mP2nQ7rT..."
```

### Validate a Signed Message

```typescript
import { validate } from '@nosana/authorization';

const isValid = validate(signedMessage, keypair.publicKey);

console.log(isValid); // true
```

## API Reference

### Generation Functions

#### `generate(message, secretKey, options?)`

Sign a message with a secret key.

**Parameters:**

- `message` (string) - The message to sign
- `secretKey` (Uint8Array) - The Ed25519 secret key (64 bytes)
- `options` (object, optional)
  - `includeTime` (boolean) - Include timestamp in signature (default: `false`)
  - `separator` (string) - Separator character (default: `':'`)

**Returns:** Promise<string> - The signed message

**Example:**

```typescript
import { generate } from '@nosana/authorization';

// Basic usage
const signed = await generate('my-message', secretKey);

// With timestamp
const signedWithTime = await generate('my-message', secretKey, {
  includeTime: true,
});

// Custom separator
const signedCustom = await generate('my-message', secretKey, {
  separator: '||',
});
```

#### `generate(message, signMessageFn, options?)`

Sign a message with a custom signing function (e.g., for hardware wallets).

**Parameters:**

- `message` (string) - The message to sign
- `signMessageFn` (function) - Async function that takes `Uint8Array` and returns signature
- `options` (object, optional) - Same as above

**Example:**

```typescript
// Custom signing function
const customSigner = async (message: Uint8Array) => {
  // Your custom signing logic
  return signature;
};

const signed = await generate('my-message', customSigner);
```

#### `generateHeaders(message, secretKey, options?)`

Generate HTTP headers with authorization signature.

**Parameters:**

- `message` (string) - The message to sign
- `secretKey` (Uint8Array | SignMessageFn) - Secret key or signing function
- `options` (object, optional)
  - `key` (string) - Header key name (default: `'Authorization'`)
  - `includeTime` (boolean) - Include timestamp
  - `separator` (string) - Separator character

**Returns:** Promise<Headers> - HTTP Headers object

**Example:**

```typescript
import { generateHeaders } from '@nosana/authorization';

const headers = await generateHeaders('api-request', secretKey, {
  includeTime: true,
  key: 'X-Auth',
});

// Use with fetch
fetch('https://api.example.com', { headers });
```

### Validation Functions

#### `validate(validationString, publicKey, options?)`

Validate a signed message.

**Parameters:**

- `validationString` (string) - The signed message to validate
- `publicKey` (Uint8Array) - The Ed25519 public key (32 bytes)
- `options` (object, optional)
  - `expiry` (number) - Maximum age in seconds (default: `300`)
  - `separator` (string) - Separator character (default: `':'`)
  - `expected_message` (string) - Expected message content

**Returns:** boolean - `true` if signature is valid

**Throws:**

- `'Invalid signature.'` - Missing message or signature
- `'Failed to authenticate message.'` - Message doesn't match expected
- `'Authorization has expired.'` - Timestamp exceeds expiry

**Example:**

```typescript
import { validate } from '@nosana/authorization';

try {
  const isValid = validate(signedMessage, publicKey, {
    expiry: 600, // 10 minutes
    expected_message: 'my-message',
  });

  if (isValid) {
    console.log('Signature is valid!');
  }
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

#### `validateHeaders(headers, publicKey, options?)`

Validate HTTP request headers containing authorization signature.

**Parameters:**

- `headers` (IncomingHttpHeaders) - HTTP headers object
- `publicKey` (Uint8Array) - The Ed25519 public key
- `options` (object, optional)
  - `key` (string) - Header key to validate (default: `'authorization'`)
  - `expiry` (number) - Maximum age in seconds
  - `separator` (string) - Separator character
  - `expected_message` (string) - Expected message content

**Returns:** boolean - `true` if signature is valid

**Example:**

```typescript
import { validateHeaders } from '@nosana/authorization';
import { IncomingMessage } from 'http';

// In your HTTP server
function handleRequest(req: IncomingMessage) {
  try {
    const isValid = validateHeaders(req.headers, publicKey, {
      key: 'authorization',
      expiry: 300,
    });

    if (isValid) {
      // Process authenticated request
    }
  } catch (error) {
    // Handle authentication error
    console.error('Auth failed:', error.message);
  }
}
```

## Advanced Usage

### Time-Limited Signatures

Create signatures that expire after a certain time:

```typescript
// Generate with timestamp
const signed = await generate('api-request', secretKey, {
  includeTime: true,
});

// Validate with 5-minute expiry
const isValid = validate(signed, publicKey, {
  expiry: 300, // 5 minutes in seconds
});
```

### Custom Separators

Use custom separators to avoid conflicts with message content:

```typescript
const signed = await generate('message:with:colons', secretKey, {
  separator: '||',
});

const isValid = validate(signed, publicKey, {
  separator: '||',
});
```

### Message Verification

Ensure the signed message matches expected content:

```typescript
const signed = await generate('login-request', secretKey);

const isValid = validate(signed, publicKey, {
  expected_message: 'login-request',
});
// Throws error if message doesn't match
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  GenerateOptions,
  ValidateOptions,
  AuthorizationOptions,
  SignMessageFn,
} from '@nosana/authorization';

const options: GenerateOptions = {
  includeTime: true,
  separator: ':',
};
```

## Security Considerations

- 🔑 **Never expose secret keys** - Keep secret keys secure and never commit them to version control
- ⏰ **Use time-based expiry** - Always set reasonable expiry times for time-sensitive operations
- 🔒 **Validate on server** - Always validate signatures on the server side
- 🌐 **HTTPS only** - Use HTTPS when transmitting signed messages over networks
- 🎯 **Expected messages** - Use `expected_message` option to prevent replay attacks

## Browser Compatibility

This package works in all modern browsers that support:

- Web Crypto API
- TextEncoder/TextDecoder
- Uint8Array

For older browsers, you may need polyfills.

## License

MIT © Nosana

## Related Packages

- `tweetnacl` - Cryptographic library
- `bs58` - Base58 encoding

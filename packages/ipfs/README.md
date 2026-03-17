# @nosana/ipfs

A TypeScript IPFS client for pinning and retrieving data from IPFS, with built-in support for Pinata and Solana hash conversion.

## Installation

```bash
npm install @nosana/ipfs
```

## Usage

### Basic Setup

```typescript
import { createIpfsClient } from '@nosana/ipfs';

// Create client with default Pinata configuration
const ipfs = createIpfsClient();

// Or with custom configuration
const ipfs = createIpfsClient({
  api: 'https://api.pinata.cloud',
  gateway: 'https://gateway.pinata.cloud/ipfs/',
  jwt: 'your-jwt-token',
});
```

### Pin JSON Data

Pin a JSON object to IPFS:

```typescript
const data = {
  name: 'example.txt',
  content: 'Hello, IPFS!',
};

const ipfsHash = await ipfs.pin(data);
console.log('Pinned to:', ipfsHash);
// Output: QmR9F9tMJWdhSCvqjPiTnthG4aEKz8DgJK35ko96YgbpXY
```

### Pin Files

Pin a file from the filesystem:

```typescript
const ipfsHash = await ipfs.pinFile('./path/to/file.txt');
console.log('File pinned to:', ipfsHash);
```

### Retrieve Data

Retrieve data from IPFS using a hash:

```typescript
// Retrieve with IPFS hash (string)
const data = await ipfs.retrieve<MyDataType>('QmR9F9tMJWdhSCvqjPiTnthG4aEKz8DgJK35ko96YgbpXY');

// Retrieve with Solana byte array (number[])
const solanaHash = [41, 167, 9, 157, ...]; // 32-byte array
const data = await ipfs.retrieve<MyDataType>(solanaHash);
```

## API Reference

### `createIpfsClient(config?: Partial<IPFSConfig>)`

Creates an IPFS client instance.

**Parameters:**

- `config` (optional): Configuration object
  - `api`: IPFS API endpoint (default: Pinata API)
  - `gateway`: IPFS gateway URL (default: Pinata gateway)
  - `jwt`: JWT authentication token (optional)

**Returns:** Object with methods:

- `pin(data: object): Promise<string>` - Pin JSON data to IPFS
- `pinFile(path: string): Promise<string>` - Pin a file to IPFS
- `retrieve<T>(hash: string | number[]): Promise<T>` - Retrieve data from IPFS

## Configuration

### Default Configuration

The client uses Pinata by default:

```typescript
{
  api: 'https://api.pinata.cloud',
  gateway: 'https://nosana.mypinata.cloud/ipfs/',
  jwt: '<default-jwt-token>'
}
```

### Custom Configuration

Override any or all configuration options:

```typescript
const ipfs = createIpfsClient({
  api: 'https://custom-ipfs-api.com',
  gateway: 'https://custom-gateway.com/ipfs/',
  jwt: 'your-custom-jwt-token',
});
```

## Solana Integration

The library includes utilities for converting between Solana hash arrays and IPFS CIDs:

```typescript
import { solHashToIpfsHash, ipfsHashToByteArray } from '@nosana/ipfs';

// Convert Solana 32-byte array to IPFS hash
const solanaHash = [41, 167, 9, 157, ...]; // 32 bytes
const ipfsHash = solHashToIpfsHash(solanaHash);

// Convert IPFS hash back to 32-byte array
const byteArray = ipfsHashToByteArray('QmR9F9tMJWdhSCvqjPiTnthG4aEKz8DgJK35ko96YgbpXY');
```

## Examples

### Pin and Retrieve an Object

```typescript
import { createIpfsClient } from '@nosana/ipfs';

const ipfs = createIpfsClient();

const data = { message: 'Hello IPFS!' };
const hash = await ipfs.pin(data);

const retrieved = await ipfs.retrieve<typeof data>(hash);
console.log(retrieved.message); // "Hello IPFS!"
```

### Pin and Retrieve a File

```typescript
import { createIpfsClient } from '@nosana/ipfs';
import fs from 'fs';

const ipfs = createIpfsClient();

// Pin file
const hash = await ipfs.pinFile('./document.pdf');

// Retrieve file content
const content = await ipfs.retrieve<string>(hash);
fs.writeFileSync('./downloaded.pdf', content);
```

## Error Handling

All methods throw errors on failure:

```typescript
try {
  const hash = await ipfs.pin(data);
} catch (error) {
  console.error('Failed to pin data:', error.message);
}
```

## License

MIT

## Author

Nosana

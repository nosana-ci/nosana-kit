# IPFS Service

The IPFS service provides methods to pin data to IPFS and retrieve data from IPFS. It's configured via the `ipfs` property in the client configuration.

## Configuration

```ts twoslash
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  ipfs: {
    api: 'https://api.pinata.cloud',
    jwt: 'your-pinata-jwt-token',
    gateway: 'https://gateway.pinata.cloud/ipfs/',
  },
});
```

## Methods

### Pin JSON Data

```ts twoslash
pin(data: object): Promise<string>
```

### Pin File

```ts twoslash
pinFile(filePath: string): Promise<string>
```

### Retrieve Data

```ts twoslash
retrieve(hash: string | Uint8Array): Promise<any>
```

## Examples

```ts twoslash
// Pin job definition to IPFS
const cid: string = await client.ipfs.pin({
  version: 1,
  type: 'docker',
  image: 'ubuntu:latest',
  command: ['echo', 'hello'],
});
console.log('Pinned to IPFS:', cid);

// Pin a file to IPFS
const fileCid: string = await client.ipfs.pinFile('/path/to/file.txt');

// Retrieve job results from IPFS
const results: any = await client.ipfs.retrieve(job.ipfsResult);
console.log('Job results:', results);
```

## Utility Functions

The SDK also exports utility functions for converting between Solana hash formats and IPFS CIDs:

```ts twoslash
import { solBytesArrayToIpfsHash, ipfsHashToSolBytesArray } from '@nosana/kit';

// Convert Solana hash bytes to IPFS CID
const ipfsCid: string = solBytesArrayToIpfsHash(solanaHashBytes);

// Convert IPFS CID to Solana hash bytes
const solanaHash: Uint8Array = ipfsHashToSolBytesArray(ipfsCid);
```


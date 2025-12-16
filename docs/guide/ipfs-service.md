# IPFS Service

The IPFS service provides methods to pin data to IPFS and retrieve data from IPFS. It's configured via the `ipfs` property in the client configuration.

## Configuration

```ts
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

```ts
pin(data: object): Promise<string>
```

### Pin File

```ts
pinFile(filePath: string): Promise<string>
```

### Retrieve Data

```ts
retrieve(hash: string | Uint8Array): Promise<any>
```

## Examples

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
import type { Job } from '@nosana/kit';
const client = createNosanaClient();
const job: Job = {} as Job;
// ---cut---
// Pin job definition to IPFS
const cid: string = await client.ipfs.pin({
  version: '0.1',
  type: 'container',
  meta: {
    trigger: 'cli',
  },
  ops: [
    {
      type: 'container/run',
      id: 'run-1',
      args: {
        cmd: 'echo hello',
        image: 'ubuntu:latest',
      },
    },
  ],
});
console.log('Pinned to IPFS:', cid);

// Pin a file to IPFS
const fileCid: string = await client.ipfs.pinFile('/path/to/file.txt');

// Retrieve job results from IPFS
if (job.ipfsResult) {
  const results: any = await client.ipfs.retrieve(job.ipfsResult);
  console.log('Job results:', results);
}
```

## Utility Functions

The SDK also exports utility functions for converting between Solana hash formats and IPFS CIDs.

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
import { solBytesArrayToIpfsHash, ipfsHashToSolBytesArray } from '@nosana/kit';

// Convert Solana hash bytes to IPFS CID
const solanaHashBytes: number[] = [1, 2, 3, 4, 5]; // Example bytes
const ipfsCid: string = solBytesArrayToIpfsHash(solanaHashBytes);

// Convert IPFS CID to Solana hash bytes
const solanaHash: number[] = ipfsHashToSolBytesArray(ipfsCid);
```


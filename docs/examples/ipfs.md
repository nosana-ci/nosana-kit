# IPFS Examples

## Pin Job Definition

```typescript
// Pin job definition to IPFS
const cid: string = await client.ipfs.pin({
  version: 1,
  type: 'docker',
  image: 'ubuntu:latest',
  command: ['echo', 'Hello World'],
  env: {
    MY_VAR: 'value',
  },
});

console.log('Pinned to IPFS:', cid);
```

## Pin a File

```typescript
// Pin a file to IPFS
const fileCid: string = await client.ipfs.pinFile('/path/to/file.txt');
console.log('File CID:', fileCid);
```

## Retrieve Job Results

```typescript
import type { Job } from '@nosana/kit';

// Get a job
const job: Job = await client.jobs.get('job-address');

// Retrieve results from IPFS if available
if (job.ipfsResult) {
  const results: any = await client.ipfs.retrieve(job.ipfsResult);
  console.log('Job results:', results);
}
```

## Convert Hash Formats

```typescript
import { solBytesArrayToIpfsHash, ipfsHashToSolBytesArray } from '@nosana/kit';

// Convert Solana hash bytes to IPFS CID
const solanaHashBytes: Uint8Array = new Uint8Array([/* ... */]);
const ipfsCid: string = solBytesArrayToIpfsHash(solanaHashBytes);
console.log('IPFS CID:', ipfsCid);

// Convert IPFS CID to Solana hash bytes
const solanaHash: Uint8Array = ipfsHashToSolBytesArray(ipfsCid);
console.log('Solana hash:', solanaHash);
```


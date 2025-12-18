# IPFS Examples

## Pin Job Definition

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
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
        cmd: 'echo Hello World',
        image: 'ubuntu:latest',
        env: {
          MY_VAR: 'value',
        },
      },
    },
  ],
});

console.log('Pinned to IPFS:', cid);
```

## Pin a File

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
// Pin a file to IPFS
const fileCid: string = await client.ipfs.pinFile('/path/to/file.txt');
console.log('File CID:', fileCid);
```

## Retrieve Job Results

```ts twoslash
import { createNosanaClient } from '@nosana/kit';
const client = createNosanaClient();
// ---cut---
import type { Job } from '@nosana/kit';
// Get a job
import { address } from '@nosana/kit';
const job: Job = await client.jobs.get(address('job-address'));

// Retrieve results from IPFS if available
if (job.ipfsResult) {
  const results: any = await client.ipfs.retrieve(job.ipfsResult);
  console.log('Job results:', results);
}
```

## Convert Hash Formats

```ts twoslash
import { solBytesArrayToIpfsHash, ipfsHashToSolBytesArray } from '@nosana/kit';

// Convert Solana hash bytes to IPFS CID
const solanaHashBytes: number[] = [/* ... */];
const ipfsCid: string = solBytesArrayToIpfsHash(solanaHashBytes);
console.log('IPFS CID:', ipfsCid);

// Convert IPFS CID to Solana hash bytes
const solanaHash: number[] = ipfsHashToSolBytesArray(ipfsCid);
console.log('Solana hash:', solanaHash);
```


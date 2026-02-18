import { createIpfsClient, ipfsHashToSolBytesArray } from '../dist/index.js';

// tsx examples/pin.ts

const EXAMPLE_OBJECT = {
  name: 'example.txt',
  content: 'Hello, IPFS!',
};

const client = createIpfsClient();

const pin = await client.pin(EXAMPLE_OBJECT);
console.log('Object pinned to:', pin);

const solanaBytes = ipfsHashToSolBytesArray(pin);
console.log('Converting to solana bytes array:', solanaBytes);

const retrievedObject = await client.retrieve(solanaBytes);

if (JSON.stringify(EXAMPLE_OBJECT) !== JSON.stringify(retrievedObject)) {
  throw new Error('Retrieved object does not match the original object');
}

console.log('Object retrieved from IPFS:', retrievedObject);

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createIpfsClient } from '../dist/index.js';

// tsx examples/pinFile.ts

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EXAMPLE_FILE_PATH = join(__dirname, 'helpers/EXAMPLE_FILE.txt');

try {
  const client = createIpfsClient();

  const pin = await client.pinFile(EXAMPLE_FILE_PATH);
  console.log('File pinned to:', pin);

  const fileFromIpfs = await client.retrieve(pin);

  if (fs.readFileSync(EXAMPLE_FILE_PATH, 'utf-8') !== fileFromIpfs) {
    throw new Error('Retrieved file does not match the original file');
  }

  console.log('File retrieval successful:', fileFromIpfs);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}

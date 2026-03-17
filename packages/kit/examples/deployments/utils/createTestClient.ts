import fs from 'fs';
import os from 'os';
import { createKeyPairSignerFromPrivateKeyBytes } from '@solana/kit';

import { createNosanaClient } from '../../../src/index.js';

const keyData = JSON.parse(
  fs.readFileSync(os.homedir() + '/.nosana/nosana_key.json', 'utf8')
);

export const createTestClient = async () => {
  const client = createNosanaClient('mainnet', {
    api: {
      backend_url: "http://localhost:3001",
    }
  });
  client.wallet = await createKeyPairSignerFromPrivateKeyBytes(
    new Uint8Array(keyData).slice(0, 32)
  );
  return client;
};

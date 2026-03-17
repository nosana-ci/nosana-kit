import fs from 'fs';

import { endpoints } from '../defaults/index.js';

import type { FetchClient } from "../types.js";

export async function pinFile(path: string, client: FetchClient): Promise<string> {
  const data = new FormData();
  const fileBuffer = fs.readFileSync(path);
  data.append('file', new Blob([fileBuffer]));

  const [response, error] = await client.POST<{ IpfsHash: string }>(endpoints.pinFileToIPFS, {
    body: data
  });

  if (error) {
    throw error;
  }

  return response.IpfsHash;
}
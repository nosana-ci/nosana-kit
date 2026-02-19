import { solBytesArrayToIpfsHash } from "../utils/encoding.js";

import type { FetchClient } from "../types.js";

export async function retrieve<T>(hash: string | Array<number>, client: FetchClient): Promise<T> {
  const [response, error] = await client.GET(typeof hash === 'string' ? hash : solBytesArrayToIpfsHash(hash));

  if (error) {
    throw error;
  }

  return response as T;
}
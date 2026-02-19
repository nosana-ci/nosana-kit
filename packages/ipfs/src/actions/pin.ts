import { endpoints } from "../defaults/index.js";

import type { FetchClient } from "../types.js";

export async function pin(data: object, client: FetchClient): Promise<string> {
  const [response, error] = await client.POST<{ IpfsHash: string }>(endpoints.pinJSONToIPFS, {
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data)
  });

  if (error) {
    throw error;
  }

  return response.IpfsHash;
}
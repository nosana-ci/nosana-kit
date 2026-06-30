import { createIPFSFetchClient } from "./utils/createIPFSFetchClient.js";

// Actions
import { pin } from "./actions/pin.js";
import { pinFile } from "./actions/pinFile.js";
import { retrieve } from "./actions/retrieve.js";
import { defaultIPFSConfig } from "./defaults/index.js";

// Types
import type { IPFSConfig } from "./types.js";

export type NosanaIpfsClient = {
  pin: (data: object) => Promise<string>;
  pinFile: (path: string) => Promise<string>;
  retrieve: <T>(hash: string | Array<number>) => Promise<T>;
};

export function createIpfsClient(config?: Partial<IPFSConfig>): NosanaIpfsClient {
  const fetchClient = createIPFSFetchClient({ ...defaultIPFSConfig, ...config });

  return {
    pin: async (data: object) => await pin(data, fetchClient),
    pinFile: async (path: string) => await pinFile(path, fetchClient),
    retrieve: async <T>(hash: string | Array<number>) => await retrieve<T>(hash, fetchClient),
  }
}

export { defaultIPFSConfig } from "./defaults/index.js"
export * from "./utils/encoding.js"
export type * from "./types.js"
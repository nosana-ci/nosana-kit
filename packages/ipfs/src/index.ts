import { createIPFSFetchClient } from "./utils/createIPFSFetchClient.js";

// Actions
import { pin } from "./actions/pin.js";
import { pinFile } from "./actions/pinFile.js";
import { retrieve } from "./actions/retrieve.js";
import { defaultIPFSConfig } from "./defaults/index.js";

// Types
import type { IPFSConfig } from "./types.js";

export function createIpfsClient(config?: Partial<IPFSConfig>) {
  const fetchClient = createIPFSFetchClient(Object.assign(defaultIPFSConfig, config));

  return {
    pin: async (data: object) => await pin(data, fetchClient),
    pinFile: async (path: string) => await pinFile(path, fetchClient),
    retrieve: async <T>(hash: string | Array<number>) => await retrieve<T>(hash, fetchClient),
  }
}

export * from "./utils/encoding.js"
export type * from "./types.js"
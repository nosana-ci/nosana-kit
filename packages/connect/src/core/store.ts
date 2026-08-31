import type { ConnectStore } from './types.js';

/** In-memory store — the default when no persistence is provided. */
export function memoryStore(): ConnectStore {
  const map = new Map<string, string>();
  return {
    get: (k) => map.get(k) ?? null,
    set: (k, v) => {
      map.set(k, v);
    },
    remove: (k) => {
      map.delete(k);
    },
  };
}

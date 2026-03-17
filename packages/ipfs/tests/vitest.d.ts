import type { FetchClient, IPFSConfig } from '../src/types.js';

declare global {
  var TEST_HASH: string;
  var TEST_PIN_DATA: Object;
  var TEST_PIN_ERROR: Error;
  var TEST_RETRIEVE_ERROR: Error;
  var TEST_INVALID_HASH: string;
  var TEST_SOLANA_ARRAY: number[];
  var TEST_INVALID_SOLANA_ARRAY: number[];
  var TEST_FETCH_CLIENT: FetchClient;
  var TEST_IPFS_CONFIG: IPFSConfig;
  var TEST_IPFS_CONFIG_NO_JWT: IPFSConfig;
  var TEST_IPFS_RESPONSE: { IpfsHash: string; PinSize: number; Timestamp: string; };
}

export { };

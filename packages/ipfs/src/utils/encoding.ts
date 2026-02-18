import bs58 from 'bs58';

import { ERRORS } from '../defaults/index.js';

/**
   * Convert the ipfs bytes from a solana job to a CID
   * It prepends the 0x1220 (18,32) to make it 34 bytes and Base58 encodes it.
   * This result is IPFS addressable.
   */
export function solBytesArrayToIpfsHash(hashArray: Array<number>): string {
  if (hashArray.length !== 32) {
    throw ERRORS.INVALID_SOLANA_BYTES_ARRAY;
  }

  return bs58.encode(Buffer.from([18, 32, ...hashArray]));
}

/**
 * Converts IPFS hash to byte array needed to submit results
 * @param hash IPFS hash
 * @returns Array<number>
 */
export function ipfsHashToSolBytesArray(hash: string): Array<number> {
  const bytes = bs58.decode(hash);

  if (bytes[0] !== 0x12 || bytes[1] !== 0x20 || bytes.length !== 34) {
    throw ERRORS.INVALID_IPFS_HASH;
  }
  // Slice off the 2-byte IPFS prefix → return the 32-byte array that can be stored on Solana
  return Array.from(bytes.subarray(2));
}
import bs58 from 'bs58';
import { ReadonlyUint8Array } from 'gill';

/**
 * Class to interact with Pinata Cloud
 * https://www.pinata.cloud/
 */
export class IPFS {
  /**
   * Convert the ipfs bytes from a solana job to a CID
   * It prepends the 0x1220 (18,32) to make it 34 bytes and Base58 encodes it.
   * This result is IPFS addressable.
   */
  static solHashToIpfsHash(hashArray: ReadonlyUint8Array): string {
    let finalArray: Uint8Array;

    if (hashArray.length === 32) {
      // Create a new array with the prepended bytes [18, 32] + original array
      finalArray = new Uint8Array(34);
      finalArray[0] = 18;
      finalArray[1] = 32;
      finalArray.set(hashArray, 2);
    } else {
      // Use the array as-is if it's not 32 bytes
      finalArray = new Uint8Array(hashArray);
    }

    return bs58.encode(Buffer.from(finalArray));
  }

  /**
   * Converts IPFS hash to byte array needed to submit results
   * @param hash IPFS hash
   * @returns Array<number>
   */
  static IpfsHashToByteArray(hash: string): Uint8Array {
    if (hash.length === 34) {
      return new Uint8Array([...bs58.decode(hash).subarray(2)]);
    } else {
      return new Uint8Array([...bs58.decode(hash)]);
    }
  }
}

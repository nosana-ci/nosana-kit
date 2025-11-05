import bs58 from 'bs58';
import axios, { AxiosHeaders, AxiosInstance, AxiosRequestConfig } from 'axios';
import { ReadonlyUint8Array } from 'gill';
import type { IpfsConfig } from '../config/types.js';

// Import form-data dynamically for Node.js environments
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let FormData: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fs: any;

// Dynamically import Node.js-specific modules
const loadNodeModules = async () => {
  if (typeof window === 'undefined') {
    try {
      const formDataModule = await import('form-data');
      FormData = formDataModule.default;
      fs = await import('fs');
    } catch (error) {
      console.warn('Node.js modules not available for file operations');
    }
  } else {
    // Use browser FormData
    FormData = window.FormData;
  }
};

/**
 * Class to interact with Pinata Cloud
 * https://www.pinata.cloud/
 */
export class IPFS {
  private api: AxiosInstance;
  config: IpfsConfig;

  constructor(config: IpfsConfig) {
    this.config = config;
    const headers: AxiosHeaders = new AxiosHeaders();
    if (this.config.jwt) {
      headers.set('Authorization', `Bearer ${this.config.jwt}`);
    }
    this.api = axios.create({
      baseURL: this.config.api,
      headers,
    });
  }

  /**
   * Convert the ipfs bytes from a solana job to a CID
   * It prepends the 0x1220 (18,32) to make it 34 bytes and Base58 encodes it.
   * This result is IPFS addressable.
   */
  static solHashToIpfsHash(hashArray: ReadonlyUint8Array | Array<number>): string | null {
    let finalArray: Uint8Array;
    const inputArray = Array.isArray(hashArray) ? hashArray : Array.from(hashArray);

    if (inputArray.length === 32) {
      // Create a new array with the prepended bytes [18, 32] + original array
      finalArray = new Uint8Array(34);
      finalArray[0] = 18;
      finalArray[1] = 32;
      finalArray.set(inputArray, 2);
    } else {
      // Use the array as-is if it's not 32 bytes
      finalArray = new Uint8Array(inputArray);
    }

    const hash = bs58.encode(Buffer.from(finalArray));
    if (hash === 'QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51') {
      return null;
    }
    return hash;
  }

  /**
   * Converts IPFS hash to byte array needed to submit results
   * @param hash IPFS hash
   * @returns Array<number>
   */
  static IpfsHashToByteArray(hash: string): Array<number> {
    if (hash.length === 34) {
      return [...bs58.decode(hash).subarray(2)];
    } else {
      return [...bs58.decode(hash)];
    }
  }

  /**
   * Retrieve data from IPFS using the configured gateway
   * @param hash IPFS hash string or byte array
   * @param options Additional axios request options
   * @returns The retrieved data
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async retrieve(hash: string | Array<number>, options: AxiosRequestConfig = {}): Promise<any> {
    if (typeof hash !== 'string') {
      const convertedHash = IPFS.solHashToIpfsHash(hash);
      if (!convertedHash) {
        throw new Error('Invalid hash provided');
      }
      hash = convertedHash;
    }
    const response = await axios.get(this.config.gateway + hash, options);
    return response.data;
  }

  /**
   * Function to pin data into Pinata Cloud
   * @param data Object to pin into IPFS as JSON
   * @returns The IPFS hash of the pinned data
   */
  async pin(data: object): Promise<string> {
    const response = await this.api.post('/pinning/pinJSONToIPFS', data);
    return response.data.IpfsHash;
  }

  /**
   * Function to pin a file into Pinata Cloud
   * @param filePath Path to the file to pin
   * @returns The IPFS hash of the pinned file
   */
  async pinFile(filePath: string): Promise<string> {
    // Ensure Node.js modules are loaded
    await loadNodeModules();

    if (!FormData || !fs) {
      throw new Error('File operations are not supported in this environment');
    }

    const data = new FormData();
    data.append('file', fs.createReadStream(filePath));

    const response = await this.api.post('/pinning/pinFileToIPFS', data, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${data.getBoundary()}`,
        Authorization: `Bearer ${this.config.jwt}`,
      },
    });
    return response.data.IpfsHash;
  }

  /**
   * Function to pin a file from buffer/blob into Pinata Cloud
   * @param fileBuffer Buffer or Blob containing the file data
   * @param fileName Name of the file
   * @returns The IPFS hash of the pinned file
   */
  async pinFileFromBuffer(fileBuffer: Buffer | Blob, fileName: string): Promise<string> {
    // Ensure FormData is available
    await loadNodeModules();

    if (!FormData) {
      throw new Error('FormData is not available in this environment');
    }

    const data = new FormData();
    data.append('file', fileBuffer, fileName);

    const response = await this.api.post('/pinning/pinFileToIPFS', data, {
      headers: {
        'Content-Type': `multipart/form-data${data.getBoundary ? `; boundary=${data.getBoundary()}` : ''}`,
        Authorization: `Bearer ${this.config.jwt}`,
      },
    });
    return response.data.IpfsHash;
  }
}

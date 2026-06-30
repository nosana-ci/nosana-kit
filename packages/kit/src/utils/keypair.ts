import {
  createKeyPairFromBytes,
  createKeyPairSignerFromBytes,
  createSignerFromKeyPair,
  generateKeyPairSigner,
  getBase58Encoder,
} from '@solana/kit';

import type { Wallet } from '../types.js';

/**
 * Generate a new random wallet (keypair signer).
 *
 * @returns A new randomly generated wallet
 *
 * @example
 * ```ts
 * import { generateWallet } from '@nosana/kit';
 *
 * const wallet = await generateWallet();
 * console.log(wallet.address);
 * ```
 *
 * @group @nosana/kit
 */
export async function generateWallet(): Promise<Wallet> {
  return await generateKeyPairSigner();
}

/**
 * Create a wallet from a 64-byte secret key (Uint8Array or number array).
 *
 * The bytes should be a 64-byte array containing the 32-byte private key
 * followed by the 32-byte public key, as used by Solana CLI keypair files.
 *
 * @param bytes - The secret key bytes (64 bytes)
 * @returns A wallet created from the provided bytes
 *
 * @example
 * ```ts
 * import { createWalletFromBytes } from '@nosana/kit';
 *
 * const secretKey = new Uint8Array([174, 47, 154, ...]);
 * const wallet = await createWalletFromBytes(secretKey);
 * ```
 *
 * @group @nosana/kit
 */
export async function createWalletFromBytes(
  bytes: Uint8Array | ReadonlyArray<number>
): Promise<Wallet> {
  const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return await createKeyPairSignerFromBytes(uint8);
}

/**
 * Create a wallet from a base58-encoded private key string.
 *
 * This accepts the full 64-byte keypair encoded as base58, as commonly
 * exported from wallets and tools like `solana-keygen`.
 *
 * @param base58Key - The base58-encoded secret key string
 * @returns A wallet created from the provided key
 *
 * @example
 * ```ts
 * import { createWalletFromBase58 } from '@nosana/kit';
 *
 * const wallet = await createWalletFromBase58(
 *   '5MaiiCavjCmn9Hs1o3eznqDEhRwxo7pXiAYez7keQUviUkauRiTMD8DrESdrNjN8zd9mTmVhRvBJeg5vhyvgrAhG'
 * );
 * console.log(wallet.address);
 * ```
 *
 * @group @nosana/kit
 */
export async function createWalletFromBase58(base58Key: string): Promise<Wallet> {
  const bytes = getBase58Encoder().encode(base58Key);
  const keyPair = await createKeyPairFromBytes(bytes);
  return await createSignerFromKeyPair(keyPair);
}

/**
 * Load a wallet from a Solana CLI keypair JSON file.
 *
 * Reads a JSON file containing a byte array (as used by `solana-keygen`)
 * and creates a wallet from it. Defaults to `~/.config/solana/id.json`
 * if no path is provided.
 *
 * @param filePath - Path to the keypair JSON file (default: `~/.config/solana/id.json`)
 * @returns A wallet loaded from the file
 *
 * @example
 * ```ts
 * import { loadWalletFromFile } from '@nosana/kit';
 *
 * // Load default Solana CLI keypair
 * const wallet = await loadWalletFromFile();
 *
 * // Or specify a custom path
 * const wallet = await loadWalletFromFile('/path/to/keypair.json');
 * console.log(wallet.address);
 * ```
 *
 * @group @nosana/kit
 */
export async function loadWalletFromFile(filePath?: string): Promise<Wallet> {
  const { readFile } = await import('node:fs/promises');
  const resolvedPath = filePath ?? getDefaultKeypairPath();
  const fileContent = await readFile(resolvedPath, 'utf8');
  const keyArray: number[] = JSON.parse(fileContent);
  return await createWalletFromBytes(keyArray);
}

function getDefaultKeypairPath(): string {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
  return `${home}/.config/solana/id.json`;
}

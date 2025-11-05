import { Buffer } from 'buffer';
import { createKeyPairSignerFromBytes, KeyPairSigner } from 'gill';
import { WalletConfig } from '../config/index.js';
import { NosanaError, ErrorCodes } from '../errors/NosanaError.js';
import { Logger } from '../logger/Logger.js';
import bs58 from 'bs58';

/**
 * Converts various wallet configurations to a KeyPairSigner
 * @param wallet The wallet configuration to convert
 * @returns A KeyPairSigner instance
 * @throws NosanaError if conversion fails
 */
export async function convertWalletConfigToKeyPairSigner(
  wallet: WalletConfig
): Promise<KeyPairSigner> {
  const logger = Logger.getInstance();

  try {
    // Check if we already have a KeyPairSigner type
    if (wallet && typeof wallet === 'object' && 'address' in wallet && 'signMessages' in wallet) {
      return wallet;
    }

    // Check if it's a browser wallet adapter (has publicKey and signTransaction/signMessage)
    if (
      wallet &&
      typeof wallet === 'object' &&
      'publicKey' in wallet &&
      ('signTransaction' in wallet || 'signMessage' in wallet)
    ) {
      // Convert browser wallet adapter to KeyPairSigner-like interface
      const browserWallet = wallet as any;
      wallet = {
        address: browserWallet.publicKey.toString(),
        signMessages: async (messages: Uint8Array[]) => {
          if (browserWallet.signMessage) {
            return Promise.all(messages.map((msg) => browserWallet.signMessage(msg)));
          }
          throw new Error('Browser wallet does not support message signing');
        },
        signTransactions: async (transactions: any[]) => {
          if (browserWallet.signTransaction) {
            return Promise.all(transactions.map((tx) => browserWallet.signTransaction(tx)));
          }
          throw new Error('Browser wallet does not support transaction signing');
        },
      } as unknown as KeyPairSigner;
      return wallet;
    }

    // If it's a string, try multiple conversion methods
    if (typeof wallet === 'string') {
      // Only try file/environment loading in Node.js environment
      if (typeof window === 'undefined') {
        try {
          // Use string concatenation to avoid bundler resolving this import at build time
          const nodeModule = 'gill' + '/node';
          const {
            loadKeypairSignerFromFile,
            loadKeypairSignerFromEnvironment,
            loadKeypairSignerFromEnvironmentBase58,
          } = await import(nodeModule);

          // Try to load from file path
          if (await isValidFilePath(wallet)) {
            try {
              wallet = await loadKeypairSignerFromFile(wallet);
              return wallet as KeyPairSigner;
            } catch (error) {
              logger.debug(`Failed to load keypair from file: ${error}`);
            }
          }

          // Try to load from environment variable
          try {
            wallet = await loadKeypairSignerFromEnvironment(wallet);
            return wallet as KeyPairSigner;
          } catch (error) {
            logger.debug(`Failed to load keypair from environment: ${error}`);
          }

          // Try to load from environment variable as base58
          try {
            wallet = await loadKeypairSignerFromEnvironmentBase58(wallet);
            return wallet as KeyPairSigner;
          } catch (error) {
            logger.debug(`Failed to load keypair from environment base58: ${error}`);
          }
        } catch (error) {
          logger.debug(`Node.js modules not available: ${error}`);
        }
      }

      // Try to parse as JSON array
      if ((wallet as string).startsWith('[')) {
        try {
          const key = JSON.parse(wallet as string);
          wallet = await createKeyPairSignerFromBytes(new Uint8Array(key));
          return wallet;
        } catch (error) {
          logger.debug(`Failed to parse as JSON array: ${error}`);
        }
      }

      // Try to decode as base58
      try {
        const key = Buffer.from(bs58.decode(wallet as string)).toJSON().data;
        wallet = await createKeyPairSignerFromBytes(new Uint8Array(key));
        return wallet;
      } catch (error) {
        logger.debug(`Failed to decode as base58: ${error}`);
      }
    }

    // If it's an array, try to create from bytes
    if (Array.isArray(wallet)) {
      try {
        wallet = await createKeyPairSignerFromBytes(new Uint8Array(wallet));
        return wallet;
      } catch (error) {
        logger.debug(`Failed to create from byte array: ${error}`);
      }
    }

    // If we get here, none of the conversion methods worked
    throw new Error('Unable to convert wallet to KeyPairSigner using any available method');
  } catch (error) {
    throw new NosanaError(
      `Failed to convert wallet to KeyPairSigner: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ErrorCodes.WALLET_CONVERSION_ERROR,
      error
    );
  }
}

/**
 * Checks if a file path is valid and accessible
 * @param filePath The file path to validate
 * @returns True if the file path is valid and accessible
 */
async function isValidFilePath(filePath: string): Promise<boolean> {
  // Only validate file paths in Node.js environment
  if (typeof window !== 'undefined') {
    return false; // Browser environment, no file system access
  }

  try {
    const [fs, path] = await Promise.all([import('fs'), import('path')]);

    if (!path.isAbsolute(filePath) && !filePath.startsWith('./') && !filePath.startsWith('../')) {
      return false;
    }
    const stats = await fs.promises.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

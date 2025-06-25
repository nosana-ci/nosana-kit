import { Buffer } from 'buffer';
if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer;
}
import { ClientConfig, getNosanaConfig, NosanaNetwork, PartialClientConfig, WalletConfig } from './config/index.js';
import { Logger } from './logger/Logger.js';
import { JobsProgram } from './programs/JobsProgram.js';
import { SolanaUtils } from './solana/SolanaUtils.js';
import { IPFS } from './ipfs/IPFS.js';
import { createKeyPairSignerFromBytes, KeyPairSigner } from 'gill';
import { NosanaError, ErrorCodes } from './errors/NosanaError.js';
import bs58 from 'bs58';

export class NosanaClient {
  public readonly config: ClientConfig;
  public readonly jobs: JobsProgram;
  public readonly solana: SolanaUtils;
  public readonly ipfs: IPFS;
  public readonly logger: Logger;
  public wallet: KeyPairSigner | undefined;

  constructor(network: NosanaNetwork = NosanaNetwork.MAINNET, customConfig?: PartialClientConfig) {
    this.config = getNosanaConfig(network, customConfig);
    if (this.config.wallet) {
      this.setWallet(this.config.wallet);
    }
    this.jobs = new JobsProgram(this);
    this.logger = Logger.getInstance();
    this.solana = new SolanaUtils(this);
    this.ipfs = new IPFS(this.config.ipfs);
  }

  public async setWallet(wallet: WalletConfig): Promise<KeyPairSigner | undefined> {
    try {
      // Check if we already have a KeyPairSigner type
      if (wallet && typeof wallet === 'object' && 'address' in wallet && 'signMessages' in wallet) {
        this.wallet = wallet as unknown as KeyPairSigner;
        return this.wallet;
      }

      // Check if it's a browser wallet adapter (has publicKey and signTransaction/signMessage)
      if (wallet && typeof wallet === 'object' && 'publicKey' in wallet && ('signTransaction' in wallet || 'signMessage' in wallet)) {
        // Convert browser wallet adapter to KeyPairSigner-like interface
        const browserWallet = wallet as any;
        this.wallet = {
          address: browserWallet.publicKey.toString(),
          signMessages: async (messages: Uint8Array[]) => {
            if (browserWallet.signMessage) {
              return Promise.all(messages.map(msg => browserWallet.signMessage(msg)));
            }
            throw new Error('Browser wallet does not support message signing');
          },
          signTransactions: async (transactions: any[]) => {
            if (browserWallet.signTransaction) {
              return Promise.all(transactions.map(tx => browserWallet.signTransaction(tx)));
            }
            throw new Error('Browser wallet does not support transaction signing');
          }
        } as unknown as KeyPairSigner;
        return this.wallet;
      }

      // If it's a string, try multiple conversion methods
      if (typeof wallet === 'string') {
        // Only try file/environment loading in Node.js environment
        if (typeof window === 'undefined') {
          try {
            // Use string concatenation to avoid bundler resolving this import at build time
            const nodeModule = 'gill' + '/node';
            const { loadKeypairSignerFromFile, loadKeypairSignerFromEnvironment, loadKeypairSignerFromEnvironmentBase58 } = await import(nodeModule);

            // Try to load from file path
            if (await this.isValidFilePath(wallet)) {
              try {
                this.wallet = await loadKeypairSignerFromFile(wallet);
                return this.wallet;
              } catch (error) {
                this.logger.debug(`Failed to load keypair from file: ${error}`);
              }
            }

            // Try to load from environment variable
            try {
              this.wallet = await loadKeypairSignerFromEnvironment(wallet);
              return this.wallet;
            } catch (error) {
              this.logger.debug(`Failed to load keypair from environment: ${error}`);
            }

            // Try to load from environment variable as base58
            try {
              this.wallet = await loadKeypairSignerFromEnvironmentBase58(wallet);
              return this.wallet;
            } catch (error) {
              this.logger.debug(`Failed to load keypair from environment base58: ${error}`);
            }
          } catch (error) {
            this.logger.debug(`Node.js modules not available: ${error}`);
          }
        }

        // Try to parse as JSON array
        if ((wallet as string).startsWith('[')) {
          try {
            const key = JSON.parse(wallet);
            this.wallet = await createKeyPairSignerFromBytes(new Uint8Array(key));
            return this.wallet;
          } catch (error) {
            this.logger.debug(`Failed to parse as JSON array: ${error}`);
          }
        }

        // Try to decode as base58
        try {
          const key = Buffer.from(bs58.decode(wallet)).toJSON().data;
          this.wallet = await createKeyPairSignerFromBytes(new Uint8Array(key));
          return this.wallet;
        } catch (error) {
          this.logger.debug(`Failed to decode as base58: ${error}`);
        }
      }

      // If it's an array, try to create from bytes
      if (Array.isArray(wallet)) {
        try {
          this.wallet = await createKeyPairSignerFromBytes(new Uint8Array(wallet));
          return this.wallet;
        } catch (error) {
          this.logger.debug(`Failed to create from byte array: ${error}`);
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

  private async isValidFilePath(filePath: string): Promise<boolean> {
    // Only validate file paths in Node.js environment
    if (typeof window !== 'undefined') {
      return false; // Browser environment, no file system access
    }

    try {
      const [fs, path] = await Promise.all([
        import('fs'),
        import('path')
      ]);

      if (!path.isAbsolute(filePath) && !filePath.startsWith('./') && !filePath.startsWith('../')) {
        return false;
      }
      const stats = await fs.promises.stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }
}

// Export types and configuration
export * from './config/index.js';
export * from './errors/NosanaError.js';
export * from './logger/Logger.js';

// Export JobsProgram and related types
export { JobsProgram, JobState, MarketQueueType } from './programs/JobsProgram.js';
export type { Job, Market, Run } from './programs/JobsProgram.js';

// Export IPFS utilities
export * from './ipfs/IPFS.js';
// Export all generated client types and functions
export * from './generated_clients/jobs/index.js';

// Export dependencies 
export * from 'gill';

import { createSolanaClient, address, Address } from 'gill';
import { NosanaError, ErrorCodes } from '../errors/NosanaError.js';
import { NosanaClient } from '../index.js';

export class SolanaUtils {
  private readonly sdk: NosanaClient;
  public readonly rpc;

  constructor(sdk: NosanaClient) {
    this.sdk = sdk;
    const rpcEndpoint = this.sdk.config.solana.rpcEndpoint;
    if (!rpcEndpoint) throw new NosanaError('RPC URL is required', ErrorCodes.INVALID_CONFIG);
    const { rpc } = createSolanaClient({ urlOrMoniker: rpcEndpoint });

    this.rpc = rpc;
  }

  public async getBalance(addressStr: string | Address): Promise<bigint> {
    try {
      this.sdk.logger.debug(`Getting balance for address: ${addressStr}`);
      const addr = address(addressStr);
      const balance = await this.rpc.getBalance(addr).send();
      return balance.value;
    } catch (error) {
      this.sdk.logger.error(`Failed to get balance: ${error}`);
      throw new NosanaError(
        'Failed to get balance',
        ErrorCodes.RPC_ERROR,
        error
      );
    }
  }

  public async getLatestBlockhash() {
    try {
      const { value: blockhash } = await this.rpc.getLatestBlockhash().send();
      return blockhash;
    } catch (error) {
      this.sdk.logger.error(`Failed to get latest blockhash: ${error}`);
      throw new NosanaError(
        'Failed to get latest blockhash',
        ErrorCodes.RPC_ERROR,
        error
      );
    }
  }
} 
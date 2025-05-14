import { BaseProgram } from './BaseProgram.js';
import { Address, address as toAddress } from 'gill';
import { NosanaClient } from '../index.js';
import * as programClient from "../generated_client/index.js";

export class JobsProgram extends BaseProgram {
  public readonly client: any; // TODO: Replace with actual JobsClient type

  constructor(sdk: NosanaClient) {
    super(sdk);
    this.client = {}; // Placeholder
  }

  protected getProgramId(): string {
    return programClient.NOSANA_JOBS_PROGRAM_ADDRESS;
  }

  /**
   * Fetch a job account by address
   */
  async get(addressStr: string | Address) {
    try {
      const addr = toAddress(addressStr);
      return await programClient.fetchJobAccount(this.sdk.solana.rpc, addr);
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch job ${err}`);
      throw err;
    }
  }

  // Add more methods as needed based on the Jobs program's functionality
} 
import { Address } from 'gill';
import { NosanaClient } from '../index.js';

export type staticAccounts = {
  rewardsReflection: Address,
  rewardsVault: Address,
  rewardsProgram: Address,
  jobsProgram: Address,
}

export abstract class BaseProgram {
  private _staticAccounts: staticAccounts | undefined;
  private _initializingAccounts: Promise<staticAccounts> | undefined;

  /**
   * Gets the static accounts, initializing them if needed.
   */
  public async getStaticAccounts(): Promise<staticAccounts> {
    if (this._staticAccounts) {
      return this._staticAccounts;
    }

    // If we're already initializing, return the existing promise
    if (this._initializingAccounts) {
      return this._initializingAccounts;
    }

    // Start initialization and store the promise
    this._initializingAccounts = this.initializeStaticAccounts();

    // Wait for initialization to complete
    this._staticAccounts = await this._initializingAccounts;
    this._initializingAccounts = undefined;

    return this._staticAccounts;
  }

  private async initializeStaticAccounts(): Promise<staticAccounts> {
    return {
      rewardsReflection: await this.sdk.solana.pda([
        'reflection',
      ], this.sdk.config.programs.rewardsAddress),
      rewardsVault: await this.sdk.solana.pda([
        this.sdk.config.programs.nosTokenAddress,
      ], this.sdk.config.programs.rewardsAddress),
      rewardsProgram: this.sdk.config.programs.rewardsAddress,
      jobsProgram: this.sdk.config.programs.jobsAddress
    };
  }
  protected readonly sdk: NosanaClient;

  constructor(sdk: NosanaClient) {
    this.sdk = sdk;
  }

  protected abstract getProgramId(): Address;
} 
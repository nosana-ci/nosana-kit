import { BaseProgram } from './BaseProgram.js';
import { Address, createTransaction, signTransactionMessageWithSigners, getExplorerLink, getSignatureFromTransaction, generateKeyPairSigner, Signature, EncodedAccount, parseBase64RpcAccount, Account, Base58EncodedBytes } from 'gill';
import { ErrorCodes, NosanaClient, NosanaError } from '../index.js';
import * as programClient from "../generated_clients/jobs/index.js";
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import bs58 from 'bs58';
import { IPFS } from '../ipfs/IPFS.js';
import { convertBigIntToNumber, ConvertTypesForDb } from '../utils/index.js';

export type Job = ConvertTypesForDb<programClient.JobAccountArgs>;
export type Market = ConvertTypesForDb<programClient.MarketAccountArgs>;
export type Run = ConvertTypesForDb<programClient.RunAccountArgs>;

export class JobsProgram extends BaseProgram {
  public readonly client: typeof programClient;

  constructor(sdk: NosanaClient) {
    super(sdk);
    this.client = programClient;
  }


  protected getProgramId(): Address {
    return this.sdk.config.programs.jobsAddress;
  }

  /**
   * Fetch a job account by address
   */
  async get(addr: Address): Promise<Account<programClient.JobAccount>> {
    try {
      return await this.client.fetchJobAccount(this.sdk.solana.rpc, addr);
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch job ${err}`);
      throw err;
    }
  }

  /**
 * Fetch multiple job accounts by address
 */
  async multiple(addresses: Address[]): Promise<Account<programClient.JobAccount>[]> {
    try {
      return await this.client.fetchAllJobAccount(this.sdk.solana.rpc, addresses);
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch job ${err}`);
      throw err;
    }
  }

  /**
  * Fetch all job accounts
  */
  async all(): Promise<Account<programClient.JobAccount>[]> {
    try {
      const getProgramAccountsResponse = await this.sdk.solana.rpc
        .getProgramAccounts(this.getProgramId(), {
          encoding: "base64",
          filters: [
            {
              memcmp: {
                offset: BigInt(0),
                bytes: bs58.encode(Buffer.from(programClient.JOB_ACCOUNT_DISCRIMINATOR)) as Base58EncodedBytes,
                encoding: "base58",
              },
            },
          ],
        })
        .send();

      // getProgramAccounts uses one format
      // decodeOffer uses another
      const encodedAccounts: Account<programClient.JobAccount>[] = getProgramAccountsResponse
        .map((result: typeof getProgramAccountsResponse[0]) => {
          try {
            return programClient.decodeJobAccount(parseBase64RpcAccount(result.pubkey, result.account));
          } catch (err) {
            this.sdk.logger.error(`Failed to decode job ${err}`);
            return null;
          }
        })
        .filter((account: Account<programClient.JobAccount> | null): account is Account<programClient.JobAccount> => account !== null);
      return encodedAccounts;
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch all jobs ${err}`);
      throw err;
    }
  }

  /**
   * Post a new job to the marketplace
   * @param params Parameters for listing a job
   * @returns The transaction signature
   */
  async post(params: {
    market: Address,
    timeout: number | bigint
    ipfsHash: string,
    node?: Address,
    instructionOnly?: boolean,
  }): Promise<ReturnType<typeof this.client.getListInstruction> | Signature> {
    if (!this.sdk.config.wallet) {
      throw new NosanaError('No wallet found', ErrorCodes.NO_WALLET);
    }

    const jobKey = await generateKeyPairSigner();
    const runKey = await generateKeyPairSigner();

    const [associatedTokenAddress] = await findAssociatedTokenPda({
      mint: this.sdk.config.programs.nosTokenAddress,
      owner: this.sdk.config.wallet!.signer.address,
      tokenProgram: TOKEN_PROGRAM_ADDRESS
    });
    try {
      const staticAccounts = await this.getStaticAccounts();
      // Create the list instruction
      const instruction = this.client.getListInstruction({
        job: jobKey,
        market: params.market,
        run: runKey,
        user: associatedTokenAddress,
        vault: await this.sdk.solana.pda([
          params.market,
          this.sdk.config.programs.nosTokenAddress,
        ], staticAccounts.jobsProgram),
        payer: this.sdk.config.wallet!.signer,
        rewardsReflection: staticAccounts.rewardsReflection,
        rewardsVault: staticAccounts.rewardsVault,
        authority: this.sdk.config.wallet!.signer,
        rewardsProgram: staticAccounts.rewardsProgram,
        ipfsJob: bs58.decode(params.ipfsHash).subarray(2),
        timeout: params.timeout
      });
      if (params.instructionOnly) return instruction;

      // Create the transaction
      const transaction = createTransaction({
        instructions: [instruction],
        feePayer: this.sdk.config.wallet!.signer,
        latestBlockhash: await this.sdk.solana.getLatestBlockhash(),
        version: 0,
      });

      // Sign the transaction with all required signers
      const signedTransaction = await signTransactionMessageWithSigners(transaction);

      // Get the transaction signature for logging
      const signature = getSignatureFromTransaction(signedTransaction);

      // Log the transaction explorer link
      const explorerLink = getExplorerLink({
        cluster: this.sdk.config.solana.cluster,
        transaction: signature
      });
      this.sdk.logger.info(`Sending list job transaction: ${explorerLink}`);

      // Send and confirm the transaction
      await this.sdk.solana.sendAndConfirmTransaction(signedTransaction);

      this.sdk.logger.info("Job listing transaction confirmed!");
      return signature;
    } catch (err) {
      this.sdk.logger.error(`Failed to list job: ${err instanceof Error ? err.message : String(err)}`);
      throw new Error(`Failed to list job: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
 * Monitor program account updates using callback functions
 * Uses WebSocket subscriptions with automatic restart on failure
 * 
 * @example
 * ```typescript
 * // Example: Monitor job accounts and save to file
 * const stopMonitoring = await jobsProgram.monitorAccountUpdates({
 *   onJobAccount: async (jobAccount) => {
 *     console.log('Job updated:', jobAccount.address.toString());
 *     // Save to database, file, or process as needed
 *   },
 *   onRunAccount: async (runAccount) => {
 *     console.log('Run updated:', runAccount.address.toString());
 *   },
 *   onError: async (error, accountType) => {
 *     console.error('Error processing account:', error, accountType);
 *   }
 * });
 * 
 * // Stop monitoring when done
 * stopMonitoring();
 * ```
 * 
 * @param options Configuration options for monitoring
 * @returns A function to stop monitoring
 */
  async monitorAccountUpdates(options: {
    onJobAccount?: (jobAccount: Account<Job>) => Promise<void> | void;
    onMarketAccount?: (marketAccount: Account<Market>) => Promise<void> | void;
    onRunAccount?: (runAccount: Account<Run>) => Promise<void> | void;
    onError?: (error: Error, accountType?: string) => Promise<void> | void;
  } = {}): Promise<() => void> {
    const {
      onJobAccount,
      onMarketAccount,
      onRunAccount,
      onError
    } = options;

    const programId = this.getProgramId();

    try {
      this.sdk.logger.info(`Starting to monitor job program account updates for program: ${programId}`);

      let abortController: AbortController | null = null;
      let isMonitoring = true;

      // Function to stop all monitoring
      const stopMonitoring = () => {
        isMonitoring = false;
        if (abortController) {
          abortController.abort();
        }
        this.sdk.logger.info(`Stopped monitoring job program account updates`);
      };

      // Function to start/restart subscription with retry logic
      const startSubscription = async (): Promise<void> => {
        while (isMonitoring) {
          try {
            this.sdk.logger.info('Attempting to establish WebSocket subscription...');

            abortController = new AbortController();
            const subscriptionIterable = await this.setupSubscription(abortController);

            this.sdk.logger.info('Successfully established WebSocket subscription');

            // Start processing subscription notifications
            await this.processSubscriptionNotifications(
              subscriptionIterable,
              { onJobAccount, onMarketAccount, onRunAccount, onError },
              () => isMonitoring
            );

          } catch (error) {
            this.sdk.logger.warn(`WebSocket subscription failed: ${error}`);

            // Clean up current subscription
            if (abortController) {
              abortController.abort();
              abortController = null;
            }

            if (isMonitoring) {
              this.sdk.logger.info('Retrying WebSocket subscription in 5 seconds...');
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          }
        }
      };

      // Start the subscription loop
      startSubscription().catch(error => {
        this.sdk.logger.error(`Failed to start subscription loop: ${error}`);
      });

      this.sdk.logger.info(`Successfully started monitoring job program account updates`);

      return stopMonitoring;

    } catch (error) {
      this.sdk.logger.error(`Failed to start monitoring job program accounts: ${error}`);
      throw new NosanaError(
        'Failed to start monitoring job program accounts',
        ErrorCodes.RPC_ERROR,
        error
      );
    }
  }

  /**
   * Set up WebSocket subscription for program notifications
   */
  private async setupSubscription(
    abortController: AbortController
  ): Promise<AsyncIterable<any>> {
    try {
      // Set up the subscription using the correct API pattern
      const subscriptionIterable = await this.sdk.solana.rpcSubscriptions
        .programNotifications(this.getProgramId(), { encoding: 'base64' })
        .subscribe({ abortSignal: abortController.signal });

      return subscriptionIterable;
    } catch (error) {
      throw new Error(`Failed to setup subscription: ${error}`);
    }
  }

  /**
   * Process subscription notifications
   */
  private async processSubscriptionNotifications(
    notificationIterable: AsyncIterable<any>,
    options: {
      onJobAccount?: (jobAccount: Account<Job>) => Promise<void> | void;
      onMarketAccount?: (marketAccount: Account<Market>) => Promise<void> | void;
      onRunAccount?: (runAccount: Account<Run>) => Promise<void> | void;
      onError?: (error: Error, accountType?: string) => Promise<void> | void;
    },
    isMonitoring: () => boolean
  ): Promise<void> {
    try {
      for await (const notification of notificationIterable) {
        // Check if monitoring should continue
        if (!isMonitoring()) {
          this.sdk.logger.info('Monitoring stopped, exiting subscription processing');
          break;
        }

        try {
          const { value } = notification;
          await this.handleAccountUpdate(value, options, isMonitoring);
        } catch (error) {
          this.sdk.logger.error(`Error handling account update notification: ${error}`);
          if (options.onError) {
            try {
              await options.onError(error instanceof Error ? error : new Error(String(error)));
            } catch (callbackError) {
              this.sdk.logger.error(`Error in onError callback: ${callbackError}`);
            }
          }
        }
      }
    } catch (error) {
      this.sdk.logger.error(`Subscription error: ${error}`);
      // Throw the error so the calling function can restart the subscription
      throw error;
    }
  }


  private transformJobAccount(jobAccount: programClient.JobAccount): Job {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars 
    const { discriminator: _, ...jobAccountData } = jobAccount;

    return {
      ...convertBigIntToNumber(jobAccountData),
      ipfsJob: IPFS.solHashToIpfsHash(jobAccountData.ipfsJob),
      ipfsResult: IPFS.solHashToIpfsHash(jobAccountData.ipfsResult),
    }
  }
  private transformRunAccount(runAccount: programClient.RunAccount): Run {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars 
    const { discriminator: _, ...runAccountData } = runAccount;

    return {
      ...convertBigIntToNumber(runAccountData),
    }
  }
  private transformMarketAccount(marketAccount: programClient.MarketAccount): Market {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars 
    const { discriminator: _, ...marketAccountData } = marketAccount;

    return {
      ...convertBigIntToNumber(marketAccountData),
    }
  }
  /**
   * Handle account update using callback functions
   */
  private async handleAccountUpdate(
    accountData: any,
    options: {
      onJobAccount?: (jobAccount: Account<Job>) => Promise<void> | void;
      onMarketAccount?: (marketAccount: Account<Market>) => Promise<void> | void;
      onRunAccount?: (runAccount: Account<Run>) => Promise<void> | void;
      onError?: (error: Error, accountType?: string) => Promise<void> | void;
    },
    isMonitoring: () => boolean
  ): Promise<void> {
    try {
      const { account, pubkey } = accountData;
      const encodedAccount: EncodedAccount = parseBase64RpcAccount(pubkey, account);
      const accountType = programClient.identifyNosanaJobsAccount(encodedAccount);
      switch (accountType) {
        case programClient.NosanaJobsAccount.JobAccount:
          const jobAccount = programClient.decodeJobAccount(encodedAccount);
          await this.handleJobAccount(jobAccount, options.onJobAccount, isMonitoring);
          break;
        case programClient.NosanaJobsAccount.MarketAccount:
          const marketAccount = programClient.decodeMarketAccount(encodedAccount);
          await this.handleMarketAccount(marketAccount, options.onMarketAccount, isMonitoring);
          break;
        case programClient.NosanaJobsAccount.RunAccount:
          const runAccount = programClient.decodeRunAccount(encodedAccount);
          await this.handleRunAccount(runAccount, options.onRunAccount, isMonitoring);
          break;
        default:
          this.sdk.logger.error(`No support yet for account type: ${accountType}`);
          return;
      }
    } catch (error) {
      this.sdk.logger.error(`Error in handleAccountUpdate: ${error}`);
    }
  }

  private async handleJobAccount(jobAccount: Account<programClient.JobAccount>, onJobAccount?: (jobAccount: Account<Job>) => Promise<void> | void, _isMonitoring?: () => boolean): Promise<void> {
    if (onJobAccount) {
      try {
        await onJobAccount({ ...jobAccount, data: this.transformJobAccount(jobAccount.data) });
      } catch (error) {
        this.sdk.logger.error(`Error in onJobAccount callback: ${error}`);
        throw error;
      }
    }
    this.sdk.logger.debug(`Processed job account ${jobAccount.address.toString()}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async handleMarketAccount(marketAccount: Account<programClient.MarketAccount>, onMarketAccount?: (marketAccount: Account<Market>) => Promise<void> | void, _isMonitoring?: () => boolean): Promise<void> {
    if (onMarketAccount) {
      try {
        await onMarketAccount({ ...marketAccount, data: this.transformMarketAccount(marketAccount.data) });
      } catch (error) {
        this.sdk.logger.error(`Error in onMarketAccount callback: ${error}`);
        throw error;
      }
    }
    this.sdk.logger.debug(`Processed market account ${marketAccount.address.toString()}`);
  }
  private async handleRunAccount(runAccount: Account<programClient.RunAccount>, onRunAccount?: (runAccount: Account<Run>) => Promise<void> | void, _isMonitoring?: () => boolean): Promise<void> {
    if (onRunAccount) {
      try {
        await onRunAccount({ ...runAccount, data: this.transformRunAccount(runAccount.data) });

      } catch (error) {
        this.sdk.logger.error(`Error in onRunAccount callback: ${error}`);
        throw error;
      }
    }
    this.sdk.logger.debug(`Processed run account ${runAccount.address.toString()}`);
  }

  // Add more methods as needed based on the Jobs program's functionality
} 
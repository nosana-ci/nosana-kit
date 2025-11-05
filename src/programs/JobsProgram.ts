import { BaseProgram } from './BaseProgram.js';
import {
  Address,
  generateKeyPairSigner,
  EncodedAccount,
  parseBase64RpcAccount,
  Account,
  Base58EncodedBytes,
  GetProgramAccountsMemcmpFilter,
} from 'gill';
import { ErrorCodes, NosanaClient, NosanaError } from '../index.js';
import * as programClient from '../generated_clients/jobs/index.js';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import bs58 from 'bs58';
import { IPFS } from '../ipfs/IPFS.js';
import { convertBigIntToNumber, ConvertTypesForDb } from '../utils/index.js';

export enum JobState {
  QUEUED = 0,
  RUNNING = 1,
  COMPLETED = 2,
  STOPPED = 3,
}

export enum MarketQueueType {
  JOB_QUEUE = 0,
  NODE_QUEUE = 1,
}
export type Job = Omit<ConvertTypesForDb<programClient.JobAccountArgs>, 'state'> & {
  address: Address;
  state: JobState;
};
export type Market = Omit<ConvertTypesForDb<programClient.MarketAccountArgs>, 'queueType'> & {
  address: Address;
  queueType: MarketQueueType;
};
export type Run = ConvertTypesForDb<programClient.RunAccountArgs> & { address: Address };

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
  async get(addr: Address, checkRun: boolean = true): Promise<Job> {
    try {
      const jobAccount = await this.client.fetchJobAccount(this.sdk.solana.rpc, addr);
      const job = this.transformJobAccount(jobAccount);
      if (checkRun && job.state === JobState.QUEUED) {
        // If job is queued, check if there is a run account for the job
        const runs = await this.runs({ job: job.address });
        if (runs.length > 0) {
          const run = runs[0];
          job.state = JobState.RUNNING;
          job.timeStart = run.time;
          job.node = run.node;
        }
      }
      return job;
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch job ${err}`);
      throw err;
    }
  }

  /**
   * Fetch a run account by address
   */
  async run(addr: Address): Promise<Run> {
    try {
      const runAccount = await this.client.fetchRunAccount(this.sdk.solana.rpc, addr);
      const run = this.transformRunAccount(runAccount);
      return run;
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch run ${err}`);
      throw err;
    }
  }

  /**
   * Fetch a run account by address
   */
  async market(addr: Address): Promise<Market> {
    try {
      const marketAccount = await this.client.fetchMarketAccount(this.sdk.solana.rpc, addr);
      const market = this.transformMarketAccount(marketAccount);
      return market;
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch market ${err}`);
      throw err;
    }
  }

  /**
   * Fetch multiple job accounts by address
   */
  async multiple(addresses: Address[], checkRuns: boolean = false): Promise<Job[]> {
    try {
      const jobAccounts = await this.client.fetchAllJobAccount(this.sdk.solana.rpc, addresses);
      const jobs = jobAccounts.map((jobAccount) => this.transformJobAccount(jobAccount));
      if (checkRuns) {
        const runs = await this.runs();
        jobs.forEach((job) => {
          if (job.state === JobState.QUEUED) {
            const run = runs.find((run) => run.job === job.address);
            if (run) {
              job.state = JobState.RUNNING;
              job.timeStart = run.time;
              job.node = run.node;
            }
          }
        });
      }
      return jobs;
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch job ${err}`);
      throw err;
    }
  }

  /**
   * Fetch all job accounts
   */
  async all(
    filters?: {
      state?: JobState;
      market?: Address;
      node?: Address;
      project?: Address;
    },
    checkRuns: boolean = false
  ): Promise<Job[]> {
    try {
      const extraGPAFilters: GetProgramAccountsMemcmpFilter[] = [];
      if (filters) {
        if (typeof filters.state === 'number') {
          extraGPAFilters.push({
            memcmp: {
              offset: BigInt(208),
              bytes: bs58.encode(Buffer.from([filters.state])) as Base58EncodedBytes,
              encoding: 'base58',
            },
          });
        }
        if (filters.project) {
          extraGPAFilters.push({
            memcmp: {
              offset: BigInt(176),
              bytes: filters.project.toString() as Base58EncodedBytes,
              encoding: 'base58',
            },
          });
        }
        if (filters.node) {
          extraGPAFilters.push({
            memcmp: {
              offset: BigInt(104),
              bytes: filters.node.toString() as Base58EncodedBytes,
              encoding: 'base58',
            },
          });
        }
        if (filters.market) {
          extraGPAFilters.push({
            memcmp: {
              offset: BigInt(72),
              bytes: filters.market.toString() as Base58EncodedBytes,
              encoding: 'base58',
            },
          });
        }
      }
      const getProgramAccountsResponse = await this.sdk.solana.rpc
        .getProgramAccounts(this.getProgramId(), {
          encoding: 'base64',
          filters: [
            {
              memcmp: {
                offset: BigInt(0),
                bytes: bs58.encode(
                  Buffer.from(programClient.JOB_ACCOUNT_DISCRIMINATOR)
                ) as Base58EncodedBytes,
                encoding: 'base58',
              },
            },
            ...extraGPAFilters,
          ],
        })
        .send();

      const jobs: Job[] = getProgramAccountsResponse
        .map((result: (typeof getProgramAccountsResponse)[0]) => {
          try {
            const jobAccount = programClient.decodeJobAccount(
              parseBase64RpcAccount(result.pubkey, result.account)
            );
            return this.transformJobAccount(jobAccount);
          } catch (err) {
            this.sdk.logger.error(`Failed to decode job ${err}`);
            return null;
          }
        })
        .filter((account: Job | null): account is Job => account !== null);
      if (checkRuns) {
        const runs = await this.runs();
        jobs.forEach((job) => {
          if (job.state === JobState.QUEUED) {
            const run = runs.find((run) => run.job === job.address);
            if (run) {
              job.state = JobState.RUNNING;
              job.timeStart = run.time;
              job.node = run.node;
            }
          }
        });
      }
      return jobs;
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch all jobs ${err}`);
      throw err;
    }
  }
  /**
   * Fetch all run accounts
   */
  async runs(filters?: { node?: Address; job?: Address }): Promise<Run[]> {
    try {
      const extraGPAFilters: GetProgramAccountsMemcmpFilter[] = [];
      if (filters) {
        if (filters.node) {
          extraGPAFilters.push({
            memcmp: {
              offset: BigInt(40),
              bytes: filters.node.toString() as Base58EncodedBytes,
              encoding: 'base58',
            },
          });
        }
        if (filters.job) {
          extraGPAFilters.push({
            memcmp: {
              offset: BigInt(8),
              bytes: filters.job.toString() as Base58EncodedBytes,
              encoding: 'base58',
            },
          });
        }
      }
      const getProgramAccountsResponse = await this.sdk.solana.rpc
        .getProgramAccounts(this.getProgramId(), {
          encoding: 'base64',
          filters: [
            {
              memcmp: {
                offset: BigInt(0),
                bytes: bs58.encode(
                  Buffer.from(programClient.RUN_ACCOUNT_DISCRIMINATOR)
                ) as Base58EncodedBytes,
                encoding: 'base58',
              },
            },
          ],
        })
        .send();

      const runAccounts: Run[] = getProgramAccountsResponse
        .map((result: (typeof getProgramAccountsResponse)[0]) => {
          try {
            const runAccount = programClient.decodeRunAccount(
              parseBase64RpcAccount(result.pubkey, result.account)
            );
            return this.transformRunAccount(runAccount);
          } catch (err) {
            this.sdk.logger.error(`Failed to decode run ${err}`);
            return null;
          }
        })
        .filter((account: Run | null): account is Run => account !== null);
      return runAccounts;
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch all runs ${err}`);
      throw err;
    }
  }

  /**
   * Fetch all market accounts
   */
  async markets(): Promise<Market[]> {
    try {
      const getProgramAccountsResponse = await this.sdk.solana.rpc
        .getProgramAccounts(this.getProgramId(), {
          encoding: 'base64',
          filters: [
            {
              memcmp: {
                offset: BigInt(0),
                bytes: bs58.encode(
                  Buffer.from(programClient.MARKET_ACCOUNT_DISCRIMINATOR)
                ) as Base58EncodedBytes,
                encoding: 'base58',
              },
            },
          ],
        })
        .send();

      const marketAccounts: Market[] = getProgramAccountsResponse
        .map((result: (typeof getProgramAccountsResponse)[0]) => {
          try {
            const marketAccount = programClient.decodeMarketAccount(
              parseBase64RpcAccount(result.pubkey, result.account)
            );
            return this.transformMarketAccount(marketAccount);
          } catch (err) {
            this.sdk.logger.error(`Failed to decode market ${err}`);
            return null;
          }
        })
        .filter((account: Market | null): account is Market => account !== null);
      return marketAccounts;
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch all markets ${err}`);
      throw err;
    }
  }

  /**
   * Post a new job to the marketplace
   * @param params Parameters for listing a job
   * @returns The transaction signature
   */
  async post(params: {
    market: Address;
    timeout: number | bigint;
    ipfsHash: string;
    node?: Address;
  }): Promise<ReturnType<typeof this.client.getListInstruction>> {
    const jobKey = await generateKeyPairSigner();
    const runKey = await generateKeyPairSigner();

    const [associatedTokenAddress] = await findAssociatedTokenPda({
      mint: this.sdk.config.programs.nosTokenAddress,
      owner: this.sdk.wallet!.address,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
    try {
      const staticAccounts = await this.getStaticAccounts();
      // Create the list instruction
      const instruction = this.client.getListInstruction({
        job: jobKey,
        market: params.market,
        run: runKey,
        user: associatedTokenAddress,
        vault: await this.sdk.solana.pda(
          [params.market, this.sdk.config.programs.nosTokenAddress],
          staticAccounts.jobsProgram
        ),
        payer: this.sdk.wallet!,
        rewardsReflection: staticAccounts.rewardsReflection,
        rewardsVault: staticAccounts.rewardsVault,
        authority: this.sdk.wallet!,
        rewardsProgram: staticAccounts.rewardsProgram,
        ipfsJob: bs58.decode(params.ipfsHash).subarray(2),
        timeout: params.timeout,
      });
      return instruction;
    } catch (err) {
      const errorMessage = `Failed to create list instruction: ${err instanceof Error ? err.message : String(err)}`;
      this.sdk.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Monitor program account updates using callback functions
   * Uses WebSocket subscriptions with automatic restart on failure
   *
   * @example
   * ```typescript
   * // Example: Monitor job accounts and save to file
   * const stopMonitoring = await jobsProgram.monitor({
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
  async monitor(
    options: {
      onJobAccount?: (jobAccount: Job) => Promise<void> | void;
      onMarketAccount?: (marketAccount: Market) => Promise<void> | void;
      onRunAccount?: (runAccount: Run) => Promise<void> | void;
      onError?: (error: Error, accountType?: string) => Promise<void> | void;
    } = {}
  ): Promise<() => void> {
    const { onJobAccount, onMarketAccount, onRunAccount, onError } = options;

    const programId = this.getProgramId();

    try {
      this.sdk.logger.info(
        `Starting to monitor job program account updates for program: ${programId}`
      );

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
              await new Promise((resolve) => setTimeout(resolve, 5000));
            }
          }
        }
      };

      // Start the subscription loop
      startSubscription().catch((error) => {
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
  ): Promise<AsyncIterable<unknown>> {
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
    notificationIterable: AsyncIterable<unknown>,
    options: {
      onJobAccount?: (jobAccount: Job) => Promise<void> | void;
      onMarketAccount?: (marketAccount: Market) => Promise<void> | void;
      onRunAccount?: (runAccount: Run) => Promise<void> | void;
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
          const { value } = notification as {
            value: {
              account: unknown;
              pubkey: Address;
            };
          };
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

  public transformJobAccount(jobAccount: Account<programClient.JobAccount>): Job {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { discriminator: _, ...jobAccountData } = jobAccount.data;

    const converted = convertBigIntToNumber(jobAccountData);
    return {
      address: jobAccount.address,
      ...converted,
      ipfsJob: IPFS.solHashToIpfsHash(jobAccountData.ipfsJob),
      ipfsResult: IPFS.solHashToIpfsHash(jobAccountData.ipfsResult),
      state: converted.state as JobState,
    };
  }
  public transformRunAccount(runAccount: Account<programClient.RunAccount>): Run {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { discriminator: _, ...runAccountData } = runAccount.data;

    return {
      address: runAccount.address,
      ...convertBigIntToNumber(runAccountData),
    };
  }
  public transformMarketAccount(marketAccount: Account<programClient.MarketAccount>): Market {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { discriminator: _, ...marketAccountData } = marketAccount.data;

    const converted = convertBigIntToNumber(marketAccountData);
    return {
      address: marketAccount.address,
      ...converted,
      queueType: converted.queueType as MarketQueueType,
    };
  }

  /**
   * Handle account update using callback functions
   */
  private async handleAccountUpdate(
    accountData: {
      account: unknown;
      pubkey: Address;
    },
    options: {
      onJobAccount?: (jobAccount: Job) => Promise<void> | void;
      onMarketAccount?: (marketAccount: Market) => Promise<void> | void;
      onRunAccount?: (runAccount: Run) => Promise<void> | void;
      onError?: (error: Error, accountType?: string) => Promise<void> | void;
    },
    isMonitoring: () => boolean
  ): Promise<void> {
    try {
      const { account, pubkey } = accountData;
      const encodedAccount: EncodedAccount = parseBase64RpcAccount(pubkey, account as never);
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

  private async handleJobAccount(
    jobAccount: Account<programClient.JobAccount>,
    onJobAccount?: (jobAccount: Job) => Promise<void> | void,
    _isMonitoring?: () => boolean
  ): Promise<void> {
    if (onJobAccount) {
      try {
        await onJobAccount(this.transformJobAccount(jobAccount));
      } catch (error) {
        this.sdk.logger.error(`Error in onJobAccount callback: ${error}`);
        throw error;
      }
    }
    this.sdk.logger.debug(`Processed job account ${jobAccount.address.toString()}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async handleMarketAccount(
    marketAccount: Account<programClient.MarketAccount>,
    onMarketAccount?: (marketAccount: Market) => Promise<void> | void,
    _isMonitoring?: () => boolean
  ): Promise<void> {
    if (onMarketAccount) {
      try {
        await onMarketAccount(this.transformMarketAccount(marketAccount));
      } catch (error) {
        this.sdk.logger.error(`Error in onMarketAccount callback: ${error}`);
        throw error;
      }
    }
    this.sdk.logger.debug(`Processed market account ${marketAccount.address.toString()}`);
  }
  private async handleRunAccount(
    runAccount: Account<programClient.RunAccount>,
    onRunAccount?: (runAccount: Run) => Promise<void> | void,
    _isMonitoring?: () => boolean
  ): Promise<void> {
    if (onRunAccount) {
      try {
        await onRunAccount(this.transformRunAccount(runAccount));
      } catch (error) {
        this.sdk.logger.error(`Error in onRunAccount callback: ${error}`);
        throw error;
      }
    }
    this.sdk.logger.debug(`Processed run account ${runAccount.address.toString()}`);
  }

  // Add more methods as needed based on the Jobs program's functionality
}

import { BaseProgram } from './BaseProgram.js';
import { Address, address as toAddress, createTransaction, signTransactionMessageWithSigners, getExplorerLink, getSignatureFromTransaction, generateKeyPairSigner, Signature, EncodedAccount, parseBase64RpcAccount, Account } from 'gill';
import { ErrorCodes, NosanaClient, NosanaError } from '../index.js';
import * as programClient from "../generated_clients/jobs/index.js";
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import bs58 from 'bs58';
import { promises as fs } from 'fs';
import { IPFS } from '../ipfs/IPFS.js';
import { convertBigIntToNumber, ConvertTypesForDb } from '../utils/index.js';

export type JobDb = ConvertTypesForDb<programClient.JobAccountArgs>;


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
  async get(addressStr: string | Address) {
    try {
      const addr = toAddress(addressStr);
      return await this.client.fetchJobAccount(this.sdk.solana.rpc, addr);
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch job ${err}`);
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
 * Monitor program account updates and store them in a JSON file
 * Uses WebSocket subscriptions with polling fallback for maximum reliability
 * @param options Configuration options for monitoring
 * @returns A function to stop monitoring
 */
  async monitorAccountUpdates(options: {
    outputFile?: string;
    useSubscriptions?: boolean;
  } = {}): Promise<() => void> {
    const {
      outputFile = 'job_accounts.json',
      useSubscriptions = true, // Try subscriptions first
    } = options;

    const programId = this.getProgramId();

    try {
      // Load existing accounts from file if it exists
      const existingAccounts = await this.loadAccountsFromFile(outputFile);

      this.sdk.logger.info(`Starting to monitor job program account updates for program: ${programId}`);

      let currentMethod: 'subscription' | 'polling' | null = null;
      let abortController: AbortController | null = null;

      // Function to stop all monitoring
      const stopMonitoring = () => {
        if (abortController) {
          abortController.abort();
        }
        this.sdk.logger.info(`Stopped monitoring job program account updates (was using: ${currentMethod})`);
      };

      // Try WebSocket subscription first
      if (useSubscriptions) {
        try {
          this.sdk.logger.info('Attempting to establish WebSocket subscription...');

          abortController = new AbortController();
          const subscriptionIterable = await this.setupSubscription(abortController);

          currentMethod = 'subscription';
          this.sdk.logger.info('Successfully established WebSocket subscription');

          // Start processing subscription notifications
          this.processSubscriptionNotifications(subscriptionIterable, outputFile, existingAccounts);

        } catch (error) {
          this.sdk.logger.warn(`Failed to establish WebSocket subscription: ${error}`);
          this.sdk.logger.info('Falling back to polling method...');
          abortController = null;
        }
      }

      this.sdk.logger.info(`Successfully started monitoring job program account updates using ${currentMethod}`);

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
    outputFile: string,
    existingAccounts: Map<string, any>,
  ): Promise<void> {
    try {
      for await (const notification of notificationIterable) {
        try {
          const { value } = notification;
          await this.handleAccountUpdate(value, outputFile, existingAccounts);
        } catch (error) {
          this.sdk.logger.error(`Error handling subscription notification: ${error}`);
        }
      }
    } catch (error) {
      this.sdk.logger.error(`Subscription error: ${error}`);

    }
  }


  private transformJobAccount(jobAccount: programClient.JobAccount): JobDb {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars 
    const { discriminator: _, ...jobAccountData } = jobAccount;

    return {
      ...convertBigIntToNumber(jobAccountData),
      ipfsJob: IPFS.solHashToIpfsHash(jobAccountData.ipfsJob),
      ipfsResult: IPFS.solHashToIpfsHash(jobAccountData.ipfsResult),
    }

  }
  /**
   * Handle account update and store/update in JSON file
   */
  private async handleAccountUpdate(
    accountData: any,
    outputFile: string,
    existingAccounts: Map<string, any>
  ): Promise<void> {
    try {
      const { account, pubkey } = accountData;
      const encodedAccount: EncodedAccount = parseBase64RpcAccount(pubkey, account);
      const discriminator = (new Uint8Array(Buffer.from(account.data[0], 'base64').subarray(0, 8))).toString();
      switch (discriminator) {
        case programClient.JOB_ACCOUNT_DISCRIMINATOR.toString():
          await this.handleJobAccount(encodedAccount, outputFile, existingAccounts);
          break;
        case programClient.MARKET_ACCOUNT_DISCRIMINATOR.toString():
          await this.handleMarketAccount(encodedAccount);
          break;
        case programClient.RUN_ACCOUNT_DISCRIMINATOR.toString():
          await this.handleRunAccount(encodedAccount, outputFile, existingAccounts);
          break;
        default:
          this.sdk.logger.error(`Unknown account discriminator: ${discriminator}`);
          return;
      }
    } catch (error) {
      this.sdk.logger.error(`Error in handleAccountUpdate: ${error}`);
    }
  }

  private async handleJobAccount(maybeEncodedAccount: EncodedAccount | Account<programClient.JobAccount>, outputFile: string, existingAccounts: Map<string, JobDb>): Promise<void> {
    let jobAccount: Account<programClient.JobAccount>;
    if (maybeEncodedAccount.data instanceof Uint8Array) {
      jobAccount = programClient.decodeJobAccount(maybeEncodedAccount as EncodedAccount);
    } else {
      jobAccount = maybeEncodedAccount as Account<programClient.JobAccount>;
    }
    existingAccounts.set(jobAccount.address.toString(), this.transformJobAccount(jobAccount.data));
    await this.saveAccountsToFile(outputFile, existingAccounts);
    this.sdk.logger.debug(`Updated job account ${jobAccount.address.toString()} in ${outputFile}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async handleMarketAccount(maybeEncodedAccount: EncodedAccount | Account<programClient.MarketAccount>): Promise<void> {
    this.sdk.logger.debug(`Market account ${maybeEncodedAccount.address.toString()} update skipped (not implemented yet)`);
  }
  private async handleRunAccount(maybeEncodedAccount: EncodedAccount | Account<programClient.RunAccount>, outputFile: string, existingAccounts: Map<string, JobDb>): Promise<void> {
    let runAccount: Account<programClient.RunAccount>;
    if (maybeEncodedAccount.data instanceof Uint8Array) {
      runAccount = programClient.decodeRunAccount(maybeEncodedAccount as EncodedAccount);
    } else {
      runAccount = maybeEncodedAccount as Account<programClient.RunAccount>;
    }
    const jobDb = existingAccounts.get(runAccount.data.job.toString());
    if (!jobDb) {
      const jobAccount = await this.get(runAccount.data.job.toString());
      if (jobAccount) {
        existingAccounts.set(runAccount.data.job.toString(), this.transformJobAccount(jobAccount.data));
      }
    }
    await this.saveAccountsToFile(outputFile, existingAccounts);
    this.sdk.logger.debug(`Updated run account ${runAccount.address.toString()} - associated job: ${runAccount.data.job.toString()}`);
  }

  /**
   * Load existing accounts from JSON file
   */
  private async loadAccountsFromFile(outputFile: string): Promise<Map<string, any>> {
    const accounts = new Map<string, any>();

    try {
      const data = await fs.readFile(outputFile, 'utf-8');
      const accountsArray = JSON.parse(data);

      for (const [key, account] of accountsArray) {
        accounts.set(key, account);
      }

      this.sdk.logger.info(`Loaded ${accountsArray.length} existing job accounts from ${outputFile}`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.sdk.logger.info(`File ${outputFile} does not exist, starting with empty accounts`);
      } else {
        this.sdk.logger.warn(`Failed to load accounts from file: ${error}`);
      }
    }

    return accounts;
  }

  /**
   * Save accounts to JSON file
   */
  private async saveAccountsToFile(outputFile: string, accounts: Map<string, any>): Promise<void> {
    try {
      const jsonData = JSON.stringify(Object.fromEntries(accounts), null, 2);
      await fs.writeFile(outputFile, jsonData, 'utf-8');
    } catch (error) {
      this.sdk.logger.error(`Failed to save job accounts to file: ${error}`);
      throw new NosanaError(
        'Failed to save job accounts to file',
        ErrorCodes.FILE_ERROR,
        error
      );
    }
  }

  // Add more methods as needed based on the Jobs program's functionality
} 
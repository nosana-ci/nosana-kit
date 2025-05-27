import { BaseProgram } from './BaseProgram.js';
import { Address, address as toAddress, createTransaction, signTransactionMessageWithSigners, getExplorerLink, getSignatureFromTransaction, generateKeyPairSigner, getProgramDerivedAddress, getAddressEncoder, Signature } from 'gill';
import { ErrorCodes, NosanaClient, NosanaError } from '../index.js';
import * as programClient from "../generated_clients/jobs/index.js";
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import bs58 from 'bs58';

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

  // Add more methods as needed based on the Jobs program's functionality
} 
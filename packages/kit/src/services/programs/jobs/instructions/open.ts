import { type Address, type TransactionSigner, generateKeyPairSigner } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import type { getOpenInstruction } from '@nosana/jobs-program';
import type { InstructionsHelperParams } from './types.js';

export type OpenParams = {
  nodeAccessKey?: Address;
  jobExpiration?: number | bigint;
  jobType?: number;
  jobPrice?: number | bigint;
  jobTimeout?: number | bigint;
  nodeStakeMinimum?: number | bigint;
  payer?: TransactionSigner;
};

export type OpenInstruction = ReturnType<typeof getOpenInstruction>;

export type Open = (params?: OpenParams) => Promise<OpenInstruction>;

export async function open(
  {
    nodeAccessKey,
    jobExpiration,
    jobType,
    jobPrice,
    jobTimeout,
    nodeStakeMinimum,
    payer,
  }: OpenParams = {},
  { config, deps, client, getRequiredWallet, getStaticAccounts }: InstructionsHelperParams
): Promise<OpenInstruction> {
  try {
    const wallet = getRequiredWallet();
    // Use provided payer or fall back to wallet
    const nosPayer = payer ?? wallet;

    // Generate new keypair for market and get jobs program address
    const [marketKeypair, { jobsProgram }] = await Promise.all([
      generateKeyPairSigner(),
      getStaticAccounts(),
    ]);

    // Derive vault PDA: [market, mint]
    const vault = await deps.solana.pda(
      [marketKeypair.address, config.nosTokenAddress],
      jobsProgram
    );

    // Use default access key if not provided (system program)
    const accessKey = nodeAccessKey ?? SYSTEM_PROGRAM_ADDRESS;

    // Create the open instruction
    return client.getOpenInstruction(
      {
        mint: config.nosTokenAddress,
        market: marketKeypair,
        vault: vault,
        authority: nosPayer,
        accessKey: accessKey,
        jobExpiration: jobExpiration ?? 86400, // 24 hours in seconds
        jobPrice: jobPrice ?? 0,
        jobTimeout: jobTimeout ?? 7200, // 120 minutes in seconds
        jobType: jobType ?? 0,
        nodeXnosMinimum: nodeStakeMinimum ?? 0,
      },
      {
        programAddress: jobsProgram,
      }
    );
  } catch (err) {
    const errorMessage = `Failed to create open instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

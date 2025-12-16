import bs58 from 'bs58';
import { type Address, type TransactionSigner, generateKeyPairSigner } from '@solana/kit';
import type { getListInstruction } from '../../../../generated_clients/jobs/index.js';
import type { InstructionsHelperParams } from './types.js';

export type PostParams = {
  market: Address;
  timeout: number | bigint;
  ipfsHash: string;
  node?: Address;
  payer?: TransactionSigner;
};

export type PostInstruction = ReturnType<typeof getListInstruction>;

export type Post = (params: PostParams) => Promise<PostInstruction>;

export async function post(
  { market, timeout, ipfsHash, payer }: PostParams,
  {
    config,
    deps,
    client,
    getRequiredWallet,
    getStaticAccounts,
    getNosATA,
  }: InstructionsHelperParams
): Promise<PostInstruction> {
  try {
    const wallet = getRequiredWallet();
    // Use provided payer or fall back to wallet
    const nosPayer = payer ?? wallet;

    // Generate new keypairs for job and run
    const [jobKey, runKey, associatedTokenAddress, { jobsProgram, ...staticAccounts }] =
      await Promise.all([
        generateKeyPairSigner(),
        generateKeyPairSigner(),
        getNosATA(nosPayer.address),
        getStaticAccounts(),
      ]);
    const vault = await deps.solana.pda([market, config.nosTokenAddress], jobsProgram);

    // Create the list instruction
    return client.getListInstruction(
      {
        job: jobKey,
        run: runKey,
        market,
        ipfsJob: bs58.decode(ipfsHash).subarray(2),
        timeout,
        user: associatedTokenAddress,
        vault: vault,
        payer: nosPayer,
        authority: wallet,
        ...staticAccounts,
      },
      {
        programAddress: jobsProgram,
      }
    );
  } catch (err) {
    const errorMessage = `Failed to create list instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

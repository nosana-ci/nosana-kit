import bs58 from 'bs58';
import { type Address, generateKeyPairSigner } from '@solana/kit';
import type { getListInstruction } from '../../../generated_clients/jobs/index.js';
import type { InstructionsHelperParams } from './types.js';

export type PostParams = {
  market: Address;
  timeout: number | bigint;
  ipfsHash: string;
  node?: Address;
};

export type PostInstruction = ReturnType<typeof getListInstruction>;

export type Post = (params: PostParams) => Promise<PostInstruction>;

export async function post(
  { market, timeout, ipfsHash }: PostParams,
  {
    config,
    deps,
    client,
    getRequiredWallet,
    getStaticAccounts,
    getAssociatedTokenPda,
  }: InstructionsHelperParams
): Promise<PostInstruction> {
  try {
    const wallet = getRequiredWallet();
    // Generate new keypairs for job and run
    const [jobKey, runKey, [associatedTokenAddress], { jobsProgram, ...staticAccounts }] =
      await Promise.all([
        generateKeyPairSigner(),
        generateKeyPairSigner(),
        getAssociatedTokenPda(),
        getStaticAccounts(),
      ]);
    const vault = await deps.solana.pda([market, config.nosTokenAddress], jobsProgram);

    // Create the list instruction
    return client.getListInstruction({
      job: jobKey,
      run: runKey,
      market,
      ipfsJob: bs58.decode(ipfsHash).subarray(2),
      timeout,
      user: associatedTokenAddress,
      vault: vault,
      payer: wallet,
      authority: wallet,
      ...staticAccounts,
    });
  } catch (err) {
    const errorMessage = `Failed to create list instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

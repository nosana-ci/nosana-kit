import type { Address } from '@solana/kit';
import type { getEndInstruction } from '../../../generated_clients/jobs/index.js';
import type { InstructionsHelperParams } from './types.js';
import { getCreateAssociatedTokenIdempotentInstruction, getCreateAssociatedTokenIdempotentInstructionAsync, getCreateAssociatedTokenIdempotentInstructionDataCodec, getCreateAssociatedTokenIdempotentInstructionDataDecoder, getCreateAssociatedTokenIdempotentInstructionDataEncoder } from '@solana-program/token';

export type EndParams = {
  job: Address;
};

export type EndInstruction = ReturnType<typeof getEndInstruction>;

export type End = (params: EndParams) => Promise<EndInstruction>;

export async function end(
  { job }: EndParams,
  {
    config,
    deps,
    client,
    get,
    getRuns,
    getRequiredWallet,
    getStaticAccounts,
    getNosATA,
  }: InstructionsHelperParams
): Promise<EndInstruction> {
  try {
    const wallet = getRequiredWallet();
    // Get Required accounts
    const [jobAccount, [run], { jobsProgram }] = await Promise.all([
      get(job, false),
      getRuns({ job }),
      getStaticAccounts(),
    ]);

    if (!run) {
      throw new Error('No job run account found for the specified job');
    }

    // Get associated token addresses
    const [payerATA, nodeATA] = await Promise.all([
      getNosATA(jobAccount.payer), // ATA for the job's payer (for deposit)
      getNosATA(run.node), // ATA for the node (for user)
    ]);

    const vault = await deps.solana.pda([jobAccount.market, config.nosTokenAddress], jobsProgram);

    return client.getEndInstruction({
      job,
      market: jobAccount.market,
      run: run.address,
      deposit: payerATA, // ATA of the job payer
      user: nodeATA, // ATA of the node (from run account)
      vault: vault,
      payer: jobAccount.payer, // Use payer from the job account
      authority: wallet,
    });
  } catch (err) {
    const errorMessage = `Failed to create end instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

import { ipfsHashToSolBytesArray } from '@nosana/ipfs';
import { type Address, type TransactionSigner, generateKeyPairSigner } from '@solana/kit';
import type { getListInstruction } from '../../../../generated_clients/jobs/index.js';
import type { InstructionsHelperParams } from './types.js';

export type ListParams = {
  market: Address;
  timeout: number | bigint;
  ipfsHash: string;
  payer?: TransactionSigner;
};

export type ListInstruction = ReturnType<typeof getListInstruction>;

export type List = (params: ListParams) => Promise<ListInstruction>;

export async function list(
  { market, timeout, ipfsHash, payer }: ListParams,
  {
    config,
    deps,
    client,
    getRequiredWallet,
    getStaticAccounts,
    getNosATA,
  }: InstructionsHelperParams
): Promise<ListInstruction> {
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

    // Convert IPFS hash to Solana bytes array
    const ipfsJobBytes = ipfsHashToSolBytesArray(ipfsHash);

    // Create the list instruction
    return client.getListInstruction(
      {
        job: jobKey,
        run: runKey,
        market,
        ipfsJob: new Uint8Array(ipfsJobBytes),
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

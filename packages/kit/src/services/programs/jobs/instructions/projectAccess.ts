import type { Address } from '@solana/kit';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import type { ProgramDeps } from '../../../../types.js';
import { findNftMetadataPda } from '../../../solana/nftMetadata.js';
import type { InstructionsHelperParams } from './types.js';

/** Seed prefix of a market's `MarketSettingsAccount` PDA: `["settings", market]` */
export const MARKET_SETTINGS_SEED = 'settings';

/**
 * Derive the `MarketSettingsAccount` PDA of a market. An uninitialised PDA means the
 * market is open to all projects.
 */
export function getMarketSettingsPda(
  deps: ProgramDeps,
  market: Address,
  jobsProgram: Address
): Promise<Address> {
  return deps.solana.pda([MARKET_SETTINGS_SEED, market], jobsProgram);
}

export type ProjectAccessAccounts = {
  marketSettings: Address;
  projectNft?: Address;
  projectMetadata?: Address;
};

/**
 * Resolve the accounts a project needs to post to a market. Every market takes its
 * settings PDA. A protected market also needs proof that the project holds the market's
 * access key: the wallet's token account of an NFT from that collection and its Metaplex
 * metadata, both looked up from the wallet.
 *
 * @throws when the market is protected and the wallet holds no NFT of the access key collection
 */
export async function resolveProjectAccess(
  { deps, client }: Pick<InstructionsHelperParams, 'deps' | 'client'>,
  owner: Address,
  market: Address,
  jobsProgram: Address
): Promise<ProjectAccessAccounts> {
  const marketSettings = await getMarketSettingsPda(deps, market, jobsProgram);
  const settings = await client.fetchMaybeMarketSettingsAccount(deps.solana.rpc, marketSettings);
  if (!settings.exists) {
    return { marketSettings };
  }

  const { projectAccessKey } = settings.data;
  const nft = await deps.solana.getNftFromCollection(owner, projectAccessKey);
  if (!nft) {
    throw new Error(
      `Market ${market} is protected: wallet ${owner} holds no access key NFT of collection ${projectAccessKey}`
    );
  }
  const [[projectNft], projectMetadata] = await Promise.all([
    findAssociatedTokenPda({ mint: nft, owner, tokenProgram: TOKEN_PROGRAM_ADDRESS }),
    findNftMetadataPda(nft),
  ]);
  return { marketSettings, projectNft, projectMetadata };
}

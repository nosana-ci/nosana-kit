import { Address, address, Base58EncodedBytes } from '@solana/kit';
import { NosanaError, ErrorCodes } from '../errors/NosanaError.js';
import { Logger } from '../logger/Logger.js';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';

// Standard SPL token account size
const TOKEN_ACCOUNT_SIZE = 165;

// Offset of mint address in token account data structure
const MINT_OFFSET = 0;

export interface TokenAccount {
  pubkey: Address;
  owner: Address;
  mint: Address;
  amount: bigint;
  decimals: number;
}

export interface TokenAccountWithBalance extends TokenAccount {
  uiAmount: number;
}

/**
 * Dependencies for NosService
 */
export interface NosServiceDeps {
  logger: Logger;
  solanaRpc: ReturnType<typeof import('@solana/kit').createSolanaRpc>;
}

/**
 * Config for NosService
 */
export interface NosServiceConfig {
  nosTokenAddress: Address;
}

/**
 * NosService interface
 */
export interface NosService {
  getAllTokenHolders(options?: {
    includeZeroBalance?: boolean;
    excludePdaAccounts?: boolean;
  }): Promise<TokenAccountWithBalance[]>;
  getTokenAccountForAddress(owner: string | Address): Promise<TokenAccountWithBalance | null>;
  getBalance(owner: string | Address): Promise<number>;
}

/**
 * Creates a NosService instance.
 */
export function createNosService(deps: NosServiceDeps, config: NosServiceConfig): NosService {
  return {
    /**
     * Retrieve all token accounts for all NOS token holders
     * Uses a single RPC call to fetch all accounts holding the NOS token
     *
     * @param options - Optional configuration
     * @param options.includeZeroBalance - Whether to include accounts with zero balance (default: false)
     * @param options.excludePdaAccounts - Whether to exclude PDA (Program Derived Address) accounts owned by smart contracts (default: false)
     * @returns Array of token accounts with their balances
     */
    async getAllTokenHolders(options?: {
      includeZeroBalance?: boolean;
      excludePdaAccounts?: boolean;
    }): Promise<TokenAccountWithBalance[]> {
      try {
        const nosMint = config.nosTokenAddress;
        deps.logger.debug(`Fetching all NOS token holders for mint: ${nosMint}`);

        // Use getProgramAccounts to fetch all token accounts for the NOS mint
        const accounts = await deps.solanaRpc
          .getProgramAccounts(TOKEN_PROGRAM_ADDRESS, {
            encoding: 'jsonParsed',
            filters: [
              {
                dataSize: BigInt(TOKEN_ACCOUNT_SIZE),
              },
              {
                memcmp: {
                  offset: BigInt(MINT_OFFSET),
                  bytes: nosMint.toString() as Base58EncodedBytes,
                  encoding: 'base58' as const,
                },
              },
            ],
          })
          .send();

        deps.logger.info(`Found ${accounts.length} NOS token accounts`);

        // Parse the response
        const allAccounts = (
          accounts as Array<{
            account: { data: { parsed: { info: Record<string, unknown> } } };
            pubkey: Address;
          }>
        ).map((accountInfo) => {
          const parsed = accountInfo.account.data.parsed.info as {
            owner: Address;
            mint: Address;
            tokenAmount: { amount: string; decimals: number; uiAmount: number | null };
          };
          return {
            pubkey: accountInfo.pubkey,
            owner: parsed.owner,
            mint: parsed.mint,
            amount: BigInt(parsed.tokenAmount.amount),
            decimals: parsed.tokenAmount.decimals,
            uiAmount: parsed.tokenAmount.uiAmount ?? 0,
          };
        });

        // Apply filters
        const includeZeroBalance = options?.includeZeroBalance ?? false;
        const excludePdaAccounts = options?.excludePdaAccounts ?? false;

        let filteredAccounts = allAccounts;

        // Filter out zero balance accounts unless explicitly included
        if (!includeZeroBalance) {
          filteredAccounts = filteredAccounts.filter((account) => account.uiAmount > 0);
        }

        // Filter out PDA accounts (where token account equals owner, indicating smart contract ownership)
        if (excludePdaAccounts) {
          const beforePdaFilter = filteredAccounts.length;
          filteredAccounts = filteredAccounts.filter((account) => account.pubkey !== account.owner);
          const pdaCount = beforePdaFilter - filteredAccounts.length;
          deps.logger.debug(`Filtered out ${pdaCount} PDA accounts`);
        }

        const filterInfo = [];
        if (!includeZeroBalance) filterInfo.push('excluding zero balances');
        if (excludePdaAccounts) filterInfo.push('excluding PDA accounts');
        const filterText = filterInfo.length > 0 ? ` (${filterInfo.join(', ')})` : '';

        deps.logger.info(`Returning ${filteredAccounts.length} NOS token holders${filterText}`);

        return filteredAccounts;
      } catch (error) {
        deps.logger.error(`Failed to fetch NOS token holders: ${error}`);
        throw new NosanaError('Failed to fetch NOS token holders', ErrorCodes.RPC_ERROR, error);
      }
    },

    /**
     * Retrieve the NOS token account for a specific owner address
     *
     * @param owner - The owner address to query
     * @returns The token account with balance, or null if no account exists
     */
    async getTokenAccountForAddress(
      owner: string | Address
    ): Promise<TokenAccountWithBalance | null> {
      try {
        const ownerAddr = typeof owner === 'string' ? address(owner) : owner;
        const nosMint = config.nosTokenAddress;

        deps.logger.debug(`Fetching NOS token account for owner: ${ownerAddr}`);

        // Use getTokenAccountsByOwner to fetch token accounts for this owner filtered by NOS mint
        const response = await deps.solanaRpc
          .getTokenAccountsByOwner(ownerAddr, { mint: nosMint }, { encoding: 'jsonParsed' })
          .send();

        if (response.value.length === 0) {
          deps.logger.debug(`No NOS token account found for owner: ${ownerAddr}`);
          return null;
        }

        // Typically there should only be one token account per owner per mint
        const accountInfo = response.value[0];
        const parsed = accountInfo.account.data.parsed.info;

        deps.logger.info(
          `Found NOS token account for owner ${ownerAddr}: balance = ${parsed.tokenAmount.uiAmount}`
        );

        return {
          pubkey: accountInfo.pubkey,
          owner: parsed.owner,
          mint: parsed.mint,
          amount: BigInt(parsed.tokenAmount.amount),
          decimals: parsed.tokenAmount.decimals,
          uiAmount: parsed.tokenAmount.uiAmount ?? 0,
        };
      } catch (error) {
        deps.logger.error(`Failed to fetch NOS token account for owner: ${error}`);
        throw new NosanaError('Failed to fetch NOS token account', ErrorCodes.RPC_ERROR, error);
      }
    },

    /**
     * Get the NOS token balance for a specific owner address
     * Convenience method that returns just the balance
     *
     * @param owner - The owner address to query
     * @returns The token balance as a UI amount (with decimals), or 0 if no account exists
     */
    async getBalance(owner: string | Address): Promise<number> {
      const account = await this.getTokenAccountForAddress(owner);
      return account ? account.uiAmount : 0;
    },
  };
}

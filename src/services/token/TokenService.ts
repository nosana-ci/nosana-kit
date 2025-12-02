import { Address, address, Base58EncodedBytes } from '@solana/kit';
import { NosanaError, ErrorCodes } from '../../errors/NosanaError.js';
import { Logger } from '../../logger/Logger.js';
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

import type { SolanaService } from '../solana/index.js';

/**
 * Dependencies for TokenService
 */
export interface TokenServiceDeps {
  logger: Logger;
  solana: SolanaService;
}

/**
 * Config for TokenService
 */
export interface TokenServiceConfig {
  tokenAddress: Address;
}

/**
 * TokenService interface
 */
export interface TokenService {
  getAllTokenHolders(options?: {
    includeZeroBalance?: boolean;
    excludePdaAccounts?: boolean;
  }): Promise<TokenAccountWithBalance[]>;
  getTokenAccountForAddress(owner: string | Address): Promise<TokenAccountWithBalance | null>;
  getBalance(owner: string | Address): Promise<number>;
}

/**
 * Creates a TokenService instance.
 */
export function createTokenService(
  deps: TokenServiceDeps,
  config: TokenServiceConfig
): TokenService {
  return {
    /**
     * Retrieve all token accounts for all token holders
     * Uses a single RPC call to fetch all accounts holding the token
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
        const tokenMint = config.tokenAddress;
        deps.logger.debug(`Fetching all token holders for mint: ${tokenMint}`);

        // Use getProgramAccounts to fetch all token accounts for the token mint
        const accounts = await deps.solana.rpc
          .getProgramAccounts(TOKEN_PROGRAM_ADDRESS, {
            encoding: 'jsonParsed',
            filters: [
              {
                dataSize: BigInt(TOKEN_ACCOUNT_SIZE),
              },
              {
                memcmp: {
                  offset: BigInt(MINT_OFFSET),
                  bytes: tokenMint.toString() as Base58EncodedBytes,
                  encoding: 'base58' as const,
                },
              },
            ],
          })
          .send();

        deps.logger.info(`Found ${accounts.length} token accounts`);

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

        deps.logger.info(`Returning ${filteredAccounts.length} token holders${filterText}`);

        return filteredAccounts;
      } catch (error) {
        deps.logger.error(`Failed to fetch token holders: ${error}`);
        throw new NosanaError('Failed to fetch token holders', ErrorCodes.RPC_ERROR, error);
      }
    },

    /**
     * Retrieve the token account for a specific owner address
     *
     * @param owner - The owner address to query
     * @returns The token account with balance, or null if no account exists
     */
    async getTokenAccountForAddress(
      owner: string | Address
    ): Promise<TokenAccountWithBalance | null> {
      try {
        const ownerAddr = typeof owner === 'string' ? address(owner) : owner;
        const tokenMint = config.tokenAddress;

        deps.logger.debug(`Fetching token account for owner: ${ownerAddr}`);

        // Use getTokenAccountsByOwner to fetch token accounts for this owner filtered by token mint
        const response = await deps.solana.rpc
          .getTokenAccountsByOwner(ownerAddr, { mint: tokenMint }, { encoding: 'jsonParsed' })
          .send();

        if (response.value.length === 0) {
          deps.logger.debug(`No token account found for owner: ${ownerAddr}`);
          return null;
        }

        // Typically there should only be one token account per owner per mint
        const accountInfo = response.value[0];
        const parsed = accountInfo.account.data.parsed.info;

        deps.logger.info(
          `Found token account for owner ${ownerAddr}: balance = ${parsed.tokenAmount.uiAmount}`
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
        deps.logger.error(`Failed to fetch token account for owner: ${error}`);
        throw new NosanaError('Failed to fetch token account', ErrorCodes.RPC_ERROR, error);
      }
    },

    /**
     * Get the token balance for a specific owner address
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

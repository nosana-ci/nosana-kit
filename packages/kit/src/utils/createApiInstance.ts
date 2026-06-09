import { NosanaAuthorization } from '@nosana/authorization';
import {
  createNosanaApi,
  ExternalSolanaFunctions,
  NosanaApi,
  NosanaApiWithApiKey,
  NosanaNetwork,
  TopupVaultOptions,
} from '@nosana/api';

import { APIConfig } from '../config/types.js';
import { SolanaService } from '../services/solana/SolanaService.js';
import { TokenService } from '../services/token/TokenService.js';

import { Wallet } from '../types.js';
import { isTransactionPartialSigner } from '@solana/kit';

export interface NosanaApiDeps {
  authorization: NosanaAuthorization;
  solana: SolanaService;
  nos: TokenService;
}

const createApiSolanaIntegration = (
  wallet: Wallet,
  { solana, nos }: NosanaApiDeps
): ExternalSolanaFunctions => ({
  getBalance: async (address: string) => {
    const [SOL, NOS] = await Promise.all([
      solana.getBalanceInfo(address),
      nos.getBalanceInfo(address),
    ]);
    return { SOL: SOL.uiAmount, NOS: NOS.uiAmount };
  },
  transferTokensToRecipient: async (
    recipient: string,
    { SOL, NOS, lamports }: TopupVaultOptions
  ) => {
    const instructions = [];

    if (SOL && SOL > 0) {
      instructions.push(
        await solana.transfer({
          to: recipient,
          amount: lamports ? SOL : SOL * 1e9,
        })
      );
    }

    if (NOS && NOS > 0) {
      instructions.push(
        ...(await nos.transfer({
          to: recipient,
          amount: lamports ? NOS : NOS * 1e6,
        }))
      );
    }

    if (instructions.length === 0) {
      throw new Error('At least one of SOL or NOS amount must be greater than zero.');
    }

    await solana.buildSignAndSend(instructions);
  },
  deserializeSignSendAndConfirmTransaction: async (transactionData: string) => {
    if (!isTransactionPartialSigner(wallet)) {
      throw new Error('Wallet is not a transaction partial signer.');
    }
    const deserializedTx = await solana.deserializeTransaction(transactionData);
    const decompileTransaction = await solana.decompileTransaction(deserializedTx);
    if (decompileTransaction.feePayer.address !== wallet.address) {
      throw new Error('Fee payer of the transaction must match the wallet address.');
    }

    const fullySignedTx = await solana.signTransactionWithSigners(deserializedTx, [wallet]);
    return await solana.sendTransaction(fullySignedTx);
  },
});

export function createApiInstance(
  network: NosanaNetwork,
  config: APIConfig | undefined,
  wallet: Wallet,
  deps: NosanaApiDeps
): NosanaApi;
export function createApiInstance(
  network: NosanaNetwork,
  config: APIConfig | undefined,
  wallet: undefined,
  deps: NosanaApiDeps
): NosanaApiWithApiKey;

export function createApiInstance(
  network: NosanaNetwork,
  config: APIConfig | undefined,
  wallet: Wallet | undefined,
  deps: { authorization: NosanaAuthorization; solana: SolanaService; nos: TokenService }
): NosanaApi | NosanaApiWithApiKey {
  const { apiKey, ...apiConfig } = config || {};

  if (apiKey) {
    return createNosanaApi(network, apiKey, apiConfig);
  }

  if (wallet) {
    return createNosanaApi(
      network,
      {
        identifier: wallet.address.toString(),
        generate: deps.authorization.generate,
        solana: createApiSolanaIntegration(wallet, deps),
      },
      apiConfig
    );
  }

  return createNosanaApi(network, undefined, apiConfig);
}

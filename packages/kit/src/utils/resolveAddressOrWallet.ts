import { Address, address } from '@solana/kit';

import { ErrorCodes, NosanaError } from '../errors/NosanaError.js';
import type { Wallet } from '../types.js';

export function resolveAddressOrWallet(params: {
  value?: string | Address;
  getWallet: () => Wallet | undefined;
}): Address {
  if (params.value) {
    return typeof params.value === 'string' ? address(params.value) : params.value;
  }

  const wallet = params.getWallet();
  if (!wallet) {
    throw new NosanaError('No address or wallet provided', ErrorCodes.NO_WALLET);
  }

  return wallet.address;
}

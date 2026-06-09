import { address } from '@solana/kit';
import { describe, expect, it, vi } from 'vitest';

import { ErrorCodes, NosanaError } from '../../../src/errors/NosanaError.js';
import { resolveAddressOrWallet } from '../../../src/utils/resolveAddressOrWallet.js';

describe('resolveAddressOrWallet', () => {
  const providedAddress = address('9aKHLbxLbgKGz9vL3kZKz9XwPnxGKLWxjZHWzLHfbT1J');
  const walletAddress = address('7N4HggYEJAtCLJdnHGCtFqfxcB5rhQCsQTze3ftYstVj');

  it('returns an explicitly provided address', () => {
    const getWallet = vi.fn();

    const result = resolveAddressOrWallet({
      value: providedAddress,
      getWallet,
    });

    expect(result).toBe(providedAddress);
    expect(getWallet).not.toHaveBeenCalled();
  });

  it('converts an explicitly provided address string', () => {
    const result = resolveAddressOrWallet({
      value: providedAddress.toString(),
      getWallet: vi.fn(),
    });

    expect(result).toBe(providedAddress);
  });

  it('falls back to the wallet address', () => {
    const result = resolveAddressOrWallet({
      getWallet: () => ({ address: walletAddress }) as any,
    });

    expect(result).toBe(walletAddress);
  });

  it('throws a NO_WALLET error when no value or wallet is provided', () => {
    expect(() =>
      resolveAddressOrWallet({
        getWallet: () => undefined,
      })
    ).toThrow(NosanaError);

    try {
      resolveAddressOrWallet({
        getWallet: () => undefined,
      });
    } catch (error) {
      expect(error).toMatchObject({
        code: ErrorCodes.NO_WALLET,
        message: 'No address or wallet provided',
      });
    }
  });
});

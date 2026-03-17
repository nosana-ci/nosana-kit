import { Mock } from 'vitest';
import { vi } from 'vitest';
import { vaultTopup } from '../vaultTopup.js';

describe('vaultTopup', () => {
  const mockOptions = global.TEST_ROUTE_OPTIONS_WITH_SIGNER;
  const vaultAddress = global.TEST_MOCK_DEPLOYMENT.vault;
  const topupOptions = { SOL: 0.5, NOS: 10 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when transfer succeeds', () => {
    beforeEach(() => {
      (mockOptions.solana.transferTokensToRecipient as Mock).mockResolvedValue(undefined);
    });

    it('should successfully topup vault', async () => {
      await vaultTopup(vaultAddress, topupOptions, mockOptions);

      expect(mockOptions.solana.transferTokensToRecipient).toHaveBeenCalledWith(
        vaultAddress,
        topupOptions,
      );
    });
  });

  test('when transferTokensToRecipient throws, it should throw formatted error', async () => {
    (mockOptions.solana.transferTokensToRecipient as Mock).mockRejectedValue(new Error('Transaction failed'));

    await expect(
      vaultTopup(vaultAddress, topupOptions, mockOptions),
    ).rejects.toThrow('Failed to top up vault');
  });
});


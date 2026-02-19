import { Mock } from 'vitest';
import { vi } from 'vitest';
import { vaultGetBalance } from '../vaultGetBalance.js';

describe('vaultGetBalance', () => {
  const mockOptions = global.TEST_ROUTE_OPTIONS_WITH_SIGNER;
  const vaultAddress = global.TEST_MOCK_DEPLOYMENT.vault;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when getBalance succeeds', () => {
    const mockBalance = { SOL: 1.5, NOS: 100 };

    beforeEach(() => {
      (mockOptions.solana.getBalance as Mock).mockResolvedValue(mockBalance);
    });

    it('should successfully get vault balance', async () => {
      const result = await vaultGetBalance(vaultAddress, mockOptions);

      expect(result).toEqual(mockBalance);
      expect(mockOptions.solana.getBalance).toHaveBeenCalledWith(vaultAddress);
    });
  });

  test('when getBalance throws, it should throw formatted error', async () => {
    (mockOptions.solana.getBalance as Mock).mockRejectedValue(new Error('Network error'));

    await expect(vaultGetBalance(vaultAddress, mockOptions)).rejects.toThrow(
      'Failed to get vault balance',
    );
  });
});


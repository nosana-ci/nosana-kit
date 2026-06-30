import { Mock } from 'vitest';
import { vi } from 'vitest';
import { vaultWithdraw } from '../vaultWithdraw.js';

describe('vaultWithdraw', () => {
  const mockOptions = global.TEST_DEPLOYMENT_ROUTE_CLIENTS_WITH_SIGNER;
  const vaultAddress = global.TEST_MOCK_DEPLOYMENT.vault;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when data is returned", () => {
    beforeEach(() => {
      (mockOptions.deploymentManager.POST as Mock).mockResolvedValue({
        data: { transaction: global.TEST_MOCK_TRANSACTION_SIGNATURE },
        error: null,
      });
    });

    it('should successfully withdraw from vault', async () => {
      await vaultWithdraw(vaultAddress, mockOptions);

      expect(mockOptions.deploymentManager.POST).toHaveBeenCalledWith(
        '/deployments/vaults/{vault}/withdraw',
        {
          params: {
            path: {
              vault: vaultAddress,
            },
          },
          body: {},
        },
      );
      expect(
        mockOptions.solana.deserializeSignSendAndConfirmTransaction,
      ).toHaveBeenCalledWith(global.TEST_MOCK_TRANSACTION_SIGNATURE);
    });

    test('when transaction fails, it should throw formatted error', async () => {
      (mockOptions.solana.deserializeSignSendAndConfirmTransaction as Mock).mockRejectedValue(new Error('Transaction failed'));

      await expect(vaultWithdraw(vaultAddress, mockOptions)).rejects.toThrow(
        'Vault withdrawal transaction failed.',
      );
    });
  })

  test('when api returns error, it should throw formatted error', async () => {
    (mockOptions.deploymentManager.POST as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(vaultWithdraw(vaultAddress, mockOptions)).rejects.toThrow(
      'Failed to withdraw from vault',
    );
  });

  test('when api returns no data, it should throw formatted error', async () => {
    (mockOptions.deploymentManager.POST as Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(vaultWithdraw(vaultAddress, mockOptions)).rejects.toThrow(
      'Failed to withdraw from vault',
    );
  });
});


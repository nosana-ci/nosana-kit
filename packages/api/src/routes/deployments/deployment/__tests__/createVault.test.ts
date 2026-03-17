import { vi } from 'vitest';
import { createVault } from '../createVault.js';
import * as actions from '../actions/index.js';

vi.mock('../actions/index.js', () => ({
  vaultGetBalance: vi.fn().mockResolvedValue({ SOL: 1.5, NOS: 100 }),
  vaultTopup: vi.fn().mockResolvedValue(undefined),
  vaultWithdraw: vi.fn().mockResolvedValue(undefined),
}));

describe('createVault', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a vault with address and methods', () => {
    const vault = createVault(global.TEST_MOCK_DEPLOYMENT.vault, global.TEST_ROUTE_OPTIONS_WITH_SIGNER);

    expect(vault.address).toBe(global.TEST_MOCK_DEPLOYMENT.vault);
    expect(vault.getBalance).toBeTypeOf('function');
    expect(vault.topup).toBeTypeOf('function');
    expect(vault.withdraw).toBeTypeOf('function');
  });

  test('when provided, it should include created_at', () => {
    const createdDate = new Date('2025-01-01T12:00:00.000Z');
    const vault = createVault(global.TEST_MOCK_DEPLOYMENT.vault, global.TEST_ROUTE_OPTIONS_WITH_SIGNER, createdDate);

    expect(vault.created_at).toBe(createdDate);
  });

  test('when not provided, it should exclude created_at', () => {
    const vault = createVault(global.TEST_MOCK_DEPLOYMENT.vault, global.TEST_ROUTE_OPTIONS_WITH_SIGNER);

    expect(vault.created_at).toBeUndefined();
  });

  describe('vault methods', () => {
    test('when getBalance is invoked, it should call vaultGetBalance', async () => {
      const vault = createVault(global.TEST_MOCK_DEPLOYMENT.vault, global.TEST_ROUTE_OPTIONS_WITH_SIGNER);

      const result = await vault.getBalance();

      expect(actions.vaultGetBalance).toHaveBeenCalledWith(
        global.TEST_MOCK_DEPLOYMENT.vault,
        global.TEST_ROUTE_OPTIONS_WITH_SIGNER,
      );
      expect(result).toEqual({ SOL: 1.5, NOS: 100 });
    });

    test('when topup is invoked, it should call vaultTopup', async () => {
      const vault = createVault(global.TEST_MOCK_DEPLOYMENT.vault, global.TEST_ROUTE_OPTIONS_WITH_SIGNER);
      const topupOptions = { SOL: 0.5, NOS: 10 };

      await vault.topup(topupOptions);

      expect(actions.vaultTopup).toHaveBeenCalledWith(
        global.TEST_MOCK_DEPLOYMENT.vault,
        topupOptions,
        global.TEST_ROUTE_OPTIONS_WITH_SIGNER,
      );
    });

    test('when withdraw is invoked, it should call vaultWithdraw', async () => {
      const vault = createVault(global.TEST_MOCK_DEPLOYMENT.vault, global.TEST_ROUTE_OPTIONS_WITH_SIGNER);

      await vault.withdraw();

      expect(actions.vaultWithdraw).toHaveBeenCalledWith(
        global.TEST_MOCK_DEPLOYMENT.vault,
        global.TEST_ROUTE_OPTIONS_WITH_SIGNER,
      );
    });
  });
});


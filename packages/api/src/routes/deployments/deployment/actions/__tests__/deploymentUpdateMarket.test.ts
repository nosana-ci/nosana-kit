import { Mock } from 'vitest';
import { deploymentUpdateMarket } from '../deploymentUpdateMarket.js';
import type { DeploymentState } from '../../../types.js';

describe('deploymentUpdateMarket', () => {
  const mockClient = global.TEST_MOCK_CLIENT;
  let mockState: DeploymentState;

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      ...global.TEST_MOCK_DEPLOYMENT,
      updated_at: new Date(global.TEST_MOCK_DEPLOYMENT.updated_at),
      created_at: new Date(global.TEST_MOCK_DEPLOYMENT.created_at),
    };
  });

  describe('when data is returned', () => {
    const market = 'rdRYm53F9nj7VWenCvuJw4Zf85KEo5op9kAiQk52kFh';

    beforeEach(() => {
      (mockClient.PATCH as Mock).mockResolvedValue({
        data: { market, updated_at: '2025-01-01T12:00:00.000Z' },
        error: null,
      });
    });

    it('should successfully update the market', async () => {
      await deploymentUpdateMarket(market, mockClient, mockState);

      expect(mockClient.PATCH).toHaveBeenCalledWith(
        '/deployments/{deployment}/update-market',
        {
          params: { path: { deployment: mockState.id } },
          body: { market },
        },
      );
      expect(mockState.market).toBe(market);
      expect(mockState.updated_at).toBeInstanceOf(Date);
      expect(mockState.updated_at.toISOString()).toBe('2025-01-01T12:00:00.000Z');
    });
  });

  test('when api returns error, it should throw formatted error', async () => {
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(
      deploymentUpdateMarket('x', mockClient, mockState),
    ).rejects.toThrow('Error updating deployment market');
  });

  test('when api returns no data, it should throw formatted error', async () => {
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      deploymentUpdateMarket('x', mockClient, mockState),
    ).rejects.toThrow('Error updating deployment market');
  });
});

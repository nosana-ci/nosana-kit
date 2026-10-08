import { Mock } from 'vitest';
import { deploymentUpdateRequirements } from '../deploymentUpdateRequirements.js';
import type { DeploymentState } from '../../../types.js';

describe('deploymentUpdateRequirements', () => {
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
    const requirements = { name: 'NVIDIA GeForce RTX 4090', ram_gb: 64 };

    beforeEach(() => {
      (mockClient.PATCH as Mock).mockResolvedValue({
        data: { requirements, market: mockState.market, updated_at: '2025-01-01T12:00:00.000Z' },
        error: null,
      });
    });

    it('should successfully update the requirements', async () => {
      await deploymentUpdateRequirements(requirements, mockState.market, mockClient, mockState);

      expect(mockClient.PATCH).toHaveBeenCalledWith(
        '/deployments/{deployment}/update-requirements',
        {
          params: { path: { deployment: mockState.id } },
          body: { requirements, market: mockState.market },
        },
      );
      expect(mockState.requirements).toEqual(requirements);
      expect(mockState.updated_at).toBeInstanceOf(Date);
      expect(mockState.updated_at.toISOString()).toBe('2025-01-01T12:00:00.000Z');
    });
  });

  it('should move to the market given in the same update', async () => {
    const requirements = { name: 'NVIDIA GeForce RTX 5090' };
    const market = 'rdRYm53F9nj7VWenCvuJw4Zf85KEo5op9kAiQk52kFh';
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: { requirements, market, updated_at: '2025-01-01T12:00:00.000Z' },
      error: null,
    });

    await deploymentUpdateRequirements(requirements, market, mockClient, mockState);

    expect(mockClient.PATCH).toHaveBeenCalledWith(
      '/deployments/{deployment}/update-requirements',
      {
        params: { path: { deployment: mockState.id } },
        body: { requirements, market },
      },
    );
    expect(mockState.market).toBe(market);
  });

  it('should clear the requirements with null', async () => {
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: { requirements: null, market: mockState.market, updated_at: '2025-01-01T12:00:00.000Z' },
      error: null,
    });

    await deploymentUpdateRequirements(null, mockState.market, mockClient, mockState);

    expect(mockClient.PATCH).toHaveBeenCalledWith(
      '/deployments/{deployment}/update-requirements',
      {
        params: { path: { deployment: mockState.id } },
        body: { requirements: null, market: mockState.market },
      },
    );
    expect(mockState.requirements).toBeNull();
  });

  test('when api returns error, it should throw formatted error', async () => {
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(
      deploymentUpdateRequirements(null, mockState.market, mockClient, mockState),
    ).rejects.toThrow('Error updating deployment requirements');
  });

  test('when api returns no data, it should throw formatted error', async () => {
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      deploymentUpdateRequirements(null, mockState.market, mockClient, mockState),
    ).rejects.toThrow('Error updating deployment requirements');
  });
});

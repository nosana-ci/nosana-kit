import { Mock } from 'vitest';
import { deploymentStop } from '../deploymentStop.js';
import { DeploymentStatus } from '@nosana/types';
import type { DeploymentState } from '../../../types.js';

describe('deploymentStop', () => {
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
    beforeEach(() => {
      (mockClient.POST as Mock).mockResolvedValue({
        data: {
          updated_at: '2025-01-01T12:00:00.000Z',
        },
        error: null,
      });
    });

    it('should successfully stop deployment', async () => {
      await deploymentStop(mockClient, mockState);

      expect(mockState.status).toBe(DeploymentStatus.STOPPING);
      expect(mockState.updated_at).toBeInstanceOf(Date);
      expect(mockState.updated_at.toISOString()).toBe('2025-01-01T12:00:00.000Z');
    });
  });

  test('when status is STOPPING, it should throw assertion error', async () => {
    mockState.status = DeploymentStatus.STOPPING;

    await expect(deploymentStop(mockClient, mockState)).rejects.toThrow(
      'Deployment is already stopped',
    );
  });

  test('when status is STOPPED, it should throw assertion error', async () => {
    mockState.status = DeploymentStatus.STOPPED;

    await expect(deploymentStop(mockClient, mockState)).rejects.toThrow(
      'Deployment is already stopped',
    );
  });

  test('when api returns error, it should throw formatted error', async () => {
    (mockClient.POST as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(deploymentStop(mockClient, mockState)).rejects.toThrow(
      'Error stopping deployment',
    );
  });

  test('when api returns no data, it should throw formatted error', async () => {
    (mockClient.POST as Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(deploymentStop(mockClient, mockState)).rejects.toThrow(
      'Error stopping deployment',
    );
  });
});


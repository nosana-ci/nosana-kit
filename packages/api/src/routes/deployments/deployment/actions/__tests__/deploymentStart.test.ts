import { Mock } from 'vitest';
import { deploymentStart } from '../deploymentStart.js';
import { DeploymentStatus } from '@nosana/types';
import type { DeploymentState } from '../../../types.js';

describe('deploymentStart', () => {
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
          status: DeploymentStatus.RUNNING,
          updated_at: '2025-01-01T12:00:00.000Z',
        },
        error: null,
      });
    });

    it('should successfully start deployment', async () => {
      await deploymentStart(mockClient, mockState);

      expect(mockState.status).toBe(DeploymentStatus.RUNNING);
      expect(mockState.updated_at).toBeInstanceOf(Date);
      expect(mockState.updated_at.toISOString()).toBe('2025-01-01T12:00:00.000Z');
    });
  });

  test('when status is STARTING, it should throw assertion error', async () => {
    mockState.status = DeploymentStatus.STARTING;

    await expect(deploymentStart(mockClient, mockState)).rejects.toThrow(
      'Cannot start a deployment that is already running',
    );
  });

  test('when status is RUNNING, it should throw assertion error', async () => {
    mockState.status = DeploymentStatus.RUNNING;

    await expect(deploymentStart(mockClient, mockState)).rejects.toThrow(
      'Cannot start a deployment that is already running',
    );
  });

  test('when api returns error, it should throw formatted error', async () => {
    (mockClient.POST as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(deploymentStart(mockClient, mockState)).rejects.toThrow(
      'Error starting deployment',
    );
  });

  test('when api returns no data, it should throw formatted error', async () => {
    (mockClient.POST as Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(deploymentStart(mockClient, mockState)).rejects.toThrow(
      'Error starting deployment',
    );
  });
});


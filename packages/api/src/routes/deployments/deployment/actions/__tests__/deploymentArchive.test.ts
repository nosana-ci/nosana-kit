import { Mock } from 'vitest';
import { deploymentArchive } from '../deploymentArchive.js';
import { DeploymentStatus } from '@nosana/types';
import type { DeploymentState } from '../../../types.js';

describe('deploymentArchive', () => {
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
      mockState.status = DeploymentStatus.STOPPED;
      (mockClient.POST as Mock).mockResolvedValue({
        data: {
          status: DeploymentStatus.ARCHIVED,
          updated_at: '2025-01-01T12:00:00.000Z',
        },
        error: null,
      });
    });

    it('should successfully archive deployment', async () => {
      await deploymentArchive(mockClient, mockState);

      expect(mockState.status).toBe(DeploymentStatus.ARCHIVED);
      expect(mockState.updated_at).toBeInstanceOf(Date);
      expect(mockState.updated_at.toISOString()).toBe('2025-01-01T12:00:00.000Z');
      expect(Object.isFrozen(mockState)).toBe(true);
    });
  });

  test('when status is not STOPPED, it should throw assertion error', async () => {
    mockState.status = DeploymentStatus.RUNNING;

    await expect(deploymentArchive(mockClient, mockState)).rejects.toThrow(
      'Deployment must be stopped before archiving',
    );
  });

  test('when api returns error, it should throw formatted error', async () => {
    mockState.status = DeploymentStatus.STOPPED;
    (mockClient.POST as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(deploymentArchive(mockClient, mockState)).rejects.toThrow(
      'Error archiving deployment',
    );
  });

  test('when api returns no data, it should throw formatted error', async () => {
    mockState.status = DeploymentStatus.STOPPED;
    (mockClient.POST as Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(deploymentArchive(mockClient, mockState)).rejects.toThrow(
      'Error archiving deployment',
    );
  });
});


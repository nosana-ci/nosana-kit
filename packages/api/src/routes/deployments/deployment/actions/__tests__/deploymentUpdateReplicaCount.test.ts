import { Mock } from 'vitest';
import { deploymentUpdateReplicaCount } from '../deploymentUpdateReplicaCount.js';
import type { DeploymentState } from '../../../types.js';

describe('deploymentUpdateReplicaCount', () => {
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
      (mockClient.PATCH as Mock).mockResolvedValue({
        data: {
          replicas: 3,
          updated_at: '2025-01-01T12:00:00.000Z',
        },
        error: null,
      });
    });

    it('should successfully update replica count', async () => {
      await deploymentUpdateReplicaCount(3, mockClient, mockState);

      expect(mockState.replicas).toBe(3);
      expect(mockState.updated_at).toBeInstanceOf(Date);
      expect(mockState.updated_at.toISOString()).toBe('2025-01-01T12:00:00.000Z');
    });
  });

  test('when replicas is less than 1, it should throw assertion error', async () => {
    await expect(
      deploymentUpdateReplicaCount(0, mockClient, mockState),
    ).rejects.toThrow('Replica count must be at least 1');
  });

  test('when replicas is negative, it should throw assertion error', async () => {
    await expect(
      deploymentUpdateReplicaCount(-1, mockClient, mockState),
    ).rejects.toThrow('Replica count must be at least 1');
  });

  test('when api returns error, it should throw formatted error', async () => {
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(
      deploymentUpdateReplicaCount(2, mockClient, mockState),
    ).rejects.toThrow('Error updating deployment replica count');
  });

  test('when api returns no data, it should throw formatted error', async () => {
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      deploymentUpdateReplicaCount(2, mockClient, mockState),
    ).rejects.toThrow('Error updating deployment replica count');
  });
});


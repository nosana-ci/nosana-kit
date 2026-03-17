import { Mock } from 'vitest';
import { deploymentDelete } from '../deploymentDelete.js';
import { DeploymentStatus } from '@nosana/types';
import type { DeploymentState } from '../../../types.js';

describe('deploymentDelete', () => {
  const mockClient = global.TEST_MOCK_CLIENT;
  let mockState: DeploymentState;
  let clearStateMock: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      ...global.TEST_MOCK_DEPLOYMENT,
      updated_at: new Date(global.TEST_MOCK_DEPLOYMENT.updated_at),
      created_at: new Date(global.TEST_MOCK_DEPLOYMENT.created_at),
    };
    clearStateMock = vi.fn();
  });

  describe('when delete is successful', () => {
    beforeEach(() => {
      mockState.status = DeploymentStatus.STOPPED;
      (mockClient.DELETE as Mock).mockResolvedValue({
        data: {},
        error: null,
      });
    });

    it('should successfully delete deployment', async () => {
      const deploymentId = mockState.id;

      await deploymentDelete(mockClient, mockState, clearStateMock);

      expect(mockClient.DELETE).toHaveBeenCalledWith(
        '/api/deployments/{deployment}',
        {
          params: { path: { deployment: deploymentId } },
        }
      );
    });

    it('should call clearState after successful deletion', async () => {
      await deploymentDelete(mockClient, mockState, clearStateMock);

      expect(clearStateMock).toHaveBeenCalled();
    });
  });

  test('when status is not STOPPED, it should throw error', async () => {
    mockState.status = DeploymentStatus.RUNNING;

    await expect(deploymentDelete(mockClient, mockState, clearStateMock)).rejects.toThrow(
      'Deployment must be stopped before it can be deleted',
    );
  });

  test('when api returns error, it should throw formatted error', async () => {
    mockState.status = DeploymentStatus.STOPPED;
    (mockClient.DELETE as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(deploymentDelete(mockClient, mockState, clearStateMock)).rejects.toThrow(
      'Error deleting deployment',
    );
  });

  test('when api returns error, clearState should not be called', async () => {
    mockState.status = DeploymentStatus.STOPPED;
    (mockClient.DELETE as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(deploymentDelete(mockClient, mockState, clearStateMock)).rejects.toThrow();

    expect(clearStateMock).not.toHaveBeenCalled();
  });
});

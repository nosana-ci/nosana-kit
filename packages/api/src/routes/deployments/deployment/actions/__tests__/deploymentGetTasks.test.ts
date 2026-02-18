import { Mock } from 'vitest';
import { deploymentGetTasks } from '../deploymentGetTasks.js';
import type { DeploymentState } from '../../../types.js';

describe('deploymentGetTasks', () => {
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
      (mockClient.GET as Mock).mockResolvedValue({
        data: global.TEST_MOCK_TASKS_LIST,
        error: null,
      });
    });

    it('should successfully get tasks', async () => {
      const result = await deploymentGetTasks(mockClient, mockState);

      expect(result).toEqual(global.TEST_MOCK_TASKS_LIST);
      expect(mockClient.GET).toHaveBeenCalledWith(
        '/api/deployments/{deployment}/tasks',
        {
          params: { path: { deployment: mockState.id } },
        },
      );
    });
  });

  test('when api returns error, it should throw formatted error', async () => {
    (mockClient.GET as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(deploymentGetTasks(mockClient, mockState)).rejects.toThrow(
      'Error getting deployment tasks',
    );
  });

  test('when api returns no data, it should throw formatted error', async () => {
    (mockClient.GET as Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(deploymentGetTasks(mockClient, mockState)).rejects.toThrow(
      'Error getting deployment tasks',
    );
  });
});


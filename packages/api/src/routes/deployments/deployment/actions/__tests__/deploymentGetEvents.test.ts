import { Mock } from 'vitest';
import { deploymentGetEvents } from '../deploymentGetEvents.js';
import type { DeploymentState } from '../../../types.js';

const TEST_CURSOR = 'test-cursor';
const TEST_LIMIT = 10;

describe('deploymentGetEvents', () => {
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
        data: global.TEST_MOCK_EVENTS_RESPONSE,
        error: null,
      });
    });

    it('should successfully get events', async () => {
      const result = await deploymentGetEvents(mockClient, mockState);

      expect(result.events).toEqual([global.TEST_MOCK_EVENT]);
      expect(mockClient.GET).toHaveBeenCalledWith(
        '/api/deployments/{deployment}/events',
        {
          params: {
            path: { deployment: mockState.id },
            query: {},
          },
        },
      );
    });

    it('should pass search params', async () => {
      await deploymentGetEvents(mockClient, mockState, { cursor: TEST_CURSOR, limit: TEST_LIMIT });

      expect(mockClient.GET).toHaveBeenCalledWith(
        '/api/deployments/{deployment}/events',
        {
          params: {
            path: { deployment: mockState.id },
            query: { cursor: TEST_CURSOR, limit: TEST_LIMIT },
          },
        },
      );
    });
  });

  test('when api returns error, it should throw formatted error', async () => {
    (mockClient.GET as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(deploymentGetEvents(mockClient, mockState)).rejects.toThrow(
      'Error getting deployment events',
    );
  });

  test('when api returns no data, it should throw formatted error', async () => {
    (mockClient.GET as Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(deploymentGetEvents(mockClient, mockState)).rejects.toThrow(
      'Error getting deployment events',
    );
  });
});

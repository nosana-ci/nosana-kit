import { Mock } from 'vitest';
import { deploymentUpdateName } from '../deploymentUpdateName.js';
import type { DeploymentState } from '../../../types.js';

describe('deploymentUpdateName', () => {
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
    const name = 'renamed-deployment';

    beforeEach(() => {
      (mockClient.PATCH as Mock).mockResolvedValue({
        data: { name, updated_at: '2025-01-01T12:00:00.000Z' },
        error: null,
      });
    });

    it('should successfully update the name', async () => {
      await deploymentUpdateName(name, mockClient, mockState);

      expect(mockState.name).toBe(name);
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
      deploymentUpdateName('x', mockClient, mockState),
    ).rejects.toThrow('Error updating deployment name');
  });
});

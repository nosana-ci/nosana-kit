import { Mock } from 'vitest';
import { deploymentDuplicate } from '../deploymentDuplicate.js';
import type { DeploymentState } from '../../../types.js';

describe('deploymentDuplicate', () => {
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
    const copy = {
      ...global.TEST_MOCK_DEPLOYMENT,
      id: 'CopyDeploymentId111111111111111111111111111',
      name: 'copied-deployment',
    };

    beforeEach(() => {
      (mockClient.POST as Mock).mockResolvedValue({
        data: copy,
        error: null,
      });
    });

    it('should return the new deployment and leave the source untouched', async () => {
      const result = await deploymentDuplicate(
        { name: 'copied-deployment' },
        mockClient,
        mockState,
      );

      expect(mockClient.POST).toHaveBeenCalledWith(
        '/deployments/{deployment}/duplicate',
        {
          params: { path: { deployment: mockState.id } },
          body: { name: 'copied-deployment' },
        },
      );
      expect(result).toEqual(copy);
      expect(mockState.id).toBe(global.TEST_MOCK_DEPLOYMENT.id);
      expect(mockState.name).toBe(global.TEST_MOCK_DEPLOYMENT.name);
    });

    it('should pass autostart through to the api', async () => {
      await deploymentDuplicate(
        { name: 'copied-deployment', autostart: true },
        mockClient,
        mockState,
      );

      expect(mockClient.POST).toHaveBeenCalledWith(
        '/deployments/{deployment}/duplicate',
        {
          params: { path: { deployment: mockState.id } },
          body: { name: 'copied-deployment', autostart: true },
        },
      );
    });
  });

  test('when api returns error, it should throw formatted error', async () => {
    (mockClient.POST as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(
      deploymentDuplicate({ name: 'x' }, mockClient, mockState),
    ).rejects.toThrow('Error duplicating deployment');
  });

  test('when api returns no data, it should throw formatted error', async () => {
    (mockClient.POST as Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      deploymentDuplicate({ name: 'x' }, mockClient, mockState),
    ).rejects.toThrow('Error duplicating deployment');
  });
});

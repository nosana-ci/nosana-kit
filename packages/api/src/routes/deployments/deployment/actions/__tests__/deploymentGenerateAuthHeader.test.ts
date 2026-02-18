import { Mock } from 'vitest';
import { deploymentGenerateAuthHeader } from '../deploymentGenerateAuthHeader.js';
import type { DeploymentState } from '../../../types.js';

describe('deploymentGenerateAuthHeader', () => {
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
    const mockHeader = 'Bearer auth-token-123';

    beforeEach(() => {
      (mockClient.GET as Mock).mockResolvedValue({
        data: { header: mockHeader },
        error: null,
      });
    });

    it('should successfully generate auth header', async () => {
      const result = await deploymentGenerateAuthHeader(mockClient, mockState);

      expect(result).toBe(mockHeader);
      expect(mockClient.GET).toHaveBeenCalledWith(
        '/api/deployments/{deployment}/header',
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

    await expect(
      deploymentGenerateAuthHeader(mockClient, mockState),
    ).rejects.toThrow('Error generating deployment header');
  });

  test('when api returns no data, it should throw formatted error', async () => {
    (mockClient.GET as Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      deploymentGenerateAuthHeader(mockClient, mockState),
    ).rejects.toThrow('Error generating deployment header');
  });
});


import { Mock } from 'vitest';
import { deploymentGetAllJobHeaders } from '../deploymentGetAllJobHeaders.js';
import type { DeploymentState } from '../../../types.js';

describe('deploymentGetAllJobHeaders', () => {
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

  it('returns the header for each running job', async () => {
    const headers = { 'job-a': 'job-a:sig:1', 'job-b': 'job-b:sig:2' };
    (mockClient.GET as Mock).mockResolvedValue({ data: { headers }, error: null });

    await expect(deploymentGetAllJobHeaders(mockClient, mockState)).resolves.toEqual(headers);
    expect(mockClient.GET).toHaveBeenCalledWith('/deployments/{deployment}/headers', {
      params: { path: { deployment: mockState.id } },
    });
  });

  test('when api returns error, it should throw formatted error', async () => {
    (mockClient.GET as Mock).mockResolvedValue({ data: null, error: { message: 'Not Found' } });

    await expect(deploymentGetAllJobHeaders(mockClient, mockState)).rejects.toThrow(
      'Error generating deployment job headers',
    );
  });
});

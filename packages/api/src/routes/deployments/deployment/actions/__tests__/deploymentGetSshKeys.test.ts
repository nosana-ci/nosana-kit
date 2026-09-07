import type { Mock } from 'vitest';
import { deploymentGetSshKeys } from '../deploymentGetSshKeys.js';
import type { DeploymentState } from '../../../types.js';

describe('deploymentGetSshKeys', () => {
  const mockClient = global.TEST_MOCK_CLIENT;
  const mockState: DeploymentState = {
    ...global.TEST_MOCK_DEPLOYMENT,
    updated_at: new Date(global.TEST_MOCK_DEPLOYMENT.updated_at),
    created_at: new Date(global.TEST_MOCK_DEPLOYMENT.created_at),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the configured public keys', async () => {
    const response = { public_keys: ['ssh-ed25519 AAAA test@example.com'] };
    (mockClient.GET as Mock).mockResolvedValue({ data: response, error: null });

    await expect(deploymentGetSshKeys(mockClient, mockState)).resolves.toEqual(
      response,
    );
    expect(mockClient.GET).toHaveBeenCalledWith(
      '/deployments/{deployment}/ssh-keys',
      { params: { path: { deployment: mockState.id } } },
    );
  });

  it('throws a formatted error when the request fails', async () => {
    (mockClient.GET as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Request failed' },
    });

    await expect(deploymentGetSshKeys(mockClient, mockState)).rejects.toThrow(
      'Error getting deployment SSH keys',
    );
  });
});

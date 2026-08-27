import type { Mock } from 'vitest';
import { deploymentUpdateSshKeys } from '../deploymentUpdateSshKeys.js';
import type { DeploymentState } from '../../../types.js';

describe('deploymentUpdateSshKeys', () => {
  const mockClient = global.TEST_MOCK_CLIENT;
  const mockState: DeploymentState = {
    ...global.TEST_MOCK_DEPLOYMENT,
    updated_at: new Date(global.TEST_MOCK_DEPLOYMENT.updated_at),
    created_at: new Date(global.TEST_MOCK_DEPLOYMENT.created_at),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('replaces the complete public-key set and returns job results', async () => {
    const publicKeys = ['ssh-ed25519 AAAA test@example.com'];
    const response = {
      public_keys: publicKeys,
      updated_at: '2026-08-26T12:00:00.000Z',
      jobs: [
        { job: 'job-address', node: 'node-address', status: 'authorized' },
      ],
    };
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: response,
      error: null,
    });

    await expect(
      deploymentUpdateSshKeys(publicKeys, mockClient, mockState),
    ).resolves.toEqual(response);
    expect(mockClient.PATCH).toHaveBeenCalledWith(
      '/deployments/{deployment}/update-ssh-keys',
      {
        params: { path: { deployment: mockState.id } },
        body: { public_keys: publicKeys },
      },
    );
  });

  it('allows an empty set to revoke access for future jobs', async () => {
    const response = {
      public_keys: [],
      updated_at: '2026-08-26T12:00:00.000Z',
      jobs: [],
    };
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: response,
      error: null,
    });

    await expect(
      deploymentUpdateSshKeys([], mockClient, mockState),
    ).resolves.toEqual(response);
  });

  it('throws a formatted error when the request fails', async () => {
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Invalid key' },
    });

    await expect(
      deploymentUpdateSshKeys([], mockClient, mockState),
    ).rejects.toThrow('Error updating deployment SSH keys');
  });
});

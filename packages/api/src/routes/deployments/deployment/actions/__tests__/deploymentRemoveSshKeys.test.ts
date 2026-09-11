import type { Mock } from 'vitest';
import { deploymentRemoveSshKeys } from '../deploymentRemoveSshKeys.js';
import type { DeploymentState } from '../../../types.js';

describe('deploymentRemoveSshKeys', () => {
  const mockClient = global.TEST_MOCK_CLIENT;
  const mockState: DeploymentState = {
    ...global.TEST_MOCK_DEPLOYMENT,
    updated_at: new Date(global.TEST_MOCK_DEPLOYMENT.updated_at),
    created_at: new Date(global.TEST_MOCK_DEPLOYMENT.created_at),
  };
  const alice = 'ssh-ed25519 AAAAalice alice@example.com';
  const bob = 'ssh-rsa AAAAbob bob@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    (mockClient.DELETE as Mock).mockResolvedValue({
      data: { public_keys: [alice], updated_at: '2026-08-26T12:00:00.000Z', jobs: [] },
      error: null,
    });
  });

  it('deletes the given keys and returns the resulting set', async () => {
    const result = await deploymentRemoveSshKeys([bob], mockClient, mockState);

    expect(mockClient.DELETE).toHaveBeenCalledWith('/deployments/{deployment}/ssh-keys', {
      params: { path: { deployment: mockState.id } },
      body: { public_keys: [bob] },
    });
    expect(result.public_keys).toEqual([alice]);
  });

  it('accepts a single key as a one-element array', async () => {
    await deploymentRemoveSshKeys(alice, mockClient, mockState);

    expect(mockClient.DELETE).toHaveBeenCalledWith(
      '/deployments/{deployment}/ssh-keys',
      expect.objectContaining({ body: { public_keys: [alice] } }),
    );
  });

  it('throws a formatted error when the request fails', async () => {
    (mockClient.DELETE as Mock).mockResolvedValue({ data: null, error: { message: 'Request failed' } });

    await expect(deploymentRemoveSshKeys(alice, mockClient, mockState)).rejects.toThrow(
      'Error revoking deployment SSH keys',
    );
  });
});

import type { Mock } from 'vitest';
import { deploymentAddSshKeys } from '../deploymentAddSshKeys.js';
import type { DeploymentState } from '../../../types.js';

describe('deploymentAddSshKeys', () => {
  const mockClient = global.TEST_MOCK_CLIENT;
  const mockState: DeploymentState = {
    ...global.TEST_MOCK_DEPLOYMENT,
    updated_at: new Date(global.TEST_MOCK_DEPLOYMENT.updated_at),
    created_at: new Date(global.TEST_MOCK_DEPLOYMENT.created_at),
  };
  const added = 'ssh-rsa AAAAadded bob@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    (mockClient.POST as Mock).mockImplementation(async (_path, { body }) => ({
      data: { public_keys: body.public_keys, updated_at: '2026-08-26T12:00:00.000Z', jobs: [] },
      error: null,
    }));
  });

  it('posts the keys to grant and returns the resulting set', async () => {
    const result = await deploymentAddSshKeys([added], mockClient, mockState);

    expect(mockClient.POST).toHaveBeenCalledWith('/deployments/{deployment}/ssh-keys', {
      params: { path: { deployment: mockState.id } },
      body: { public_keys: [added] },
    });
    expect(result.public_keys).toEqual([added]);
  });

  it('accepts a single key as a one-element array', async () => {
    await deploymentAddSshKeys(added, mockClient, mockState);

    expect(mockClient.POST).toHaveBeenCalledWith(
      '/deployments/{deployment}/ssh-keys',
      expect.objectContaining({ body: { public_keys: [added] } }),
    );
  });

  it('throws a formatted error when the request fails', async () => {
    (mockClient.POST as Mock).mockResolvedValue({ data: null, error: { message: 'Request failed' } });

    await expect(deploymentAddSshKeys(added, mockClient, mockState)).rejects.toThrow(
      'Error adding deployment SSH keys',
    );
  });
});

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
    (mockClient.GET as Mock).mockResolvedValue({
      data: { public_keys: [alice, bob] },
      error: null,
    });
    (mockClient.PATCH as Mock).mockImplementation(async (_path, { body }) => ({
      data: {
        public_keys: body.public_keys,
        updated_at: '2026-08-26T12:00:00.000Z',
        jobs: [],
      },
      error: null,
    }));
  });

  it('removes the given keys from the current set', async () => {
    const result = await deploymentRemoveSshKeys([bob], mockClient, mockState);

    expect(mockClient.GET).toHaveBeenCalledWith(
      '/deployments/{deployment}/ssh-keys',
      { params: { path: { deployment: mockState.id } } },
    );
    expect(mockClient.PATCH).toHaveBeenCalledWith(
      '/deployments/{deployment}/update-ssh-keys',
      {
        params: { path: { deployment: mockState.id } },
        body: { public_keys: [alice] },
      },
    );
    expect(result.public_keys).toEqual([alice]);
  });

  it('accepts a single key', async () => {
    await deploymentRemoveSshKeys(alice, mockClient, mockState);

    expect(mockClient.PATCH).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: { public_keys: [bob] } }),
    );
  });

  it('matches a key by its type and material, ignoring the comment', async () => {
    await deploymentRemoveSshKeys('ssh-rsa AAAAbob someone@else', mockClient, mockState);

    expect(mockClient.PATCH).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: { public_keys: [alice] } }),
    );
  });

  it('leaves the set unchanged when the key is not present', async () => {
    await deploymentRemoveSshKeys('ssh-ed25519 AAAAunknown x@example.com', mockClient, mockState);

    expect(mockClient.PATCH).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: { public_keys: [alice, bob] } }),
    );
  });

  it('throws a formatted error when reading the current keys fails', async () => {
    (mockClient.GET as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Request failed' },
    });

    await expect(
      deploymentRemoveSshKeys(alice, mockClient, mockState),
    ).rejects.toThrow('Error getting deployment SSH keys');
    expect(mockClient.PATCH).not.toHaveBeenCalled();
  });
});

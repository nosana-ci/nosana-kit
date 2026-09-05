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
  const existing = 'ssh-ed25519 AAAAexisting alice@example.com';
  const added = 'ssh-rsa AAAAadded bob@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    (mockClient.GET as Mock).mockResolvedValue({
      data: { public_keys: [existing] },
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

  it('appends new keys to the current set', async () => {
    const result = await deploymentAddSshKeys([added], mockClient, mockState);

    expect(mockClient.GET).toHaveBeenCalledWith(
      '/deployments/{deployment}/ssh-keys',
      { params: { path: { deployment: mockState.id } } },
    );
    expect(mockClient.PATCH).toHaveBeenCalledWith(
      '/deployments/{deployment}/update-ssh-keys',
      {
        params: { path: { deployment: mockState.id } },
        body: { public_keys: [existing, added] },
      },
    );
    expect(result.public_keys).toEqual([existing, added]);
  });

  it('accepts a single key', async () => {
    await deploymentAddSshKeys(added, mockClient, mockState);

    expect(mockClient.PATCH).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: { public_keys: [existing, added] } }),
    );
  });

  it('does not duplicate a key that is already present, even with a different comment', async () => {
    await deploymentAddSshKeys(
      ['ssh-ed25519 AAAAexisting other@example.com', added, added],
      mockClient,
      mockState,
    );

    expect(mockClient.PATCH).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: { public_keys: [existing, added] } }),
    );
  });

  it('throws a formatted error when reading the current keys fails', async () => {
    (mockClient.GET as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Request failed' },
    });

    await expect(
      deploymentAddSshKeys(added, mockClient, mockState),
    ).rejects.toThrow('Error getting deployment SSH keys');
    expect(mockClient.PATCH).not.toHaveBeenCalled();
  });
});

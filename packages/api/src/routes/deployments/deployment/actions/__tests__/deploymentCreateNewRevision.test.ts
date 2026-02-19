import { Mock } from 'vitest';
import { deploymentCreateNewRevision } from '../deploymentCreateNewRevision.js';
import type { DeploymentState } from '../../../types.js';

describe('deploymentCreateNewRevision', () => {
  const mockClient = global.TEST_MOCK_CLIENT;
  let mockState: DeploymentState;
  const mockJobDefinition = {
    version: '0.1',
    type: 'container',
    ops: [
      {
        type: 'container/run',
        id: 'NewOp',
        args: {
          image: 'docker.io/test/image:latest',
          cmd: ['echo', 'hello'],
        },
      },
    ],
    meta: {
      trigger: 'deployment-manager',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      ...global.TEST_MOCK_DEPLOYMENT,
      updated_at: new Date(global.TEST_MOCK_DEPLOYMENT.updated_at),
      created_at: new Date(global.TEST_MOCK_DEPLOYMENT.created_at),
      revisions: [...global.TEST_MOCK_DEPLOYMENT.revisions],
    };
  });

  describe('when data is returned', () => {
    const newEndpoints = [
      { opId: 'NewOp', port: 8080, url: 'https://new-url.example.com' },
    ];

    beforeEach(() => {
      const newRevision = {
        revision: 2,
        deployment: mockState.id,
        ipfs_definition_hash: 'QmNewHash',
        job_definition: mockJobDefinition,
        created_at: '2025-01-01T12:00:00.000Z',
      };
      (mockClient.POST as Mock).mockResolvedValue({
        data: {
          active_revision: 2,
          endpoints: newEndpoints,
          updated_at: '2025-01-01T12:00:00.000Z',
          revisions: newRevision,
        },
        error: null,
      });
    });

    it('should successfully create new revision', async () => {
      await deploymentCreateNewRevision(mockJobDefinition, mockClient, mockState);

      expect(mockState.active_revision).toBe(2);
      expect(mockState.endpoints).toEqual(newEndpoints);
      expect(mockState.updated_at).toBeInstanceOf(Date);
      expect(mockState.updated_at.toISOString()).toBe('2025-01-01T12:00:00.000Z');
      // Note: revisions array is no longer updated by this endpoint
      // Revisions must be fetched separately via getRevisions()
    });
  });

  test('when api returns error, it should throw formatted error', async () => {
    (mockClient.POST as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(
      deploymentCreateNewRevision(mockJobDefinition, mockClient, mockState),
    ).rejects.toThrow('Error creating new revision');
  });

  test('when api returns no data, it should throw formatted error', async () => {
    (mockClient.POST as Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      deploymentCreateNewRevision(mockJobDefinition, mockClient, mockState),
    ).rejects.toThrow('Error creating new revision');
  });
});


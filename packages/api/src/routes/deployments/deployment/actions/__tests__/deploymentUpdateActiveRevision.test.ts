import { Mock } from 'vitest';
import { deploymentUpdateActiveRevision } from '../deploymentUpdateActiveRevision.js';
import type { DeploymentState } from '../../../types.js';

describe('deploymentUpdateActiveRevision', () => {
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
    const newEndpoints = [
      { opId: 'Pytorch', port: 8888, url: 'https://new-url.example.com' },
    ];

    beforeEach(() => {
      (mockClient.PATCH as Mock).mockResolvedValue({
        data: {
          active_revision: 2,
          endpoints: newEndpoints,
          updated_at: '2025-01-01T12:00:00.000Z',
        },
        error: null,
      });
    });

    it('should successfully update active revision', async () => {
      await deploymentUpdateActiveRevision(2, mockClient, mockState);

      expect(mockState.active_revision).toBe(2);
      expect(mockState.endpoints).toEqual(newEndpoints);
      expect(mockState.updated_at).toBeInstanceOf(Date);
      expect(mockState.updated_at.toISOString()).toBe('2025-01-01T12:00:00.000Z');
    });
  });

  test('when api returns error, it should throw formatted error', async () => {
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(
      deploymentUpdateActiveRevision(2, mockClient, mockState),
    ).rejects.toThrow('Error updating active revision');
  });

  test('when api returns no data, it should throw formatted error', async () => {
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      deploymentUpdateActiveRevision(2, mockClient, mockState),
    ).rejects.toThrow('Error updating active revision');
  });
});


import { Mock } from 'vitest';
import { deploymentUpdateSchedule } from '../deploymentUpdateSchedule.js';
import type { DeploymentState } from '../../../types.js';

describe('deploymentUpdateSchedule', () => {
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
    const schedule = '0 0 * * *';

    beforeEach(() => {
      (mockClient.PATCH as Mock).mockResolvedValue({
        data: {
          schedule,
          updated_at: '2025-01-01T12:00:00.000Z',
        },
        error: null,
      });
    });

    it('should successfully update schedule', async () => {
      await deploymentUpdateSchedule(schedule, mockClient, mockState);

      expect(mockState.schedule).toBe(schedule);
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
      deploymentUpdateSchedule('0 0 * * *', mockClient, mockState),
    ).rejects.toThrow('Error updating schedule');
  });

  test('when api returns no data, it should throw formatted error', async () => {
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      deploymentUpdateSchedule('0 0 * * *', mockClient, mockState),
    ).rejects.toThrow('Error updating schedule');
  });
});


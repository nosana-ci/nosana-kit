import { Mock } from 'vitest';
import { deploymentUpdateTimeout } from '../deploymentUpdateTimeout.js';
import type { DeploymentState } from '../../../types.js';

describe('deploymentUpdateTimeout', () => {
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
    beforeEach(() => {
      (mockClient.PATCH as Mock).mockResolvedValue({
        data: {
          timeout: 120,
          updated_at: '2025-01-01T12:00:00.000Z',
        },
        error: null,
      });
    });

    it('should successfully update timeout', async () => {
      await deploymentUpdateTimeout(120, mockClient, mockState);

      expect(mockState.timeout).toBe(120);
      expect(mockState.updated_at).toBeInstanceOf(Date);
      expect(mockState.updated_at.toISOString()).toBe('2025-01-01T12:00:00.000Z');
    });
  });

  test('when timeout is less than 60, it should throw assertion error', async () => {
    await expect(
      deploymentUpdateTimeout(59, mockClient, mockState),
    ).rejects.toThrow('Timeout must be at least 60 seconds');
  });

  test('when timeout is 0, it should throw assertion error', async () => {
    await expect(
      deploymentUpdateTimeout(0, mockClient, mockState),
    ).rejects.toThrow('Timeout must be at least 60 seconds');
  });

  it('should accept timeout of exactly 60', async () => {
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: {
        timeout: 60,
        updated_at: '2025-01-01T12:00:00.000Z',
      },
      error: null,
    });

    await deploymentUpdateTimeout(60, mockClient, mockState);

    expect(mockState.timeout).toBe(60);
  });

  test('when api returns error, it should throw formatted error', async () => {
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    await expect(
      deploymentUpdateTimeout(120, mockClient, mockState),
    ).rejects.toThrow('Error updating deployment timeout');
  });

  test('when api returns no data, it should throw formatted error', async () => {
    (mockClient.PATCH as Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      deploymentUpdateTimeout(120, mockClient, mockState),
    ).rejects.toThrow('Error updating deployment timeout');
  });
});


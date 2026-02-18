import { Mock } from 'vitest';
import { deploymentGetJob } from '../deploymentGetJob.js';

describe('deploymentGetJob', () => {
  const mockClient = global.TEST_MOCK_CLIENT;
  const deploymentId = '8hP5WVzxX8qQE9s6J7BkUxEsb1vQD5viiEZ1pKVXSQFH';
  const jobId = 'job-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when data is returned', () => {
    const mockJob = { id: jobId, status: 'running' };

    beforeEach(() => {
      (mockClient.GET as Mock).mockResolvedValue({
        data: mockJob,
        error: null,
      });
    });

    it('should successfully get job', async () => {
      const result = await deploymentGetJob(mockClient, deploymentId, jobId);

      expect(result).toEqual(mockJob);
      expect(mockClient.GET).toHaveBeenCalledWith(
        '/api/deployments/{deployment}/jobs/{job}',
        {
          params: { path: { deployment: deploymentId, job: jobId } },
        },
      );
    });
  });

  test('when api returns error, it should throw formatted error', async () => {
    (mockClient.GET as Mock).mockResolvedValue({
      data: null,
      error: { message: 'Job not found' },
    });

    await expect(
      deploymentGetJob(mockClient, deploymentId, jobId),
    ).rejects.toThrow('Error getting deployment job');
  });

  test('when api returns no data, it should throw formatted error', async () => {
    (mockClient.GET as Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      deploymentGetJob(mockClient, deploymentId, jobId),
    ).rejects.toThrow('Error getting deployment job');
  });
});


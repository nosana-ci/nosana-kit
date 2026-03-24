import { Mock } from 'vitest';
import { createNosanaJobsApi } from '../index.js';

const TEST_MARKET = 'test-market';
const TEST_BATCH_ADDRESS = 'addr1';

describe('createNosanaJobsApi', () => {
  describe('get', () => {
    it('should return the job', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: global.TEST_MOCK_JOB,
        error: null,
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.get(
        '4XGB9rCfsM4QjMaGDCekF42izsJzYzGftg2xxMReWkyn',
      );

      expect(result).toEqual(global.TEST_MOCK_JOB);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.get('invalid')).rejects.toThrow('Failed to get job');
    });
  });

  describe('getAll', () => {
    it('should return all jobs', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: [global.TEST_MOCK_JOB],
        error: null,
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.getAll();

      expect(result).toEqual([global.TEST_MOCK_JOB]);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.getAll()).rejects.toThrow('Failed to get all jobs');
    });
  });

  describe('list', () => {
    it('should return the list job response', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: global.TEST_MOCK_CREATE_JOB_RESPONSE,
        error: null,
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.list(global.TEST_CREATE_JOB_REQUEST);

      expect(result).toEqual(global.TEST_MOCK_CREATE_JOB_RESPONSE);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Insufficient credits' },
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.list(global.TEST_CREATE_JOB_REQUEST)).rejects.toThrow(
        'Failed to list job',
      );
    });
  });

  describe('extend', () => {
    it('should return the extended job response', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: global.TEST_MOCK_EXTEND_JOB_RESPONSE,
        error: null,
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.extend({
        address: '8TjrkaZmW2UFjpm2Va5LECJc7zoFrbUJETk6fPimGi9a',
        seconds: 3600,
      });

      expect(result).toEqual(global.TEST_MOCK_EXTEND_JOB_RESPONSE);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Job not found' },
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.extend({ address: 'invalid', seconds: 3600 })).rejects.toThrow(
        'Failed to extend job',
      );
    });
  });

  describe('stop', () => {
    it('should return the stop job response', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: global.TEST_MOCK_STOP_JOB_RESPONSE,
        error: null,
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.stop(
        'A22xnkSkpBd4a7ExfwZnfFpUbMc1zRBT6NyzVHzf1S6Q',
      );

      expect(result).toEqual(global.TEST_MOCK_STOP_JOB_RESPONSE);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Cannot stop' },
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.stop('invalid')).rejects.toThrow('Failed to stop job');
    });
  });

  describe('getRunning', () => {
    it('should return running jobs', async () => {
      const mockResponse = { jobs: ['job1'] };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.getRunning();

      expect(result).toEqual(mockResponse);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.getRunning()).rejects.toThrow('Failed to get running jobs');
    });
  });

  describe('getRunningNodes', () => {
    it('should return running nodes', async () => {
      const mockResponse = { nodes: ['node1'] };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.getRunningNodes({ market: TEST_MARKET });

      expect(result).toEqual(mockResponse);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.getRunningNodes({ market: TEST_MARKET })).rejects.toThrow('Failed to get running nodes');
    });
  });

  describe('getLongRunning', () => {
    it('should return long-running jobs', async () => {
      const mockResponse = { jobs: ['job1'] };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.getLongRunning();

      expect(result).toEqual(mockResponse);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.getLongRunning()).rejects.toThrow('Failed to get long-running jobs');
    });
  });

  describe('getStats', () => {
    it('should return job stats', async () => {
      const mockResponse = { total: 100 };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.getStats();

      expect(result).toEqual(mockResponse);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.getStats()).rejects.toThrow('Failed to get job stats');
    });
  });

  describe('getStatsTimestamps', () => {
    it('should return job stats timestamps', async () => {
      const mockResponse = { timestamps: [1000, 2000] };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.getStatsTimestamps();

      expect(result).toEqual(mockResponse);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.getStatsTimestamps()).rejects.toThrow('Failed to get job stats timestamps');
    });
  });

  describe('getCount', () => {
    it('should return job count', async () => {
      const mockResponse = { count: 42 };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.getCount();

      expect(result).toEqual(mockResponse);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.getCount()).rejects.toThrow('Failed to get job count');
    });
  });

  describe('getBatch', () => {
    it('should return batch of jobs', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: [global.TEST_MOCK_JOB],
        error: null,
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.getBatch({ addresses: [TEST_BATCH_ADDRESS] });

      expect(result).toEqual([global.TEST_MOCK_JOB]);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const api = createNosanaJobsApi({
        blockchainIndexer: global.TEST_MOCK_CLIENT,
        clientManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.getBatch({ addresses: [] })).rejects.toThrow('Failed to get jobs batch');
    });
  });
});

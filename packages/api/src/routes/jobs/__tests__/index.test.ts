import { Mock } from 'vitest';
import { createNosanaJobsApi } from '../index.js';

describe('createNosanaJobsApi', () => {
  describe('get', () => {
    it('should return the job', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: global.TEST_MOCK_JOB, error: null });

      const api = createNosanaJobsApi({ blockchainIndexer: global.TEST_MOCK_CLIENT });
      const result = await api.get('4XGB9rCfsM4QjMaGDCekF42izsJzYzGftg2xxMReWkyn');

      expect(result).toEqual(global.TEST_MOCK_JOB);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: null, error: { message: 'Not found' } });

      const api = createNosanaJobsApi({ blockchainIndexer: global.TEST_MOCK_CLIENT });

      await expect(api.get('invalid')).rejects.toThrow('Failed to get job');
    });
  });

  describe('list', () => {
    it('should return the created job response', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: global.TEST_MOCK_CREATE_JOB_RESPONSE, error: null });

      const api = createNosanaJobsApi({ blockchainIndexer: global.TEST_MOCK_CLIENT });
      const result = await api.list(global.TEST_CREATE_JOB_REQUEST);

      expect(result).toEqual(global.TEST_MOCK_CREATE_JOB_RESPONSE);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: null, error: { message: 'Insufficient credits' } });

      const api = createNosanaJobsApi({ blockchainIndexer: global.TEST_MOCK_CLIENT });

      await expect(api.list(global.TEST_CREATE_JOB_REQUEST)).rejects.toThrow('Failed to list job');
    });
  });

  describe('extend', () => {
    it('should return the extended job response', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: global.TEST_MOCK_EXTEND_JOB_RESPONSE, error: null });

      const api = createNosanaJobsApi({ blockchainIndexer: global.TEST_MOCK_CLIENT });
      const result = await api.extend(global.TEST_EXTEND_JOB_REQUEST);

      expect(result).toEqual(global.TEST_MOCK_EXTEND_JOB_RESPONSE);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: null, error: { message: 'Job not found' } });

      const api = createNosanaJobsApi({ blockchainIndexer: global.TEST_MOCK_CLIENT });

      await expect(api.extend(global.TEST_EXTEND_JOB_REQUEST)).rejects.toThrow('Failed to extend job');
    });
  });

  describe('stop', () => {
    it('should return the stop job response', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: global.TEST_MOCK_STOP_JOB_RESPONSE, error: null });

      const api = createNosanaJobsApi({ blockchainIndexer: global.TEST_MOCK_CLIENT });
      const result = await api.stop('A22xnkSkpBd4a7ExfwZnfFpUbMc1zRBT6NyzVHzf1S6Q');

      expect(result).toEqual(global.TEST_MOCK_STOP_JOB_RESPONSE);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: null, error: { message: 'Cannot stop' } });

      const api = createNosanaJobsApi({ blockchainIndexer: global.TEST_MOCK_CLIENT });

      await expect(api.stop('invalid')).rejects.toThrow('Failed to stop job');
    });
  });
});

import { Mock } from 'vitest';
import { createNosanaHostsApi } from '../index.js';

describe('createNosanaHostsApi', () => {
  const api = createNosanaHostsApi({
    hostManager: global.TEST_MOCK_CLIENT,
  });

  describe('list', () => {
    it('should return the hosts list', async () => {
      const mockHosts = [{ address: 'node-1' }];
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockHosts,
        error: null,
      });

      const result = await api.list();
      expect(result).toEqual(mockHosts);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      await expect(api.list()).rejects.toThrow('Failed to list nodes');
    });
  });

  describe('get', () => {
    it('should return a specific host', async () => {
      const mockHost = { address: 'node-1', status: 'online' };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockHost,
        error: null,
      });

      const result = await api.get('node-1');
      expect(result).toEqual(mockHost);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(api.get('invalid')).rejects.toThrow('Failed to get node');
    });
  });

  describe('getAvailableGpus', () => {
    it('should return available GPUs', async () => {
      const mockGpus = [{ type: 'RTX 4090', count: 5 }];
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockGpus,
        error: null,
      });

      const result = await api.getAvailableGpus();
      expect(result).toEqual(mockGpus);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      await expect(api.getAvailableGpus()).rejects.toThrow('Failed to get available GPUs');
    });
  });

  describe('getQueuedNodes', () => {
    it('should return queued nodes', async () => {
      const mockQueued = [{ address: 'node-1', position: 1 }];
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockQueued,
        error: null,
      });

      const result = await api.getQueuedNodes();
      expect(result).toEqual(mockQueued);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      await expect(api.getQueuedNodes()).rejects.toThrow('Failed to get queued nodes');
    });
  });

  describe('getUptime', () => {
    it('should return host uptime', async () => {
      const mockUptime = { uptime: 99.9 };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockUptime,
        error: null,
      });

      const result = await api.getUptime('node-1');
      expect(result).toEqual(mockUptime);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(api.getUptime('invalid')).rejects.toThrow('Failed to get node uptime');
    });
  });

  describe('getByCountry', () => {
    it('should return nodes by country', async () => {
      const mockCountries = [{ country: 'US', count: 50 }];
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockCountries,
        error: null,
      });

      const result = await api.getByCountry();
      expect(result).toEqual(mockCountries);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      await expect(api.getByCountry()).rejects.toThrow('Failed to get nodes by country');
    });
  });
});

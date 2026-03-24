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

  describe('getSpecs', () => {
    it('should return host specs', async () => {
      const mockSpecs = { gpu: 'RTX 4090', vram: 24 };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockSpecs,
        error: null,
      });

      const result = await api.getSpecs('node-1');
      expect(result).toEqual(mockSpecs);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(api.getSpecs('invalid')).rejects.toThrow('Failed to get node specs');
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

  describe('getStats', () => {
    it('should return host stats', async () => {
      const mockStats = { totalNodes: 100, activeNodes: 80 };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockStats,
        error: null,
      });

      const result = await api.getStats();
      expect(result).toEqual(mockStats);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      await expect(api.getStats()).rejects.toThrow('Failed to get node stats');
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

      const result = await api.getUptime({ address: 'node-1' });
      expect(result).toEqual(mockUptime);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(api.getUptime({ address: 'invalid' })).rejects.toThrow('Failed to get node uptime');
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

  describe('getAvailableHosts', () => {
    it('should return available hosts', async () => {
      const mockAvailable = [{ address: 'node-1' }];
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockAvailable,
        error: null,
      });

      const result = await api.getAvailableHosts();
      expect(result).toEqual(mockAvailable);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      await expect(api.getAvailableHosts()).rejects.toThrow('Failed to get available hosts');
    });
  });

  describe('getFilters', () => {
    it('should return host filters', async () => {
      const mockFilters = { gpuTypes: ['RTX 4090'], regions: ['US'] };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockFilters,
        error: null,
      });

      const result = await api.getFilters();
      expect(result).toEqual(mockFilters);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      await expect(api.getFilters()).rejects.toThrow('Failed to get host filters');
    });
  });

  describe('getBenchmarkReport', () => {
    it('should return benchmark report', async () => {
      const mockReport = { score: 95 };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockReport,
        error: null,
      });

      const result = await api.getBenchmarkReport('node-1');
      expect(result).toEqual(mockReport);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(api.getBenchmarkReport('invalid')).rejects.toThrow('Failed to get benchmark report');
    });
  });

  describe('getTemplatePerformance', () => {
    it('should return template performance data', async () => {
      const mockPerf = { tokensPerSecond: 120 };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockPerf,
        error: null,
      });

      const result = await api.getTemplatePerformance('node-1');
      expect(result).toEqual(mockPerf);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(api.getTemplatePerformance('invalid')).rejects.toThrow('Failed to get template performance');
    });
  });

  describe('getBenchmarkSummary', () => {
    it('should return benchmark summary', async () => {
      const mockSummary = { avgScore: 90, totalNodes: 100 };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockSummary,
        error: null,
      });

      const result = await api.getBenchmarkSummary();
      expect(result).toEqual(mockSummary);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      await expect(api.getBenchmarkSummary()).rejects.toThrow('Failed to get benchmark summary');
    });
  });
});

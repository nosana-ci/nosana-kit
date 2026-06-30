import { Mock } from 'vitest';
import { createNosanaStatsApi } from '../index.js';

describe('createNosanaStatsApi', () => {
  const api = createNosanaStatsApi({
    blockchainIndexer: global.TEST_MOCK_CLIENT,
  });

  describe('get', () => {
    it('should return the latest stats', async () => {
      const mockStats = { totalJobs: 1000, totalNodes: 200 };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockStats,
        error: null,
      });

      const result = await api.get();
      expect(result).toEqual(mockStats);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      await expect(api.get()).rejects.toThrow('Error fetching stats');
    });
  });

  describe('getPrice', () => {
    it('should return the NOS price', async () => {
      const mockPrice = { price: 1.23 };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockPrice,
        error: null,
      });

      const result = await api.getPrice();
      expect(result).toEqual(mockPrice);
    });

    it('should pass query parameters', async () => {
      const mockPrice = { price: 1.20 };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockPrice,
        error: null,
      });

      const result = await api.getPrice({ date: '2025-01-01' });
      expect(result).toEqual(mockPrice);
      expect(global.TEST_MOCK_CLIENT.GET).toHaveBeenCalledWith('/stats/price', {
        params: { query: { date: '2025-01-01' } },
      });
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      await expect(api.getPrice()).rejects.toThrow('Error fetching NOS price');
    });
  });

  describe('getSpendingHistory', () => {
    it('should return spending history', async () => {
      const mockHistory = [{ date: '2025-01-01', amount: 100 }];
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockHistory,
        error: null,
      });

      const result = await api.getSpendingHistory({
        address: 'wallet-address',
        start_date: '2025-01-01',
      });
      expect(result).toEqual(mockHistory);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      await expect(
        api.getSpendingHistory({
          address: 'wallet-address',
          start_date: '2025-01-01',
        }),
      ).rejects.toThrow('Error fetching spending history');
    });
  });

  describe('getEarningHistory', () => {
    it('should return earning history', async () => {
      const mockHistory = [{ date: '2025-01-01', amount: 50 }];
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockHistory,
        error: null,
      });

      const result = await api.getEarningHistory({
        address: 'wallet-address',
        start_date: '2025-01-01',
      });
      expect(result).toEqual(mockHistory);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      await expect(
        api.getEarningHistory({
          address: 'wallet-address',
          start_date: '2025-01-01',
        }),
      ).rejects.toThrow('Error fetching earning history');
    });
  });
});

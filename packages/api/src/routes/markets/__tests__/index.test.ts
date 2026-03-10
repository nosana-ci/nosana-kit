import { Mock } from 'vitest';
import { createNosanaMarketsApi } from '../index.js';

describe('createNosanaMarketsApi', () => {
  describe('list', () => {
    it('should return the markets list', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: global.TEST_MOCK_MARKETS_LIST, error: null });

      const api = createNosanaMarketsApi({ blockchainIndexer: global.TEST_MOCK_CLIENT });
      const result = await api.list();

      expect(result).toEqual(global.TEST_MOCK_MARKETS_LIST);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: null, error: { message: 'Server error' } });

      const api = createNosanaMarketsApi({ blockchainIndexer: global.TEST_MOCK_CLIENT });

      await expect(api.list()).rejects.toThrow('Failed to fetch markets');
    });
  });

  describe('get', () => {
    it('should return the market', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: global.TEST_MOCK_MARKET, error: null });

      const api = createNosanaMarketsApi({ blockchainIndexer: global.TEST_MOCK_CLIENT });
      const result = await api.get('Dcwz62TisNbWuto6KJM2EGYGVKnHbdZGVGmgLASzsXy8');

      expect(result).toEqual(global.TEST_MOCK_MARKET);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: null, error: { message: 'Not found' } });

      const api = createNosanaMarketsApi({ blockchainIndexer: global.TEST_MOCK_CLIENT });

      await expect(api.get('invalid')).rejects.toThrow('Failed to fetch market');
    });
  });

  describe('getRequiredResources', () => {
    it('should return the required resources', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: global.TEST_MOCK_REQUIRED_RESOURCES, error: null });

      const api = createNosanaMarketsApi({ blockchainIndexer: global.TEST_MOCK_CLIENT });
      const result = await api.getRequiredResources('Dcwz62TisNbWuto6KJM2EGYGVKnHbdZGVGmgLASzsXy8');

      expect(result).toEqual(global.TEST_MOCK_REQUIRED_RESOURCES);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: null, error: { message: 'Not found' } });

      const api = createNosanaMarketsApi({ blockchainIndexer: global.TEST_MOCK_CLIENT });

      await expect(api.getRequiredResources('invalid')).rejects.toThrow('Failed to fetch required resources');
    });
  });
});

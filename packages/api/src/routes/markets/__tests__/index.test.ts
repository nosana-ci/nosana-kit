import { Mock } from 'vitest';
import { createNosanaMarketsApi } from '../index.js';

describe('createNosanaMarketsApi', () => {
  describe('list', () => {
    it('should return the markets list', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: global.TEST_MOCK_MARKETS_LIST,
        error: null,
      });

      const api = createNosanaMarketsApi({
        hostManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.list();

      expect(result).toEqual(global.TEST_MOCK_MARKETS_LIST);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      const api = createNosanaMarketsApi({
        hostManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.list()).rejects.toThrow('Failed to fetch markets');
    });
  });

  describe('get', () => {
    it('should return the market', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: global.TEST_MOCK_MARKET,
        error: null,
      });

      const api = createNosanaMarketsApi({
        hostManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.get(
        'Dcwz62TisNbWuto6KJM2EGYGVKnHbdZGVGmgLASzsXy8',
      );

      expect(result).toEqual(global.TEST_MOCK_MARKET);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const api = createNosanaMarketsApi({
        hostManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.get('invalid')).rejects.toThrow(
        'Failed to fetch market',
      );
    });
  });

  describe('getRequiredResources', () => {
    it('should return the required resources', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: global.TEST_MOCK_REQUIRED_RESOURCES,
        error: null,
      });

      const api = createNosanaMarketsApi({
        hostManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.getRequiredResources(
        'Dcwz62TisNbWuto6KJM2EGYGVKnHbdZGVGmgLASzsXy8',
      );

      expect(result).toEqual(global.TEST_MOCK_REQUIRED_RESOURCES);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const api = createNosanaMarketsApi({
        hostManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.getRequiredResources('invalid')).rejects.toThrow(
        'Failed to fetch required resources',
      );
    });
  });

  describe('getPrices', () => {
    it('should return market prices', async () => {
      const mockResponse = { price: 1.5 };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const api = createNosanaMarketsApi({
        hostManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.getPrices();

      expect(result).toEqual(mockResponse);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const api = createNosanaMarketsApi({
        hostManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.getPrices()).rejects.toThrow('Failed to fetch market prices');
    });
  });

  describe('getPrice', () => {
    it('should return NOS price', async () => {
      const mockResponse = { nos: 0.42 };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const api = createNosanaMarketsApi({
        hostManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.getPrice();

      expect(result).toEqual(mockResponse);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const api = createNosanaMarketsApi({
        hostManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.getPrice()).rejects.toThrow('Failed to fetch NOS price');
    });
  });

  describe('getDockerImages', () => {
    it('should return Docker images', async () => {
      const mockResponse = [{ image: 'tensorflow:latest' }];
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const api = createNosanaMarketsApi({
        hostManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.getDockerImages();

      expect(result).toEqual(mockResponse);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const api = createNosanaMarketsApi({
        hostManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.getDockerImages()).rejects.toThrow('Failed to fetch Docker images');
    });
  });
});

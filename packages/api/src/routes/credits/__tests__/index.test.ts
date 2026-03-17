import { Mock } from 'vitest';
import { createNosanaCreditsApi } from '../index.js';

describe('createNosanaCreditsApi', () => {
  describe('balance', () => {
    it('should return the balance', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: global.TEST_MOCK_BALANCE, error: null });

      const api = createNosanaCreditsApi(global.TEST_MOCK_CLIENT);
      const result = await api.balance();

      expect(result).toEqual(global.TEST_MOCK_BALANCE);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: null, error: { message: 'Unauthorized' } });

      const api = createNosanaCreditsApi(global.TEST_MOCK_CLIENT);

      await expect(api.balance()).rejects.toThrow('Failed to fetch balance');
    });
  });
});

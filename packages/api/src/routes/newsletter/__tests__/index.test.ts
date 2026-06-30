import { Mock } from 'vitest';
import { createNosanaNewsletterApi } from '../index.js';

describe('createNosanaNewsletterApi', () => {
  const api = createNosanaNewsletterApi({ clientManager: global.TEST_MOCK_CLIENT });

  describe('subscribe', () => {
    it('returns data', async () => {
      const ok = { subscribed: true };
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: ok, error: null });

      const result = await api.subscribe({ email: 'dev@nosana.io' } as never);
      expect(result).toEqual(ok);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Invalid email' },
      });

      await expect(api.subscribe({ email: 'x' } as never)).rejects.toThrow(
        'Failed to subscribe to newsletter',
      );
    });
  });
});

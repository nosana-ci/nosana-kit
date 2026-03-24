import { Mock } from 'vitest';
import { createNosanaAuthApi } from '../index.js';

const TEST_MESSAGE = 'hello';
const TEST_SIGNATURE = 'test-signature';
const TEST_SIGNATURE_WITH_TIME = 'test-signature-with-time';
const TEST_COOKIE_HEADER = 'cookie=abc';
const TEST_API_KEY = 'test-key-123';
const TEST_INVALID_API_KEY = 'bad-key';

describe('createNosanaAuthApi', () => {
  describe('signMessage', () => {
    it('should return the signature', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: { signature: TEST_SIGNATURE },
        error: null,
      });

      const api = createNosanaAuthApi(global.TEST_MOCK_CLIENT);
      const result = await api.signMessage(TEST_MESSAGE);

      expect(result).toBe(TEST_SIGNATURE);
      expect(global.TEST_MOCK_CLIENT.POST).toHaveBeenCalledWith(
        '/auth/sign-message/external',
        { body: { message: TEST_MESSAGE, includeTime: undefined } },
      );
    });

    it('should pass includeTime option', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: { signature: TEST_SIGNATURE_WITH_TIME },
        error: null,
      });

      const api = createNosanaAuthApi(global.TEST_MOCK_CLIENT);
      const result = await api.signMessage(TEST_MESSAGE, { includeTime: true });

      expect(result).toBe(TEST_SIGNATURE_WITH_TIME);
      expect(global.TEST_MOCK_CLIENT.POST).toHaveBeenCalledWith(
        '/auth/sign-message/external',
        { body: { message: TEST_MESSAGE, includeTime: true } },
      );
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Unauthorized' },
      });

      const api = createNosanaAuthApi(global.TEST_MOCK_CLIENT);
      await expect(api.signMessage(TEST_MESSAGE)).rejects.toThrow('Failed to sign message');
    });
  });

  describe('validateSession', () => {
    it('should return session validation result', async () => {
      const mockResponse = { valid: true, user: 'test-user' };
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const api = createNosanaAuthApi(global.TEST_MOCK_CLIENT);
      const result = await api.validateSession(TEST_COOKIE_HEADER);

      expect(result).toEqual(mockResponse);
      expect(global.TEST_MOCK_CLIENT.POST).toHaveBeenCalledWith(
        '/auth/validate-session',
        { body: { cookieHeader: TEST_COOKIE_HEADER } },
      );
    });

    it('should send empty body when no cookie header provided', async () => {
      const mockResponse = { valid: false };
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const api = createNosanaAuthApi(global.TEST_MOCK_CLIENT);
      const result = await api.validateSession();

      expect(result).toEqual(mockResponse);
      expect(global.TEST_MOCK_CLIENT.POST).toHaveBeenCalledWith(
        '/auth/validate-session',
        { body: {} },
      );
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Session expired' },
      });

      const api = createNosanaAuthApi(global.TEST_MOCK_CLIENT);
      await expect(api.validateSession()).rejects.toThrow('Failed to validate session');
    });
  });

  describe('validateApiKey', () => {
    it('should return API key validation result', async () => {
      const mockResponse = { valid: true, scopes: ['read'] };
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const api = createNosanaAuthApi(global.TEST_MOCK_CLIENT);
      const result = await api.validateApiKey(TEST_API_KEY);

      expect(result).toEqual(mockResponse);
      expect(global.TEST_MOCK_CLIENT.POST).toHaveBeenCalledWith(
        '/auth/validate-api-key',
        { body: { apiKey: TEST_API_KEY } },
      );
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Invalid API key' },
      });

      const api = createNosanaAuthApi(global.TEST_MOCK_CLIENT);
      await expect(api.validateApiKey(TEST_INVALID_API_KEY)).rejects.toThrow('Failed to validate API key');
    });
  });
});

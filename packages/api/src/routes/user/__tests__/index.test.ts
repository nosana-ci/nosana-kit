import { Mock } from 'vitest';
import { createNosanaUserApi } from '../index.js';

describe('createNosanaUserApi', () => {
  const api = createNosanaUserApi({
    clientManager: global.TEST_MOCK_CLIENT,
  });

  describe('apiKeys', () => {
    describe('create', () => {
      it('should create an API key', async () => {
        const mockKey = { id: 'key-1', key: 'nos_abc123' };
        (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
          data: mockKey,
          error: null,
        });

        const result = await api.apiKeys.create({ name: 'test-key' });
        expect(result).toEqual(mockKey);
      });

      test('when an error is returned, it should throw a formatted error', async () => {
        (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
          data: null,
          error: { message: 'Bad request' },
        });

        await expect(api.apiKeys.create({ name: '' })).rejects.toThrow('Failed to create API key');
      });
    });

    describe('list', () => {
      it('should return the API keys list', async () => {
        const mockKeys = [{ id: 'key-1', name: 'test-key' }];
        (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
          data: mockKeys,
          error: null,
        });

        const result = await api.apiKeys.list();
        expect(result).toEqual(mockKeys);
      });

      test('when an error is returned, it should throw a formatted error', async () => {
        (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
          data: null,
          error: { message: 'Unauthorized' },
        });

        await expect(api.apiKeys.list()).rejects.toThrow('Failed to list API keys');
      });
    });

    describe('get', () => {
      it('should return a specific API key', async () => {
        const mockKey = { id: 'key-1', name: 'test-key' };
        (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
          data: mockKey,
          error: null,
        });

        const result = await api.apiKeys.get('key-1');
        expect(result).toEqual(mockKey);
      });

      test('when an error is returned, it should throw a formatted error', async () => {
        (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        });

        await expect(api.apiKeys.get('invalid')).rejects.toThrow('Failed to get API key');
      });
    });

    describe('update', () => {
      it('should update an API key', async () => {
        const mockKey = { id: 'key-1', name: 'updated-key' };
        (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
          data: mockKey,
          error: null,
        });

        const result = await api.apiKeys.update('key-1', { name: 'updated-key' });
        expect(result).toEqual(mockKey);
      });

      test('when an error is returned, it should throw a formatted error', async () => {
        (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
          data: null,
          error: { message: 'Bad request' },
        });

        await expect(api.apiKeys.update('key-1', { name: '' })).rejects.toThrow('Failed to update API key');
      });
    });

    describe('delete', () => {
      it('should delete an API key', async () => {
        (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
          data: { success: true },
          error: null,
        });

        await expect(api.apiKeys.delete('key-1')).resolves.not.toThrow();
      });

      test('when an error is returned, it should throw a formatted error', async () => {
        (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        });

        await expect(api.apiKeys.delete('invalid')).rejects.toThrow('Failed to delete API key');
      });
    });
  });
});

import { Mock } from 'vitest';
import { createNosanaTemplatesApi } from '../index.js';

describe('createNosanaTemplatesApi', () => {
  const api = createNosanaTemplatesApi({
    clientManager: global.TEST_MOCK_CLIENT,
  });

  describe('list', () => {
    it('should return the templates list', async () => {
      const mockTemplates = [{ id: 'tpl-1', name: 'Template 1' }];
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockTemplates,
        error: null,
      });

      const result = await api.list();
      expect(result).toEqual(mockTemplates);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      await expect(api.list()).rejects.toThrow('Failed to list templates');
    });
  });

  describe('getAllGrouped', () => {
    it('should return grouped templates', async () => {
      const mockGrouped = { gpu: [{ id: 'tpl-1' }], cpu: [{ id: 'tpl-2' }] };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockGrouped,
        error: null,
      });

      const result = await api.getAllGrouped();
      expect(result).toEqual(mockGrouped);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      await expect(api.getAllGrouped()).rejects.toThrow('Failed to get grouped templates');
    });
  });

  describe('get', () => {
    it('should return a specific template', async () => {
      const mockTemplate = { id: 'tpl-1', name: 'Template 1' };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockTemplate,
        error: null,
      });

      const result = await api.get('tpl-1');
      expect(result).toEqual(mockTemplate);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(api.get('invalid')).rejects.toThrow('Failed to get template');
    });
  });

  describe('getVariant', () => {
    it('should return a specific template variant', async () => {
      const mockVariant = { id: 'var-1', templateId: 'tpl-1' };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockVariant,
        error: null,
      });

      const result = await api.getVariant('tpl-1', 'var-1');
      expect(result).toEqual(mockVariant);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(api.getVariant('tpl-1', 'invalid')).rejects.toThrow('Failed to get template variant');
    });
  });
});

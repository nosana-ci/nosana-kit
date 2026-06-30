import { Mock } from 'vitest';
import { createNosanaBenchmarksApi } from '../index.js';

const api = createNosanaBenchmarksApi({ hostManager: global.TEST_MOCK_CLIENT });
const ok = { ok: true };

const getCases: Array<[string, () => Promise<unknown>, string]> = [
  ['getRecent', () => api.getRecent(), 'Failed to get recent benchmarks'],
  ['getMarketMetricAggregates', () => api.getMarketMetricAggregates(), 'Failed to get market metric aggregates'],
  ['getVersion', () => api.getVersion(), 'Failed to get benchmark version'],
  ['getThresholds', () => api.getThresholds(), 'Failed to get benchmark thresholds'],
  ['getMetrics', () => api.getMetrics(), 'Failed to get benchmark metrics'],
  ['getOperations', () => api.getOperations(), 'Failed to get benchmark operations'],
  ['getMetricProcessors', () => api.getMetricProcessors(), 'Failed to get metric processors'],
  ['getMarketThresholds', () => api.getMarketThresholds(), 'Failed to get market thresholds'],
  ['getTemplatesConfig', () => api.getTemplatesConfig(), 'Failed to get benchmark templates config'],
  ['getTemplatesRefresh', () => api.getTemplatesRefresh(), 'Failed to refresh benchmark templates'],
];

const postCases: Array<[string, () => Promise<unknown>, string]> = [
  ['getPrediction', () => api.getPrediction('id', {} as never), 'Failed to get benchmark prediction'],
  ['submitResults', () => api.submitResults('id', {} as never), 'Failed to submit benchmark results'],
  ['seed', () => api.seed('id', {} as never), 'Failed to seed benchmark'],
];

describe('createNosanaBenchmarksApi', () => {
  describe.each(getCases)('%s', (_name, call, errMsg) => {
    it('returns data', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: ok, error: null });
      expect(await call()).toEqual(ok);
    });
    it('throws a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: null, error: { message: 'x' } });
      await expect(call()).rejects.toThrow(errMsg);
    });
  });

  describe.each(postCases)('%s', (_name, call, errMsg) => {
    it('returns data', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: ok, error: null });
      expect(await call()).toEqual(ok);
    });
    it('throws a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: null, error: { message: 'x' } });
      await expect(call()).rejects.toThrow(errMsg);
    });
  });
});

import { Mock } from 'vitest';
import { createNosanaPaymentsApi } from '../index.js';

const api = createNosanaPaymentsApi({ clientManager: global.TEST_MOCK_CLIENT });
const ok = { ok: true };

// [name, httpVerb, call, errorMessage]
const cases: Array<['GET' | 'POST' | 'PUT' | 'DELETE', string, () => Promise<unknown>, string]> = [
  ['GET', 'listMethods', () => api.listMethods(), 'Failed to list payment methods'],
  ['POST', 'addMethod', () => api.addMethod({} as never), 'Failed to add payment method'],
  ['PUT', 'setDefaultMethod', () => api.setDefaultMethod('pm_1'), 'Failed to set default payment method'],
  ['DELETE', 'deleteMethod', () => api.deleteMethod('pm_1'), 'Failed to delete payment method'],
  ['POST', 'createPaymentIntent', () => api.createPaymentIntent({} as never), 'Failed to create payment intent'],
  ['GET', 'listPurchases', () => api.listPurchases(), 'Failed to list purchases'],
];

describe('createNosanaPaymentsApi', () => {
  describe.each(cases)('%s %s', (verb, _name, call, errMsg) => {
    it('returns data', async () => {
      (global.TEST_MOCK_CLIENT[verb] as Mock).mockResolvedValue({ data: ok, error: null });
      expect(await call()).toEqual(ok);
    });
    it('throws a formatted error', async () => {
      (global.TEST_MOCK_CLIENT[verb] as Mock).mockResolvedValue({ data: null, error: { message: 'x' } });
      await expect(call()).rejects.toThrow(errMsg);
    });
  });
});

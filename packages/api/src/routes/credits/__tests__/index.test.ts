import { Mock } from 'vitest';
import { createNosanaCreditsApi } from '../index.js';

const TEST_PROMO_CODE = 'PROMO-CODE';
const TEST_INVALID_CODE = 'BAD';
const TEST_INVITATION_TOKEN = 'abc';
const TEST_INVALID_INVITATION_TOKEN = 'bad';
const TEST_CLAIM_TOKEN = 'token-123';
const TEST_USED_TOKEN = 'used';

describe('createNosanaCreditsApi', () => {
  describe('balance', () => {
    it('should return the balance', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: global.TEST_MOCK_BALANCE,
        error: null,
      });

      const api = createNosanaCreditsApi({
        clientManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.balance();

      expect(result).toEqual(global.TEST_MOCK_BALANCE);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Unauthorized' },
      });

      const api = createNosanaCreditsApi({
        clientManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.balance()).rejects.toThrow('Failed to fetch balance');
    });
  });

  describe('claim', () => {
    it('should return claim result', async () => {
      const mockResponse = { success: true };
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const api = createNosanaCreditsApi({
        clientManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.claim(TEST_PROMO_CODE);

      expect(result).toEqual(mockResponse);
      expect(global.TEST_MOCK_CLIENT.POST).toHaveBeenCalledWith(
        '/credits/claim',
        { body: { code: TEST_PROMO_CODE } },
      );
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Invalid code' },
      });

      const api = createNosanaCreditsApi({
        clientManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.claim(TEST_INVALID_CODE)).rejects.toThrow('Failed to claim credits');
    });
  });

  describe('request', () => {
    it('should return request result', async () => {
      const mockResponse = { requested: true };
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const api = createNosanaCreditsApi({
        clientManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.request();

      expect(result).toEqual(mockResponse);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Rate limited' },
      });

      const api = createNosanaCreditsApi({
        clientManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.request()).rejects.toThrow('Failed to request credits');
    });
  });

  describe('checkEligibility', () => {
    it('should return eligibility result', async () => {
      const mockResponse = { eligible: true };
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const api = createNosanaCreditsApi({
        clientManager: global.TEST_MOCK_CLIENT,
      });
      const result = await api.checkEligibility();

      expect(result).toEqual(mockResponse);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const api = createNosanaCreditsApi({
        clientManager: global.TEST_MOCK_CLIENT,
      });

      await expect(api.checkEligibility()).rejects.toThrow('Failed to check eligibility');
    });
  });

  describe('invitations', () => {
    describe('get', () => {
      it('should return invitation data', async () => {
        const mockResponse = { token: 'abc', status: 'pending' };
        (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
          data: mockResponse,
          error: null,
        });

        const api = createNosanaCreditsApi({
          clientManager: global.TEST_MOCK_CLIENT,
        });
        const result = await api.invitations.get(TEST_INVITATION_TOKEN);

        expect(result).toEqual(mockResponse);
        expect(global.TEST_MOCK_CLIENT.GET).toHaveBeenCalledWith(
          '/credits/invitations/{token}',
          { params: { path: { token: TEST_INVITATION_TOKEN } } },
        );
      });

      test('when an error is returned, it should throw a formatted error', async () => {
        (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        });

        const api = createNosanaCreditsApi({
          clientManager: global.TEST_MOCK_CLIENT,
        });

        await expect(api.invitations.get(TEST_INVALID_INVITATION_TOKEN)).rejects.toThrow('Failed to get invitation');
      });
    });

    describe('claim', () => {
      it('should return claim result', async () => {
        const mockResponse = { claimed: true };
        (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
          data: mockResponse,
          error: null,
        });

        const api = createNosanaCreditsApi({
          clientManager: global.TEST_MOCK_CLIENT,
        });
        const result = await api.invitations.claim(TEST_CLAIM_TOKEN);

        expect(result).toEqual(mockResponse);
        expect(global.TEST_MOCK_CLIENT.POST).toHaveBeenCalledWith(
          '/credits/invitations/{token}/claim',
          { params: { path: { token: TEST_CLAIM_TOKEN } }, body: undefined },
        );
      });

      test('when an error is returned, it should throw a formatted error', async () => {
        (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
          data: null,
          error: { message: 'Already claimed' },
        });

        const api = createNosanaCreditsApi({
          clientManager: global.TEST_MOCK_CLIENT,
        });

        await expect(api.invitations.claim(TEST_USED_TOKEN)).rejects.toThrow('Failed to claim invitation');
      });
    });
  });

  const historyApi = createNosanaCreditsApi({ clientManager: global.TEST_MOCK_CLIENT });
  const extra: Array<[string, () => Promise<unknown>, string]> = [
    ['getSpendingHistory', () => historyApi.getSpendingHistory({ start_date: '2025-01-01' } as never), 'Failed to fetch credit spending history'],
    ['getTransactions', () => historyApi.getTransactions({ limit: 10, offset: 0 } as never), 'Failed to list credit transactions'],
  ];

  describe.each(extra)('%s', (_name, call, errMsg) => {
    it('returns data', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: { ok: true }, error: null });
      expect(await call()).toEqual({ ok: true });
    });
    it('throws a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: null, error: { message: 'x' } });
      await expect(call()).rejects.toThrow(errMsg);
    });
  });
});

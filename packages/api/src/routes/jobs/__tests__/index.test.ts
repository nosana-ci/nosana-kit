import { Mock } from 'vitest';
import { createNosanaJobsApi } from '../index.js';

describe('createNosanaJobsApi', () => {
  describe('get', () => {
    it('should return the job', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: global.TEST_MOCK_JOB, error: null });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);
      const result = await api.get('4XGB9rCfsM4QjMaGDCekF42izsJzYzGftg2xxMReWkyn');

      expect(result).toEqual(global.TEST_MOCK_JOB);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue({ data: null, error: { message: 'Not found' } });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);

      await expect(api.get('invalid')).rejects.toThrow('Failed to get job');
    });
  });

  describe('list', () => {
    it('should return the created job response', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: global.TEST_MOCK_CREATE_JOB_RESPONSE, error: null });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);
      const result = await api.list(global.TEST_CREATE_JOB_REQUEST);

      expect(result).toEqual(global.TEST_MOCK_CREATE_JOB_RESPONSE);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: null, error: { message: 'Insufficient credits' } });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);

      await expect(api.list(global.TEST_CREATE_JOB_REQUEST)).rejects.toThrow('Failed to list job');
    });

    it('should not attach an Idempotency-Key header when no key is provided', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: global.TEST_MOCK_CREATE_JOB_RESPONSE, error: null });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);
      await api.list(global.TEST_CREATE_JOB_REQUEST);

      const [, options] = (global.TEST_MOCK_CLIENT.POST as Mock).mock.calls[0];
      expect(options.headers).toBeUndefined();
    });

    it('should attach the Idempotency-Key header when a key is provided', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: global.TEST_MOCK_CREATE_JOB_RESPONSE, error: null });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);
      await api.list(global.TEST_CREATE_JOB_REQUEST, { idempotencyKey: 'idem-list-1' });

      const [path, options] = (global.TEST_MOCK_CLIENT.POST as Mock).mock.calls[0];
      expect(path).toEqual('/api/jobs/list');
      expect(options.headers).toEqual({ 'Idempotency-Key': 'idem-list-1' });
    });

    test('it surfaces the HTTP status and Retry-After on a coded 409 control response', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({
        data: null,
        error: { code: 'IDEMPOTENCY_KEY_IN_PROGRESS', message: 'In progress' },
        response: new Response(null, { status: 409, headers: { 'Retry-After': '5' } }),
      });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);

      await expect(api.list(global.TEST_CREATE_JOB_REQUEST)).rejects.toMatchObject({
        code: 'IDEMPOTENCY_KEY_IN_PROGRESS',
        statusCode: 409,
        retryAfter: 5,
      });
    });
  });

  describe('extend', () => {
    it('should return the extended job response', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: global.TEST_MOCK_EXTEND_JOB_RESPONSE, error: null });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);
      const result = await api.extend(global.TEST_EXTEND_JOB_REQUEST);

      expect(result).toEqual(global.TEST_MOCK_EXTEND_JOB_RESPONSE);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: null, error: { message: 'Job not found' } });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);

      await expect(api.extend(global.TEST_EXTEND_JOB_REQUEST)).rejects.toThrow('Failed to extend job');
    });

    it('should attach the Idempotency-Key header when a key is provided', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: global.TEST_MOCK_EXTEND_JOB_RESPONSE, error: null });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);
      await api.extend(global.TEST_EXTEND_JOB_REQUEST, { idempotencyKey: 'idem-extend-1' });

      const [path, options] = (global.TEST_MOCK_CLIENT.POST as Mock).mock.calls[0];
      expect(path).toEqual('/api/jobs/{address}/extend');
      expect(options.headers).toEqual({ 'Idempotency-Key': 'idem-extend-1' });
    });
  });

  describe('stop', () => {
    it('should return the stop job response', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: global.TEST_MOCK_STOP_JOB_RESPONSE, error: null });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);
      const result = await api.stop('A22xnkSkpBd4a7ExfwZnfFpUbMc1zRBT6NyzVHzf1S6Q');

      expect(result).toEqual(global.TEST_MOCK_STOP_JOB_RESPONSE);
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: null, error: { message: 'Cannot stop' } });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);

      await expect(api.stop('invalid')).rejects.toThrow('Failed to stop job');
    });

    it('should attach the Idempotency-Key header when a key is provided', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: global.TEST_MOCK_STOP_JOB_RESPONSE, error: null });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);
      await api.stop('A22xnkSkpBd4a7ExfwZnfFpUbMc1zRBT6NyzVHzf1S6Q', { idempotencyKey: 'idem-stop-1' });

      const [path, options] = (global.TEST_MOCK_CLIENT.POST as Mock).mock.calls[0];
      expect(path).toEqual('/api/jobs/{address}/stop');
      expect(options.headers).toEqual({ 'Idempotency-Key': 'idem-stop-1' });
    });
  });

  describe('batch', () => {
    const BATCH_RESPONSE = {
      items: [
        { index: 0, status: 'confirmed', job: 'JobAddr1', run: 'RunAddr1' },
        { index: 1, status: 'expired' },
      ],
    };

    it('listBatch posts to the batch endpoint with the required Idempotency-Key and returns items', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: BATCH_RESPONSE, error: null });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);
      const request = { jobs: [{ ipfsHash: 'Qm...', market: 'MarketAddr' }] };
      const result = await api.listBatch(request, { idempotencyKey: 'batch-list-1' });

      const [path, options] = (global.TEST_MOCK_CLIENT.POST as Mock).mock.calls[0];
      expect(path).toEqual('/api/jobs/list/batch');
      expect(options.body).toEqual(request);
      expect(options.headers).toEqual({ 'Idempotency-Key': 'batch-list-1' });
      expect(result).toEqual(BATCH_RESPONSE);
    });

    it('extendBatch posts to the batch endpoint with the key', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: BATCH_RESPONSE, error: null });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);
      await api.extendBatch({ jobs: [{ jobAddress: 'JobAddr1', seconds: 600 }] }, { idempotencyKey: 'batch-extend-1' });

      const [path, options] = (global.TEST_MOCK_CLIENT.POST as Mock).mock.calls[0];
      expect(path).toEqual('/api/jobs/extend/batch');
      expect(options.headers).toEqual({ 'Idempotency-Key': 'batch-extend-1' });
    });

    it('stopBatch posts to the batch endpoint with the key', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: BATCH_RESPONSE, error: null });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);
      await api.stopBatch({ jobs: [{ jobAddress: 'JobAddr1' }] }, { idempotencyKey: 'batch-stop-1' });

      const [path, options] = (global.TEST_MOCK_CLIENT.POST as Mock).mock.calls[0];
      expect(path).toEqual('/api/jobs/stop/batch');
      expect(options.headers).toEqual({ 'Idempotency-Key': 'batch-stop-1' });
    });

    test('when an error is returned, it should throw a formatted error', async () => {
      (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue({ data: null, error: { message: 'Idempotency-Key required' } });

      const api = createNosanaJobsApi(global.TEST_MOCK_CLIENT);

      await expect(
        api.listBatch({ jobs: [] }, { idempotencyKey: 'batch-list-err' }),
      ).rejects.toThrow('Failed to list job batch');
    });
  });
});

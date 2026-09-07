import { Mock } from 'vitest';
import { createNosanaNodeApi } from '../index.js';
import { JOB, NODE, failed, nodeApi, ok } from './fixtures.js';

const job = () => nodeApi().job(JOB);

describe('node api', () => {
  it('addresses the node under the network domain and refuses non-addresses', () => {
    expect(nodeApi().url).toBe(`https://${NODE}.node.k8s.dev.nos.ci`);
    expect(nodeApi().address).toBe(NODE);
    expect(() => createNosanaNodeApi({ environment: 'devnet', authParams: undefined })('evil.test/')).toThrow(
      'Invalid node address',
    );
  });

  it('honours a node_domain override', () => {
    const api = createNosanaNodeApi({
      environment: 'mainnet',
      authParams: undefined,
      options: { node_domain: 'nodes.example' },
    });
    expect(api(NODE).url).toBe(`https://${NODE}.nodes.example`);
  });

  it('reads public node info', async () => {
    (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue(ok({ state: 'running', info: {}, resources: {} }));
    await expect(nodeApi().info()).resolves.toMatchObject({ state: 'running' });
    expect(global.TEST_MOCK_CLIENT.GET).toHaveBeenCalledWith('/node/info');
  });
});

describe('node job api', () => {
  const definition = { version: '0.1', type: 'container', ops: [] };

  it('reads the definition and the results', async () => {
    (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue(ok(definition));
    await expect(job().definition()).resolves.toEqual(definition);
    expect(global.TEST_MOCK_CLIENT.GET).toHaveBeenCalledWith('/job/{job}/job-definition', {
      params: { path: { job: JOB } },
    });

    (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue(ok({ status: 'done' }));
    await expect(job().results()).resolves.toEqual({ status: 'done' });
  });

  it('sends a definition as JSON and reads the text acknowledgement', async () => {
    (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue(ok('Job definition received'));
    await expect(job().setDefinition(definition as never)).resolves.toBeUndefined();
    expect(global.TEST_MOCK_CLIENT.POST).toHaveBeenCalledWith('/job/{job}/job-definition', {
      params: { path: { job: JOB } },
      body: definition,
      parseAs: 'text',
    });
  });

  it('reads operation and group status', async () => {
    (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue(ok({ worker: 'running' }));

    await expect(job().operations()).resolves.toEqual({ worker: 'running' });
    await job().operation('worker');
    await job().group();
    await job().group('setup');

    expect((global.TEST_MOCK_CLIENT.GET as Mock).mock.calls.map(([path, init]) => [path, init.params.path])).toEqual([
      ['/job/{job}/ops', { job: JOB }],
      ['/job/{job}/ops/{op}', { job: JOB, op: 'worker' }],
      ['/job/{job}/group/current', { job: JOB }],
      ['/job/{job}/group/{group}', { job: JOB, group: 'setup' }],
    ]);
  });

  it('restarts and stops groups, operations and the job itself', async () => {
    (global.TEST_MOCK_CLIENT.POST as Mock).mockResolvedValue(ok({ message: 'ok' }));

    await job().restartGroup('setup');
    await job().restartOperation('setup', 'worker');
    await job().stopGroup('setup');
    await job().stopOperation('setup', 'worker');
    await job().stop();

    expect((global.TEST_MOCK_CLIENT.POST as Mock).mock.calls.map(([path]) => path)).toEqual([
      '/job/{job}/group/{group}/restart',
      '/job/{job}/group/{group}/operation/{op}/restart',
      '/job/{job}/group/{group}/stop',
      '/job/{job}/group/{group}/operation/{op}/stop',
      '/job/{job}/stop',
    ]);
    expect((global.TEST_MOCK_CLIENT.POST as Mock).mock.calls[1][1].params.path).toEqual({
      job: JOB,
      group: 'setup',
      op: 'worker',
    });
    expect((global.TEST_MOCK_CLIENT.POST as Mock).mock.calls[4][1].parseAs).toBe('text');
  });

  it('reads endpoints and stats with a query', async () => {
    (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue(ok({ urls: {}, status: 'ONLINE' }));
    await expect(job().endpoints()).resolves.toEqual({ urls: {}, status: 'ONLINE' });

    (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue(ok([]));
    await job().stats({ interval: 5, start: 1, end: 2 });
    expect(global.TEST_MOCK_CLIENT.GET).toHaveBeenLastCalledWith('/job/{job}/stats', {
      params: { path: { job: JOB }, query: { interval: 5, start: 1, end: 2 } },
    });
  });

  it('turns node failures into formatted errors', async () => {
    (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue(failed(400, 'invalid job id'));
    await expect(job().operations()).rejects.toThrow('Failed to get operations');

    (global.TEST_MOCK_CLIENT.GET as Mock).mockResolvedValue(failed(404, { error: 'Not found' }));
    await expect(job().endpoints()).rejects.toMatchObject({ statusCode: 404 });
  });
});

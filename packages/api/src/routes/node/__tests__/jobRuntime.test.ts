import createClient from 'openapi-fetch';
import { Mock } from 'vitest';

import { createMockClient } from '../../../../tests/mockFactory.js';
import { SIDECAR_RECHECK_MS } from '../jobRuntime.js';
import { FakeWebSocket, JOB, nodeApi, NODE, ok, settle, stubSidecar } from './fixtures.js';

const NODE_URL = `https://${NODE}.node.k8s.dev.nos.ci`;
const SIDECAR_URL = `https://${JOB}.node.k8s.dev.nos.ci`;

let clients: Record<string, ReturnType<typeof createMockClient>>;

// One mock client per base URL, so a call shows whether it reached the node or the sidecar.
beforeEach(() => {
  clients = { [NODE_URL]: createMockClient(), [SIDECAR_URL]: createMockClient() };
  (createClient as Mock).mockImplementation(({ baseUrl }: { baseUrl: string }) => clients[baseUrl]);
  for (const client of Object.values(clients)) client.GET.mockResolvedValue(ok([]));
});

afterEach(() => {
  (createClient as Mock).mockImplementation(() => global.TEST_MOCK_CLIENT);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('job runtime sidecar', () => {
  it('sends stats and SSH keys to the sidecar, checking for it once', async () => {
    const check = stubSidecar(true);
    clients[SIDECAR_URL].GET.mockResolvedValueOnce(ok([])).mockResolvedValueOnce(ok({ keys: [] }));
    const job = nodeApi().job(JOB);

    await job.stats();
    await job.ssh.keys();

    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledWith(`${SIDECAR_URL}/`, expect.anything());
    expect(clients[SIDECAR_URL].GET.mock.calls.map(([path]) => path)).toEqual([
      '/job/{job}/stats',
      '/job/{job}/ssh/keys',
    ]);
    expect(clients[NODE_URL].GET).not.toHaveBeenCalled();
  });

  it('keeps every other route on the node', async () => {
    const check = stubSidecar(true);

    await nodeApi().job(JOB).operations();

    expect(clients[NODE_URL].GET).toHaveBeenCalledWith('/job/{job}/ops', { params: { path: { job: JOB } } });
    expect(check).not.toHaveBeenCalled();
  });

  it('falls back to the node when the job has no sidecar', async () => {
    stubSidecar(false);

    await nodeApi().job(JOB).stats();

    expect(clients[NODE_URL].GET).toHaveBeenCalledWith('/job/{job}/stats', expect.anything());
    expect(clients[SIDECAR_URL].GET).not.toHaveBeenCalled();
  });

  it.each([
    ['answers for another job', () => Promise.resolve(new Response(JSON.stringify('another-job')))],
    ['cannot be reached', () => Promise.reject(new TypeError('fetch failed'))],
  ])('falls back to the node when the address %s', async (_, answer) => {
    vi.stubGlobal('fetch', vi.fn(answer));

    await nodeApi().job(JOB).stats();

    expect(clients[NODE_URL].GET).toHaveBeenCalled();
    expect(clients[SIDECAR_URL].GET).not.toHaveBeenCalled();
  });

  it('checks again for a missing sidecar once a while has passed', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(0);
    const missing = stubSidecar(false);
    const job = nodeApi().job(JOB);

    await job.stats();
    now.mockReturnValue(SIDECAR_RECHECK_MS - 1);
    await job.stats();
    expect(missing).toHaveBeenCalledTimes(1);
    expect(clients[NODE_URL].GET).toHaveBeenCalledTimes(2);

    const found = stubSidecar(true);
    now.mockReturnValue(SIDECAR_RECHECK_MS);
    await job.stats();
    expect(found).toHaveBeenCalledTimes(1);
    expect(clients[SIDECAR_URL].GET).toHaveBeenCalledTimes(1);
  });

  it('opens the log socket on the sidecar', async () => {
    stubSidecar(true);
    const urls: string[] = [];

    nodeApi()
      .job(JOB)
      .logs({ onData: vi.fn() }, undefined, {
        webSocketFactory: (url) => {
          urls.push(url);
          return new FakeWebSocket() as unknown as WebSocket;
        },
      });
    await settle();

    expect(urls).toEqual([`wss://${JOB}.node.k8s.dev.nos.ci`]);
  });

  it('does not open a stream closed before the check is done', async () => {
    stubSidecar(true);
    const webSocketFactory = vi.fn();

    nodeApi().job(JOB).logs({ onData: vi.fn() }, undefined, { webSocketFactory }).close();
    await settle();

    expect(webSocketFactory).not.toHaveBeenCalled();
  });
});

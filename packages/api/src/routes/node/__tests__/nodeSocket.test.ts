import { FakeWebSocket, JOB, NODE, nodeApi } from './fixtures.js';

import type { SignerAuth } from '../../../types.js';

function fixture(auth?: SignerAuth | null) {
  const socket = new FakeWebSocket();
  const urls: string[] = [];
  const job = nodeApi(auth).job(JOB);
  const options = {
    webSocketFactory: (url: string) => {
      urls.push(url);
      return socket as unknown as WebSocket;
    },
  };
  const message = (data: unknown) => socket.onmessage?.({ data } as MessageEvent);
  return { job, socket, urls, options, message };
}

describe('node job sockets', () => {
  it('streams task logs: signed handshake first, then parsed frames', async () => {
    const { job, socket, urls, options, message } = fixture();
    const logs: unknown[] = [];
    const onOpen = vi.fn();

    const subscription = job.logs({ onData: (log) => logs.push(log), onOpen }, { group: 'setup' }, options);
    expect(urls).toEqual([`wss://${NODE}.node.k8s.dev.nos.ci`]);

    await socket.onopen?.(new Event('open'));
    expect(JSON.parse(socket.sent[0])).toEqual({
      path: '/flog',
      header: 'NosanaApiAuthentication:signed',
      body: { jobAddress: JOB, group: 'setup' },
    });
    expect(onOpen).toHaveBeenCalled();

    const log = { opId: 'worker', group: 'setup', type: 'stdout', timestamp: 1, message: 'hi' };
    message(JSON.stringify({ path: 'flog', data: JSON.stringify(log) }));
    message(JSON.stringify({ path: 'flog', data: 'not json' }));
    message('garbage');
    expect(logs).toEqual([log]);

    subscription.close();
    expect(socket.readyState).toBe(3);
  });

  it('passes state frames through as they are', async () => {
    const { job, socket, options, message } = fixture();
    const states: unknown[] = [];

    job.status({ onData: (state) => states.push(state) }, options);
    await socket.onopen?.(new Event('open'));
    expect(JSON.parse(socket.sent[0]).path).toBe('/status');

    message(JSON.stringify({ path: 'state', data: { job: JOB, status: 'running' } }));
    expect(states).toEqual([{ job: JOB, status: 'running' }]);
  });

  it('refuses to open when nothing can sign the handshake', () => {
    const { job, urls, options } = fixture(null);

    expect(() => job.logs({ onData: vi.fn() }, undefined, options)).toThrow('wallet or authorization provider');
    expect(urls).toEqual([]);
  });

  it('lets a provider sign the handshake instead of the client', async () => {
    const { job, socket, options } = fixture(null);

    job.logs({ onData: vi.fn() }, undefined, {
      ...options,
      authorizationProvider: async (message) => `${message}:by-deployment`,
    });
    await socket.onopen?.(new Event('open'));

    expect(JSON.parse(socket.sent[0]).header).toBe('NosanaApiAuthentication:by-deployment');
  });
});

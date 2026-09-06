import bs58 from 'bs58';
import nacl from 'tweetnacl';
import {
  buildTerminalAuthorizationMessage,
  createTerminalAuthorizationGrant,
  TERMINAL_AUTHORIZATION_MAX_TTL_MS,
} from '../actions/terminal/grant.js';
import { FakeWebSocket, JOB, NODE, nodeApi } from './fixtures.js';

import type { SignerAuth } from '../../../types.js';
import type { NodeTerminalOptions, TerminalStatus } from '../types.js';

const owner = nacl.sign.keyPair();
const sign = async (message: string) =>
  `${message}:${bs58.encode(nacl.sign.detached(new TextEncoder().encode(message), owner.secretKey))}`;
const signer: SignerAuth = { identifier: 'me', generate: sign, solana: {} as never };

function fixture(auth: SignerAuth | null = signer) {
  const socket = new FakeWebSocket();
  const urls: string[] = [];
  const statuses: Array<[TerminalStatus, string?]> = [];
  const onData = vi.fn();
  const onExit = vi.fn();
  const job = nodeApi(auth).job(JOB);
  const connect = (overrides: Partial<NodeTerminalOptions> = {}) =>
    job.terminal({
      cols: 80,
      rows: 24,
      webSocketFactory: (url) => {
        urls.push(url);
        return socket as unknown as WebSocket;
      },
      onData,
      onExit,
      onStatus: (status, detail) => statuses.push(detail === undefined ? [status] : [status, detail]),
      ...overrides,
    });
  const message = (data: unknown) => socket.onmessage?.({ data } as MessageEvent);
  return { socket, urls, statuses, onData, onExit, connect, message };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('terminal authorization grant', () => {
  it('builds the exact message the node verifies', () => {
    expect(
      buildTerminalAuthorizationMessage({
        job: JOB,
        node: NODE,
        expiresAt: '2026-08-21T12:04:00.000Z',
        op: 'hello-server',
        network: 'devnet',
      }),
    ).toBe(
      [
        'Nosana Terminal Authorization v1',
        '',
        `job: ${JOB}`,
        `node: ${NODE}`,
        'expiresAt: 2026-08-21T12:04:00.000Z',
        'op: hello-server',
        'network: devnet',
        'audience: nosana-web-terminal',
      ].join('\n'),
    );
  });

  it('signs with the standard authorization string and carries the raw signature as base64', async () => {
    const now = new Date('2026-08-21T12:00:00.000Z');
    const grant = await createTerminalAuthorizationGrant({ job: JOB, node: NODE, network: 'devnet', now, authorize: sign });

    expect(grant.expiresAt).toBe('2026-08-21T12:04:00.000Z');
    const signature = Uint8Array.from(atob(grant.signature), (c) => c.charCodeAt(0));
    expect(nacl.sign.detached.verify(new TextEncoder().encode(grant.message), signature, owner.publicKey)).toBe(true);
  });

  it('rejects an authorization that does not sign the grant message', async () => {
    await expect(
      createTerminalAuthorizationGrant({ job: JOB, node: NODE, network: 'devnet', authorize: async () => 'x:y' }),
    ).rejects.toThrow('Failed to authenticate message');
  });

  it.each([0, TERMINAL_AUTHORIZATION_MAX_TTL_MS + 1])('rejects a TTL of %s ms', async (ttlMs) => {
    await expect(
      createTerminalAuthorizationGrant({ job: JOB, node: NODE, network: 'devnet', ttlMs, authorize: sign }),
    ).rejects.toThrow('TTL');
  });

  it('rejects an operation selector that could alter the message', async () => {
    await expect(
      createTerminalAuthorizationGrant({ job: JOB, node: NODE, network: 'devnet', op: 'worker; rm', authorize: sign }),
    ).rejects.toThrow('operation selector');
  });
});

describe('node job terminal', () => {
  it('signs the grant, sends the handshake and relays frames both ways', async () => {
    const { socket, urls, statuses, onData, onExit, connect, message } = fixture();

    const session = await connect({ op: 'hello-server', cols: 120, rows: 40 });

    expect(urls).toEqual([`wss://${NODE}.node.k8s.dev.nos.ci/terminal`]);
    expect(statuses).toEqual([['authorizing'], ['connecting']]);
    expect(session.authorization.message).toContain(`node: ${NODE}`);
    expect(session.authorization.message).toContain('network: devnet');

    socket.onopen?.(new Event('open'));
    expect(JSON.parse(socket.sent[0])).toEqual({
      path: '/terminal',
      body: {
        jobAddress: JOB,
        message: session.authorization.message,
        signature: session.authorization.signature,
        op: 'hello-server',
        cols: 120,
        rows: 40,
      },
    });

    message(Uint8Array.of(1, 2, 3).buffer);
    expect(statuses.at(-1)).toEqual(['connected']);
    expect(onData).toHaveBeenCalledWith(Uint8Array.of(1, 2, 3));

    session.sendInput('ls\n');
    session.resize(80, 24);
    expect(socket.sent.slice(-2).map((frame) => JSON.parse(frame))).toEqual([
      { type: 'stdin', data: 'ls\n' },
      { type: 'resize', cols: 80, rows: 24 },
    ]);

    message(JSON.stringify({ type: 'exit', code: 0 }));
    expect(onExit).toHaveBeenCalledWith(0);
  });

  it('closes the socket when the node rejects the session, and only reports once', async () => {
    const { socket, statuses, connect, message } = fixture();
    const session = await connect();

    message(JSON.stringify({ type: 'error', message: 'Not authorized' }));

    expect(socket.readyState).toBe(3);
    expect(statuses.at(-1)).toEqual(['error', 'Not authorized']);
    session.close();
    expect(statuses.at(-1)).toEqual(['error', 'Not authorized']);
  });

  it('fails when the node sends nothing before the timeout', async () => {
    vi.useFakeTimers();
    const { socket, statuses, connect } = fixture();
    await connect({ timeoutMs: 500 });

    vi.advanceTimersByTime(500);
    expect(statuses.at(-1)).toEqual(['error', 'The node terminal did not respond in time.']);
    expect(socket.readyState).toBe(3);
  });

  it('needs a signer or provider, and honours an abort signal', async () => {
    const { connect } = fixture(null);
    await expect(connect()).rejects.toThrow('wallet or authorization provider');
    await expect(connect({ authorizationProvider: sign })).resolves.toBeDefined();
    await expect(connect({ signal: AbortSignal.abort() })).rejects.toMatchObject({ name: 'AbortError' });
  });
});

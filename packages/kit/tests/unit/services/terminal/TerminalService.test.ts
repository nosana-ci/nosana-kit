import bs58 from 'bs58';
import { describe, expect, it, vi } from 'vitest';

import {
  buildTerminalAuthorizationMessage,
  createTerminalAuthorizationGrant,
  createTerminalService,
  type TerminalStatus,
} from '../../../../src/services/terminal/index.js';

class FakeWebSocket {
  binaryType = '';
  readyState = 1;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readonly sent: string[] = [];

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
  }
}

describe('Terminal access service', () => {
  it('builds the exact restored node authorization message', () => {
    expect(
      buildTerminalAuthorizationMessage({
        job: 'job-address',
        node: 'node-address',
        expiresAt: '2026-08-21T12:04:00.000Z',
        op: 'hello-server',
        network: 'devnet',
      })
    ).toBe(
      [
        'Nosana Terminal Authorization v1',
        '',
        'job: job-address',
        'node: node-address',
        'expiresAt: 2026-08-21T12:04:00.000Z',
        'op: hello-server',
        'network: devnet',
        'audience: nosana-web-terminal',
      ].join('\n')
    );
  });

  it('normalizes a deployment authorization header into base64', async () => {
    const signature = new Uint8Array(64).fill(9);
    const grant = await createTerminalAuthorizationGrant({
      job: 'job-address',
      node: 'node-address',
      network: 'devnet',
      now: new Date('2026-08-21T12:00:00.000Z'),
      authorizationProvider: async (message) => `${message}:${bs58.encode(signature)}`,
    });

    expect(grant.expiresAt).toBe('2026-08-21T12:04:00.000Z');
    expect(grant.signature).toBe(
      'CQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQ=='
    );
  });

  it('owns the terminal websocket handshake and session frames', async () => {
    const socket = new FakeWebSocket();
    const statuses: TerminalStatus[] = [];
    const onData = vi.fn();
    const onExit = vi.fn();
    const service = createTerminalService({
      getWallet: () => undefined,
      now: () => new Date('2026-08-21T12:00:00.000Z'),
      webSocketFactory: () => socket as unknown as WebSocket,
    });

    const session = await service.connect({
      job: 'job-address',
      node: 'node-address',
      nodeDomain: 'node.example.com',
      network: 'devnet',
      op: 'hello-server',
      cols: 120,
      rows: 40,
      authorizationProvider: async () => new Uint8Array(64).fill(3),
      onData,
      onExit,
      onStatus: (status) => statuses.push(status),
    });

    expect(statuses).toEqual(['authorizing', 'connecting']);
    socket.onopen?.(new Event('open'));
    expect(JSON.parse(socket.sent[0])).toEqual({
      path: '/terminal',
      body: {
        jobAddress: 'job-address',
        message: session.authorization.message,
        signature: session.authorization.signature,
        op: 'hello-server',
        cols: 120,
        rows: 40,
      },
    });

    socket.onmessage?.(new MessageEvent('message', { data: Uint8Array.of(1, 2, 3).buffer }));
    expect(statuses).toContain('connected');
    expect(onData).toHaveBeenCalledWith(Uint8Array.of(1, 2, 3));

    session.sendInput('ls\n');
    session.resize(80, 24);
    expect(socket.sent.slice(-2).map((message) => JSON.parse(message))).toEqual([
      { type: 'stdin', data: 'ls\n' },
      { type: 'resize', cols: 80, rows: 24 },
    ]);

    socket.onmessage?.(
      new MessageEvent('message', {
        data: JSON.stringify({ type: 'exit', code: 0 }),
      })
    );
    expect(onExit).toHaveBeenCalledWith(0);
  });

  it('closes the websocket when the node rejects the terminal session', async () => {
    const socket = new FakeWebSocket();
    const statuses: Array<{ status: TerminalStatus; detail?: string }> = [];
    const service = createTerminalService({
      getWallet: () => undefined,
      webSocketFactory: () => socket as unknown as WebSocket,
    });

    const session = await service.connect({
      job: 'job-address',
      node: 'node-address',
      nodeDomain: 'node.example.com',
      network: 'devnet',
      cols: 80,
      rows: 24,
      authorizationProvider: async () => new Uint8Array(64),
      onData: vi.fn(),
      onStatus: (status, detail) => statuses.push({ status, detail }),
    });

    socket.onmessage?.(
      new MessageEvent('message', {
        data: JSON.stringify({ type: 'error', message: 'Not authorized' }),
      })
    );

    expect(socket.readyState).toBe(3);
    expect(statuses.at(-1)).toEqual({
      status: 'error',
      detail: 'Not authorized',
    });
    session.close();
    expect(statuses.at(-1)?.status).toBe('error');
  });

  it('rejects unsafe operations before opening a websocket', async () => {
    const service = createTerminalService({ getWallet: () => undefined });

    await expect(
      service.connect({
        job: 'job-address',
        node: 'node-address',
        nodeDomain: 'node.example.com',
        network: 'devnet',
        op: 'worker; rm',
        cols: 80,
        rows: 24,
        authorizationProvider: async () => new Uint8Array(64),
        onData: vi.fn(),
      })
    ).rejects.toMatchObject({ code: 'AUTHORIZATION_REJECTED' });
  });
});

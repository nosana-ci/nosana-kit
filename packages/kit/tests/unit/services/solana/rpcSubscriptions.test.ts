import type { AddressInfo } from 'net';
import { WebSocketServer, type WebSocket } from 'ws';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  address,
  isSolanaError,
  SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED,
} from '@solana/kit';

const { createRpcSubscriptions } = await vi.importActual<
  typeof import('../../../../src/services/solana/rpcSubscriptions.js')
>('../../../../src/services/solana/rpcSubscriptions.js');

const ACCOUNT = address('11111111111111111111111111111111');
const PING_INTERVAL_MS = 50;

/**
 * A Solana RPC PubSub endpoint, as far as `accountNotifications` goes: it
 * grants every subscription and notifies each, every 20 ms, of an account
 * whose lamports are the subscription's id. Pings are counted and, as the
 * real one does, not answered.
 */
class PubSubServer {
  readonly connections: WebSocket[] = [];
  readonly closes: number[] = [];
  pings = 0;
  /** Set to stop notifying. */
  silent = false;
  private readonly server: WebSocketServer;
  private nextId = 1;

  private constructor(server: WebSocketServer) {
    this.server = server;
    server.on('connection', (socket) => this.serve(socket));
  }

  static async listen(): Promise<PubSubServer> {
    const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
    await new Promise<void>((resolve) => server.once('listening', resolve));
    return new PubSubServer(server);
  }

  get url(): string {
    return `ws://127.0.0.1:${(this.server.address() as AddressInfo).port}`;
  }

  close(): void {
    for (const socket of this.connections) socket.terminate();
    this.server.close();
  }

  private serve(socket: WebSocket): void {
    this.connections.push(socket);
    const subscriptions = new Set<number>();
    socket.on('message', (raw) => {
      const request = JSON.parse(raw.toString());
      if (request.method === 'ping') {
        this.pings++;
        return;
      }
      if (request.method === 'accountSubscribe') {
        const id = this.nextId++;
        subscriptions.add(id);
        socket.send(JSON.stringify({ jsonrpc: '2.0', id: request.id, result: id }));
        return;
      }
      if (request.method === 'accountUnsubscribe') {
        subscriptions.delete(request.params[0]);
        socket.send(JSON.stringify({ jsonrpc: '2.0', id: request.id, result: true }));
      }
    });
    const notifying = setInterval(() => {
      if (this.silent) return;
      for (const id of subscriptions) {
        socket.send(
          JSON.stringify({
            jsonrpc: '2.0',
            method: 'accountNotification',
            params: {
              subscription: id,
              result: {
                context: { slot: 1 },
                value: {
                  lamports: id,
                  data: ['', 'base64'],
                  owner: ACCOUNT,
                  executable: false,
                  rentEpoch: 0,
                  space: 0,
                },
              },
            },
          })
        );
      }
    }, 20);
    socket.on('close', (code) => {
      clearInterval(notifying);
      this.closes.push(code);
    });
  }
}

const closedConnection = (error: unknown) =>
  isSolanaError(error, SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED);

describe('createRpcSubscriptions', () => {
  let server: PubSubServer;
  let controller: AbortController;

  beforeEach(async () => {
    server = await PubSubServer.listen();
    controller = new AbortController();
  });

  afterEach(() => {
    controller.abort();
    server.close();
  });

  /** Subscribes, and consumes until `after` has been given the first notification. */
  async function consume(after: () => void): Promise<bigint[]> {
    const notifications = await createRpcSubscriptions(server.url, {
      intervalMs: PING_INTERVAL_MS,
    })
      .accountNotifications(ACCOUNT, { encoding: 'base64' })
      .subscribe({ abortSignal: controller.signal });
    const lamports: bigint[] = [];
    for await (const { value } of notifications) {
      lamports.push(value.lamports);
      if (lamports.length === 1) after();
    }
    return lamports;
  }

  it('delivers notifications, and ends the subscription quietly when it is aborted', async () => {
    const lamports = await consume(() => controller.abort());

    expect(lamports).toEqual([1n]);
    await vi.waitFor(() => expect(server.closes).toEqual([1000]));
  });

  it('ends the subscription with an error when the connection drops', async () => {
    await expect(consume(() => server.connections[0].terminate())).rejects.toSatisfy(
      closedConnection
    );

    expect(server.closes).toEqual([1006]);
  });

  it('ends the subscription with an error when the server closes the connection normally', async () => {
    await expect(consume(() => server.connections[0].close(1000, 'going away'))).rejects.toSatisfy(
      closedConnection
    );

    expect(server.closes).toEqual([1000]);
  });

  it('pings the connection while it is idle, and not while notifications come in', async () => {
    const notifications = await createRpcSubscriptions(server.url, {
      intervalMs: PING_INTERVAL_MS,
    })
      .accountNotifications(ACCOUNT, { encoding: 'base64' })
      .subscribe({ abortSignal: controller.signal });
    const consuming = (async () => {
      for await (const notification of notifications) void notification;
    })();

    await new Promise((resolve) => setTimeout(resolve, PING_INTERVAL_MS * 4));
    expect(server.pings).toBe(0);

    server.silent = true;
    await vi.waitFor(() => expect(server.pings).toBeGreaterThan(0));
    controller.abort();
    await consuming;
  });
});

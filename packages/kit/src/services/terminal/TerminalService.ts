import type { Wallet } from '../../types.js';
import { walletToAuthorizationSigner } from '../../utils/walletToAuthorizationSigner.js';
import type { AccessAuthorizationProvider } from '../ssh/authorization.js';
import {
  createTerminalAuthorizationGrant,
  type TerminalAuthorizationGrant,
} from './authorization.js';

const WEB_SOCKET_OPEN = 1;
const DEFAULT_CONNECTION_TIMEOUT_MS = 10_000;

export type TerminalStatus = 'authorizing' | 'connecting' | 'connected' | 'closed' | 'error';

export type TerminalErrorCode =
  | 'NO_ASSIGNED_NODE'
  | 'NO_AUTHORIZATION'
  | 'AUTHORIZATION_REJECTED'
  | 'CONNECTION_TIMEOUT'
  | 'CONNECTION_FAILED'
  | 'INVALID_OPERATION';

export class TerminalError extends Error {
  readonly cause?: unknown;

  constructor(
    readonly code: TerminalErrorCode,
    message: string,
    cause?: unknown
  ) {
    super(message);
    this.name = 'TerminalError';
    this.cause = cause;
  }
}

export interface TerminalServiceDeps {
  getWallet: () => Wallet | undefined;
  webSocketFactory?: (url: string) => WebSocket;
  now?: () => Date;
}

export interface TerminalConnectOptions {
  job: string;
  node: string;
  nodeDomain: string;
  network: string;
  op?: string;
  cols: number;
  rows: number;
  ttlMs?: number;
  timeoutMs?: number;
  authorizationProvider?: AccessAuthorizationProvider;
  webSocketFactory?: (url: string) => WebSocket;
  signal?: AbortSignal;
  onData: (data: Uint8Array) => void;
  onStatus?: (status: TerminalStatus, detail?: string) => void;
  onExit?: (code: number | null) => void;
}

export interface TerminalSession {
  readonly authorization: TerminalAuthorizationGrant;
  readonly socket: WebSocket;
  sendInput(data: string): void;
  resize(cols: number, rows: number): void;
  close(): void;
}

export interface TerminalService {
  connect(options: TerminalConnectOptions): Promise<TerminalSession>;
}

function toBytes(data: unknown): Uint8Array | undefined {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  return undefined;
}

export function createTerminalService(deps: TerminalServiceDeps): TerminalService {
  const getDefaultAuthorizationProvider = (): AccessAuthorizationProvider => {
    const wallet = deps.getWallet();
    if (!wallet) {
      throw new TerminalError(
        'NO_AUTHORIZATION',
        'A wallet or authorization provider is required to open a terminal.'
      );
    }

    const signMessage = walletToAuthorizationSigner(wallet);
    return (message) => signMessage(new TextEncoder().encode(message));
  };

  return {
    async connect(options): Promise<TerminalSession> {
      if (!options.node || options.node === '11111111111111111111111111111111') {
        throw new TerminalError('NO_ASSIGNED_NODE', 'Job has no assigned node.');
      }
      if (options.signal?.aborted) {
        throw new DOMException('Terminal connection was cancelled.', 'AbortError');
      }

      options.onStatus?.('authorizing');
      let authorization: TerminalAuthorizationGrant;
      try {
        authorization = await createTerminalAuthorizationGrant({
          job: options.job,
          node: options.node,
          network: options.network,
          op: options.op,
          ttlMs: options.ttlMs,
          now: deps.now?.() ?? new Date(),
          authorizationProvider: options.authorizationProvider ?? getDefaultAuthorizationProvider(),
        });
      } catch (error) {
        if (error instanceof TerminalError) throw error;
        throw new TerminalError(
          'AUTHORIZATION_REJECTED',
          error instanceof Error ? error.message : 'Terminal authorization failed.',
          error
        );
      }

      if (options.signal?.aborted) {
        throw new DOMException('Terminal connection was cancelled.', 'AbortError');
      }

      const createWebSocket =
        options.webSocketFactory ?? deps.webSocketFactory ?? ((url: string) => new WebSocket(url));
      const socket = createWebSocket(`wss://${options.node}.${options.nodeDomain}/terminal`);
      socket.binaryType = 'arraybuffer';
      options.onStatus?.('connecting');

      let connected = false;
      let closed = false;
      const timeout = globalThis.setTimeout(() => {
        if (closed || connected) return;
        fail('The node terminal did not respond in time.');
      }, options.timeoutMs ?? DEFAULT_CONNECTION_TIMEOUT_MS);

      function markConnected() {
        if (connected || closed) return;
        connected = true;
        globalThis.clearTimeout(timeout);
        options.onStatus?.('connected');
      }

      function detach() {
        globalThis.clearTimeout(timeout);
        options.signal?.removeEventListener('abort', abort);
        socket.onopen = null;
        socket.onmessage = null;
        socket.onclose = null;
        socket.onerror = null;
      }

      function closeSocket() {
        try {
          socket.close();
        } catch {
          // best effort
        }
      }

      function fail(detail: string) {
        if (closed) return;
        closed = true;
        detach();
        closeSocket();
        options.onStatus?.('error', detail);
      }

      function close() {
        if (closed) return;
        closed = true;
        detach();
        closeSocket();
        options.onStatus?.('closed');
      }

      function abort() {
        close();
      }
      options.signal?.addEventListener('abort', abort, { once: true });

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            path: '/terminal',
            body: {
              jobAddress: options.job,
              message: authorization.message,
              signature: authorization.signature,
              op: options.op,
              cols: options.cols,
              rows: options.rows,
            },
          })
        );
      };

      socket.onmessage = async (event: MessageEvent) => {
        if (typeof event.data === 'string') {
          try {
            const payload = JSON.parse(event.data) as {
              type?: string;
              code?: number | null;
              message?: string;
            };
            if (payload.type === 'error') {
              fail(payload.message ?? 'Terminal connection failed.');
              return;
            }

            markConnected();
            if (payload.type === 'exit') options.onExit?.(payload.code ?? null);
          } catch {
            markConnected();
            options.onData(new TextEncoder().encode(event.data));
          }
          return;
        }

        if (typeof Blob !== 'undefined' && event.data instanceof Blob) {
          markConnected();
          options.onData(new Uint8Array(await event.data.arrayBuffer()));
          return;
        }

        const bytes = toBytes(event.data);
        if (bytes) {
          markConnected();
          options.onData(bytes);
        }
      };

      socket.onclose = (event: CloseEvent) => {
        globalThis.clearTimeout(timeout);
        options.signal?.removeEventListener('abort', abort);
        if (closed) return;
        closed = true;

        const abnormal = event.code >= 3000 || event.code === 1006 || event.code === 1011;
        if (abnormal) {
          options.onStatus?.('error', event.reason || 'Could not reach the node terminal.');
          return;
        }
        options.onStatus?.('closed', event.reason || undefined);
      };

      socket.onerror = () => {
        fail('Could not reach the node terminal.');
      };

      return {
        authorization,
        socket,
        sendInput(data) {
          if (socket.readyState !== WEB_SOCKET_OPEN) return;
          socket.send(JSON.stringify({ type: 'stdin', data }));
        },
        resize(cols, rows) {
          if (socket.readyState !== WEB_SOCKET_OPEN) return;
          socket.send(JSON.stringify({ type: 'resize', cols, rows }));
        },
        close,
      };
    },
  };
}

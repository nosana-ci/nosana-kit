import { tryParseJson } from '../../../../utils/json.js';

import type {
  NodeTerminalOptions,
  TerminalAuthorizationGrant,
  TerminalSession,
  TerminalStatus,
} from '../../types.js';

const WEB_SOCKET_OPEN = 1;
const DEFAULT_CONNECTION_TIMEOUT_MS = 10_000;
const UNREACHABLE = 'Could not reach the node terminal.';

const encoder = new TextEncoder();

type Phase = 'connecting' | 'connected' | 'closed';

type TextFrame =
  | { kind: 'error'; message: string }
  | { kind: 'exit'; code: number | null }
  | { kind: 'data'; bytes: Uint8Array }
  | { kind: 'control' };

/**
 * Drives one terminal WebSocket: sends the signed handshake once the socket
 * opens, relays frames in both directions, and reports each status change once.
 */
export function openTerminalSession(
  socket: WebSocket,
  job: string,
  authorization: TerminalAuthorizationGrant,
  options: NodeTerminalOptions,
): TerminalSession {
  let phase: Phase = 'connecting';
  const report = (status: TerminalStatus, detail?: string) => options.onStatus?.(status, detail);

  const timeout = setTimeout(
    () => end('error', 'The node terminal did not respond in time.'),
    options.timeoutMs ?? DEFAULT_CONNECTION_TIMEOUT_MS,
  );

  /** Ends the session once; later calls are ignored. */
  function end(status: 'closed' | 'error', detail?: string): void {
    if (phase === 'closed') return;
    phase = 'closed';
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', close);
    socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
    closeQuietly(socket);
    report(status, detail);
  }

  function close(): void {
    end('closed');
  }

  function connected(): void {
    if (phase !== 'connecting') return;
    phase = 'connected';
    clearTimeout(timeout);
    report('connected');
  }

  function send(frame: Record<string, unknown>): void {
    if (socket.readyState === WEB_SOCKET_OPEN) socket.send(JSON.stringify(frame));
  }

  /** Terminal output; the first frame of any kind means the node accepted the session. */
  function deliver(bytes: Uint8Array): void {
    if (phase === 'closed') return;
    connected();
    options.onData(bytes);
  }

  function receive(frame: TextFrame): void {
    if (frame.kind === 'error') {
      end('error', frame.message);
      return;
    }
    if (frame.kind === 'data') {
      deliver(frame.bytes);
      return;
    }
    connected();
    if (frame.kind === 'exit') options.onExit?.(frame.code);
  }

  socket.binaryType = 'arraybuffer';
  socket.onopen = () =>
    socket.send(
      JSON.stringify({
        path: '/terminal',
        body: {
          jobAddress: job,
          message: authorization.message,
          signature: authorization.signature,
          op: options.op,
          cols: options.cols,
          rows: options.rows,
        },
      }),
    );
  socket.onmessage = (event: MessageEvent) => {
    if (typeof event.data === 'string') {
      receive(parseTextFrame(event.data));
    } else if (typeof Blob !== 'undefined' && event.data instanceof Blob) {
      void event.data.arrayBuffer().then((buffer) => deliver(new Uint8Array(buffer)));
    } else {
      const bytes = viewBytes(event.data);
      if (bytes) deliver(bytes);
    }
  };
  socket.onclose = (event: CloseEvent) => {
    const abnormal = event.code >= 3000 || event.code === 1006 || event.code === 1011;
    end(abnormal ? 'error' : 'closed', event.reason || (abnormal ? UNREACHABLE : undefined));
  };
  socket.onerror = () => end('error', UNREACHABLE);
  options.signal?.addEventListener('abort', close, { once: true });
  report('connecting');

  return {
    authorization,
    socket,
    sendInput: (data) => send({ type: 'stdin', data }),
    resize: (cols, rows) => send({ type: 'resize', cols, rows }),
    close,
  };
}

/** Text frames are JSON control messages; anything that is not JSON is terminal output. */
function parseTextFrame(text: string): TextFrame {
  const payload = tryParseJson(text);
  if (payload === undefined) return { kind: 'data', bytes: encoder.encode(text) };
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { kind: 'control' };
  }
  const frame = payload as { type?: unknown; message?: unknown; code?: unknown };
  if (frame.type === 'error') {
    const message = typeof frame.message === 'string' ? frame.message : undefined;
    return { kind: 'error', message: message ?? 'Terminal connection failed.' };
  }
  if (frame.type === 'exit') {
    return { kind: 'exit', code: typeof frame.code === 'number' ? frame.code : null };
  }
  return { kind: 'control' };
}

function viewBytes(data: unknown): Uint8Array | undefined {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  return undefined;
}

function closeQuietly(socket: WebSocket): void {
  try {
    socket.close();
  } catch {
    // Already closing or closed.
  }
}

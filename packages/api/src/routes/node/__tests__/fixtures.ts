import { createNosanaNodeApi } from '../index.js';

import type { SignerAuth } from '../../../types.js';

export const NODE = '7XkMcd1AYjCJU7SjrpGmGWHshfr9iVTiw88u6CThYEpL';
export const JOB = '8TjrkaZmW2UFjpm2Va5LECJc7zoFrbUJETk6fPimGi9a';
export const KEY =
  'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIB0XqCL4vLIsYRvd5VmtbOJ8IEKDJpjaVWQ5lmxWVTq5 user-a';

export const ok = (data: unknown) => ({ data, error: null, response: new Response() });
export const failed = (status: number, error: unknown) => ({
  data: null,
  error,
  response: new Response(null, { status }),
});

/** A signer that only labels the message; fine for handshakes, not for a grant the node would verify. */
export const signer: SignerAuth = {
  identifier: 'me',
  generate: async (message) => `${message}:signed`,
  solana: {} as never,
};

/** The node API on devnet against the global mock client; `null` means no signer at all. */
export function nodeApi(auth: SignerAuth | null = signer) {
  return createNosanaNodeApi({ environment: 'devnet', authParams: auth ?? undefined })(NODE);
}

export class FakeWebSocket {
  binaryType = '';
  readyState = 1;
  onopen: ((event: Event) => void | Promise<void>) | null = null;
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

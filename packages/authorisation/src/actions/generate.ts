import base58 from 'bs58';

import { signMessage } from '../utils/signMessage.js';
import type { AuthorizationStore, GenerateOptions, SignerOrKey, SignMessageFn } from '../types.js';

export async function generate(message: string, options: Partial<GenerateOptions> | undefined, secretKey: Uint8Array, store: AuthorizationStore | undefined): Promise<string>;
export async function generate(message: string, options: Partial<GenerateOptions> | undefined, signMessage: SignMessageFn, store: AuthorizationStore | undefined): Promise<string>;

export async function generate(
  message: string,
  options: Partial<GenerateOptions> | undefined,
  signerOrKey: SignerOrKey,
  store: AuthorizationStore | undefined
): Promise<string> {
  const opts: GenerateOptions = {
    includeTime: false,
    separator: ':',
    ...options,
  };

  if (store) {
    const storedSignature = await Promise.resolve(store.actions.get(store.identifier, opts)).catch(() => undefined);
    if (storedSignature) {
      return storedSignature;
    }
  }

  const { includeTime, separator } = opts;

  const signedMessage = await signMessage(message, signerOrKey);
  const signature = `${message}${separator}${base58.encode(signedMessage)}${includeTime ? separator + new Date().getTime() : ''}`;

  if (store) {
    store.actions.set(store.identifier, opts, signature);
  }

  return signature;
}



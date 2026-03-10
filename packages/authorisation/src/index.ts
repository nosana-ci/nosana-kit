import {
  generate,
  generateHeaders,
  validate,
  validateHeaders,
} from './actions/index.js';

import type {
  AuthorizationStore,
  GenerateHeaderOptions,
  GenerateOptions,
  SignerOrKey,
  SignMessageFn,
} from './types.js';

export * from './actions/index.js';
export type * from './types.js';

export interface NosanaAuthorization {
  generate: (
    message: string,
    options?: Partial<GenerateOptions>,
  ) => Promise<string>;
  generateHeaders: (
    message: string,
    options?: Partial<GenerateHeaderOptions>,
  ) => Promise<Headers>;
  validate: typeof validate;
  validateHeaders: typeof validateHeaders;
}

export function createNosanaAuthorization(): NosanaAuthorization;
export function createNosanaAuthorization(
  noSignerOrKey: undefined,
  store?: AuthorizationStore,
): NosanaAuthorization;
export function createNosanaAuthorization(key: Uint8Array): NosanaAuthorization;
export function createNosanaAuthorization(
  key: Uint8Array,
  store?: AuthorizationStore,
): NosanaAuthorization;
export function createNosanaAuthorization(
  signer: SignMessageFn,
): NosanaAuthorization;
export function createNosanaAuthorization(
  signer: SignMessageFn,
  store?: AuthorizationStore,
): NosanaAuthorization;

export function createNosanaAuthorization(
  signerOrKey?: SignerOrKey,
  store?: AuthorizationStore,
): NosanaAuthorization {
  const bindSigner = <T extends NosanaAuthorization[keyof NosanaAuthorization]>(
    fn: T,
  ): T => {
    return (async (...args: Parameters<T>) => {
      if (!signerOrKey) {
        throw new Error('Signer or key is required for this operation.');
      }
      return (fn as (...a: unknown[]) => unknown)(
        args[0],
        args[1],
        signerOrKey,
        store,
      );
    }) as T;
  };

  return {
    generate: bindSigner(generate as NosanaAuthorization['generate']),
    generateHeaders: bindSigner(
      generateHeaders as NosanaAuthorization['generateHeaders'],
    ),
    validate,
    validateHeaders,
  };
}

import { generate } from "./generate.js";

import type { AuthorizationStore, GenerateHeaderOptions, SignerOrKey, SignMessageFn } from "../types.js";

export async function generateHeaders(message: string, options: Partial<GenerateHeaderOptions> | undefined, secretKey: Uint8Array, store: AuthorizationStore | undefined): Promise<Headers>;
export async function generateHeaders(message: string, options: Partial<GenerateHeaderOptions> | undefined, signMessage: SignMessageFn, store: AuthorizationStore | undefined): Promise<Headers>;

export async function generateHeaders(
  message: string,
  options: Partial<GenerateHeaderOptions> | undefined,
  signerOrKey: SignerOrKey,
  store: AuthorizationStore | undefined
): Promise<Headers> {
  const { key } = {
    key: 'Authorization',
    ...options,
  };

  const authorizationString = signerOrKey instanceof Uint8Array
    ? await generate(message, options, signerOrKey, store)
    : await generate(message, options, signerOrKey, store);

  const headers = new Headers();
  headers.append(key, authorizationString);
  return headers;
}

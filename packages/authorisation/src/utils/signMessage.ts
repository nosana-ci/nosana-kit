import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

import { SignMessageFn } from '../types.js';

/**
 * Sign a message using either a SignMessageFn or a secret key.
 * 
 * @param message - The message to sign
 * @param signerOrKey - Either a SignMessageFn (from wallet standard) or a Uint8Array secret key
 * @returns The signature as Uint8Array
 */
export async function signMessage(
  message: string,
  signerOrKey: Uint8Array | SignMessageFn
): Promise<Uint8Array> {
  // Use SignMessageFn if provided (wallet standard)
  if (typeof signerOrKey === 'function') {
    const encodedMessage = new TextEncoder().encode(message);
    return await signerOrKey(encodedMessage);
  }

  // Use secret key directly
  if (signerOrKey instanceof Uint8Array) {
    const messageBytes = naclUtil.decodeUTF8(message);
    return nacl.sign.detached(messageBytes, signerOrKey);
  }

  throw new Error('No valid signing method available');
}

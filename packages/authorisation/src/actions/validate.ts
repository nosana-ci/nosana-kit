import nacl from 'tweetnacl';
import base58 from 'bs58';
import { ValidateOptions } from "../types.js";

export function validate(
  validationString: string,
  publicKey: Uint8Array<ArrayBufferLike>,
  options?: Partial<ValidateOptions>,
): boolean {
  const { expiry, separator, expected_message }: ValidateOptions = {
    expiry: 300,
    separator: ':',
    ...options,
  };

  const [message, signatureB64, date] = validationString.split(separator);

  if (!message || !signatureB64) {
    throw new Error('Invalid signature.');
  }

  if (expected_message && message !== expected_message) {
    throw new Error("Failed to authenticate message.");
  }

  if (date) {
    if (
      (new Date().getTime() - new Date(parseInt(date)).getTime()) / 1000 >=
      expiry
    ) {
      throw new Error('Authorization has expired.');
    }
  }

  return nacl.sign.detached.verify(
    Buffer.from(message),
    base58.decode(signatureB64),
    publicKey,
  );
}
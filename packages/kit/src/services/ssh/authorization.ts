import bs58 from 'bs58';

export const SSH_AUTHORIZATION_MESSAGE_HEADER = 'Nosana SSH Authorization v1';
export const SSH_AUTHORIZATION_MAX_TTL_MS = 5 * 60 * 1000;
export const SSH_AUTHORIZATION_AUDIENCE = 'nosana-ssh-gateway';

export type AccessAuthorizationProvider = (message: string) => Promise<Uint8Array | string>;

export interface SshAuthorizationMessageOptions {
  job: string;
  node: string;
  sshUser?: string;
  sshPublicKey: string;
  expiresAt: string;
  network: string;
  audience?: string;
}

export function buildSshAuthorizationMessage(options: SshAuthorizationMessageOptions): string {
  return [
    SSH_AUTHORIZATION_MESSAGE_HEADER,
    '',
    `job: ${options.job}`,
    `node: ${options.node}`,
    `sshUser: ${options.sshUser ?? `nosana-${options.job}`}`,
    `sshPublicKey: ${options.sshPublicKey}`,
    `expiresAt: ${options.expiresAt}`,
    `network: ${options.network}`,
    `audience: ${options.audience ?? SSH_AUTHORIZATION_AUDIENCE}`,
  ].join('\n');
}

export function extractAuthorizationSignature(
  authorization: string,
  expectedMessage: string
): Uint8Array {
  const prefix = `${expectedMessage}:`;
  if (!authorization.startsWith(prefix)) {
    throw new Error('Authorization response does not contain the expected message.');
  }

  const encodedSignature = authorization.slice(prefix.length).split(':', 1)[0];
  let signature: Uint8Array;
  try {
    signature = bs58.decode(encodedSignature);
  } catch {
    throw new Error('Authorization response contains an invalid signature.');
  }

  if (signature.length !== 64) {
    throw new Error('Authorization response contains an invalid signature.');
  }

  return signature;
}

export async function resolveAuthorizationSignature(
  provider: AccessAuthorizationProvider,
  message: string
): Promise<Uint8Array> {
  const result = await provider(message);
  const signature =
    typeof result === 'string' ? extractAuthorizationSignature(result, message) : result;

  if (signature.length !== 64) {
    throw new Error('Authorization provider returned an invalid signature.');
  }

  return signature;
}

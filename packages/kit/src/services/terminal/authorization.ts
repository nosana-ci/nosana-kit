import {
  type AccessAuthorizationProvider,
  resolveAuthorizationSignature,
} from '../ssh/authorization.js';
import { bytesToBase64 } from '../ssh/encoding.js';

export const TERMINAL_AUTHORIZATION_MESSAGE_HEADER = 'Nosana Terminal Authorization v1';
export const TERMINAL_AUTHORIZATION_AUDIENCE = 'nosana-web-terminal';
export const TERMINAL_AUTHORIZATION_MAX_TTL_MS = 5 * 60 * 1000;
export const DEFAULT_TERMINAL_AUTHORIZATION_TTL_MS = 4 * 60 * 1000;

export interface TerminalAuthorizationMessageOptions {
  job: string;
  node: string;
  expiresAt: string;
  op?: string;
  network: string;
  audience?: string;
}

export interface TerminalAuthorizationGrant {
  message: string;
  signature: string;
  expiresAt: string;
}

export function isSafeTerminalOperation(op: string): boolean {
  return /^[A-Za-z0-9._:-]+$/.test(op);
}

export function buildTerminalAuthorizationMessage(
  options: TerminalAuthorizationMessageOptions
): string {
  const lines = [
    TERMINAL_AUTHORIZATION_MESSAGE_HEADER,
    '',
    `job: ${options.job}`,
    `node: ${options.node}`,
    `expiresAt: ${options.expiresAt}`,
  ];

  if (options.op) lines.push(`op: ${options.op}`);
  lines.push(`network: ${options.network}`);
  lines.push(`audience: ${options.audience ?? TERMINAL_AUTHORIZATION_AUDIENCE}`);
  return lines.join('\n');
}

export async function createTerminalAuthorizationGrant({
  job,
  node,
  network,
  op,
  ttlMs = DEFAULT_TERMINAL_AUTHORIZATION_TTL_MS,
  now = new Date(),
  authorizationProvider,
}: {
  job: string;
  node: string;
  network: string;
  op?: string;
  ttlMs?: number;
  now?: Date;
  authorizationProvider: AccessAuthorizationProvider;
}): Promise<TerminalAuthorizationGrant> {
  if (ttlMs <= 0 || ttlMs > TERMINAL_AUTHORIZATION_MAX_TTL_MS) {
    throw new Error(
      `Terminal authorization TTL must be between 1 and ${TERMINAL_AUTHORIZATION_MAX_TTL_MS} milliseconds.`
    );
  }
  if (op && !isSafeTerminalOperation(op)) {
    throw new Error('Invalid terminal operation selector.');
  }

  const expiresAt = new Date(now.getTime() + ttlMs).toISOString();
  const message = buildTerminalAuthorizationMessage({
    job,
    node,
    expiresAt,
    op,
    network,
  });
  const signature = await resolveAuthorizationSignature(authorizationProvider, message);

  return {
    message,
    signature: bytesToBase64(signature),
    expiresAt,
  };
}

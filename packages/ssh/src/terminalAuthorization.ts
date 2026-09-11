/**
 * The wire contract for a signed, short-lived web-terminal authorization: the
 * exact message the client signs and the node verifies. Both sides import this
 * module so the format, field order and limits cannot drift between them.
 */

export const TERMINAL_AUTHORIZATION_MESSAGE_HEADER = 'Nosana Terminal Authorization v1';
export const TERMINAL_AUTHORIZATION_AUDIENCE = 'nosana-web-terminal';
export const TERMINAL_AUTHORIZATION_MAX_TTL_MS = 5 * 60 * 1000;

export interface TerminalAuthorizationMessageOptions {
  job: string;
  node: string;
  /** ISO 8601 UTC timestamp. */
  expiresAt: string;
  op?: string;
  network: string;
}

export interface ParsedTerminalAuthorizationMessage {
  job: string;
  node: string;
  expiresAt: string;
  op?: string;
  network?: string;
  audience?: string;
}

/** An operation selector is interpolated into the signed message, so it must stay one plain token. */
export function isSafeTerminalOperation(op: string): boolean {
  return /^[A-Za-z0-9._:-]+$/.test(op);
}

/** The exact text the node verifies; line order is part of the contract. */
export function buildTerminalAuthorizationMessage(
  options: TerminalAuthorizationMessageOptions
): string {
  return [
    TERMINAL_AUTHORIZATION_MESSAGE_HEADER,
    '',
    `job: ${options.job}`,
    `node: ${options.node}`,
    `expiresAt: ${options.expiresAt}`,
    ...(options.op ? [`op: ${options.op}`] : []),
    `network: ${options.network}`,
    `audience: ${TERMINAL_AUTHORIZATION_AUDIENCE}`,
  ].join('\n');
}

/**
 * Parses a terminal authorization message back into its fields. Enforces the
 * header and that `job`, `node` and `expiresAt` are present; the caller checks
 * the values and the signature. Duplicate or malformed lines are rejected.
 */
export function parseTerminalAuthorizationMessage(
  message: string
): ParsedTerminalAuthorizationMessage {
  const lines = message.split(/\r?\n/);
  if (lines[0] !== TERMINAL_AUTHORIZATION_MESSAGE_HEADER) {
    throw new Error('Invalid terminal authorization message header');
  }

  const fields: Record<string, string> = {};
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const separator = line.indexOf(':');
    if (separator === -1) {
      throw new Error('Invalid terminal authorization message field');
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!key || !value || fields[key]) {
      throw new Error('Invalid terminal authorization message field');
    }
    fields[key] = value;
  }

  for (const required of ['job', 'node', 'expiresAt'] as const) {
    if (!fields[required]) {
      throw new Error(`Missing terminal authorization field: ${required}`);
    }
  }

  // The required fields are present by the check above; the rest are optional.
  return fields as unknown as ParsedTerminalAuthorizationMessage;
}

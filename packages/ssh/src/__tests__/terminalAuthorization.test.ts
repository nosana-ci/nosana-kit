import { describe, expect, it } from 'vitest';

import {
  buildTerminalAuthorizationMessage,
  isSafeTerminalOperation,
  parseTerminalAuthorizationMessage,
  TERMINAL_AUTHORIZATION_AUDIENCE,
  TERMINAL_AUTHORIZATION_MESSAGE_HEADER,
} from '../terminalAuthorization.js';

const base = {
  job: 'job-1',
  node: 'node-1',
  expiresAt: '2026-08-21T12:04:00.000Z',
  network: 'mainnet',
};

describe('buildTerminalAuthorizationMessage / parseTerminalAuthorizationMessage', () => {
  it('round-trips every field, including the audience the builder appends', () => {
    const parsed = parseTerminalAuthorizationMessage(
      buildTerminalAuthorizationMessage({ ...base, op: 'op-2' })
    );
    expect(parsed).toEqual({
      ...base,
      op: 'op-2',
      audience: TERMINAL_AUTHORIZATION_AUDIENCE,
    });
  });

  it('omits the op line when no operation is given', () => {
    const message = buildTerminalAuthorizationMessage(base);
    expect(message).not.toContain('op:');
    expect(parseTerminalAuthorizationMessage(message).op).toBeUndefined();
  });

  it('starts with the versioned header', () => {
    expect(buildTerminalAuthorizationMessage(base).split('\n')[0]).toBe(
      TERMINAL_AUTHORIZATION_MESSAGE_HEADER
    );
  });
});

describe('parseTerminalAuthorizationMessage', () => {
  const message = buildTerminalAuthorizationMessage(base);

  it('rejects a wrong header', () => {
    expect(() =>
      parseTerminalAuthorizationMessage(
        message.replace(TERMINAL_AUTHORIZATION_MESSAGE_HEADER, 'v2')
      )
    ).toThrow('header');
  });

  it('rejects a duplicated field', () => {
    expect(() => parseTerminalAuthorizationMessage(`${message}\njob: other`)).toThrow('field');
  });

  it('rejects a line without a separator', () => {
    expect(() => parseTerminalAuthorizationMessage(`${message}\nnonsense`)).toThrow('field');
  });

  it('requires job, node and expiresAt', () => {
    const withoutNode = message
      .split('\n')
      .filter((line) => !line.startsWith('node:'))
      .join('\n');
    expect(() => parseTerminalAuthorizationMessage(withoutNode)).toThrow('node');
  });
});

describe('isSafeTerminalOperation', () => {
  it.each(['op', 'op-1', 'a.b_c:2', 'ABC'])('accepts %s', (op) => {
    expect(isSafeTerminalOperation(op)).toBe(true);
  });

  it.each(['', 'has space', 'semi;colon', 'new\nline'])('rejects %j', (op) => {
    expect(isSafeTerminalOperation(op)).toBe(false);
  });
});

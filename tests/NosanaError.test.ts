import { describe, it, expect } from 'vitest';
import { NosanaError, ErrorCodes } from '../src/errors/NosanaError.js';

describe('NosanaError', () => {
  it('sets message, code, name, and details', () => {
    const details = { info: 'x' };
    const err = new NosanaError('msg', ErrorCodes.RPC_ERROR, details);
    expect(err.message).toBe('msg');
    expect(err.code).toBe(ErrorCodes.RPC_ERROR);
    expect(err.details).toEqual(details);
    expect(err.name).toBe('NosanaError');
  });

  it('is an instance of Error', () => {
    const err = new NosanaError('oops', ErrorCodes.PROGRAM_ERROR);
    expect(err).toBeInstanceOf(Error);
  });

  it('exposes known error codes', () => {
    expect(ErrorCodes).toEqual({
      INVALID_NETWORK: 'INVALID_NETWORK',
      INVALID_CONFIG: 'INVALID_CONFIG',
      RPC_ERROR: 'RPC_ERROR',
      TRANSACTION_ERROR: 'TRANSACTION_ERROR',
      PROGRAM_ERROR: 'PROGRAM_ERROR',
      VALIDATION_ERROR: 'VALIDATION_ERROR',
      NO_WALLET: 'NO_WALLET',
      FILE_ERROR: 'FILE_ERROR',
      WALLET_CONVERSION_ERROR: 'WALLET_CONVERSION_ERROR',
    });
  });
});



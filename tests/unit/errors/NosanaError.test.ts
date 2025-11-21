import { describe, it, expect } from 'vitest';
import { NosanaError, ErrorCodes } from '../../../src/errors/NosanaError.js';

describe('NosanaError', () => {
  it('creates error with message, code, and optional details', () => {
    const errorMessage = 'Something went wrong';
    const errorCode = ErrorCodes.RPC_ERROR;
    const errorDetails = { info: 'additional context' };
    const err = new NosanaError(errorMessage, errorCode, errorDetails);

    expect(err.message).toBe(errorMessage);
    expect(err.code).toBe(errorCode);
    expect(err.details).toEqual(errorDetails);
    expect(err.name).toBe('NosanaError');
  });

  it('is an instance of Error', () => {
    const errorMessage = 'Operation failed';
    const errorCode = ErrorCodes.PROGRAM_ERROR;
    const err = new NosanaError(errorMessage, errorCode);
    expect(err).toBeInstanceOf(Error);
  });

  it('has all expected error codes defined', () => {
    const expectedCodes = [
      'INVALID_NETWORK',
      'INVALID_CONFIG',
      'RPC_ERROR',
      'TRANSACTION_ERROR',
      'PROGRAM_ERROR',
      'VALIDATION_ERROR',
      'NO_WALLET',
      'FILE_ERROR',
      'WALLET_CONVERSION_ERROR',
    ];

    expectedCodes.forEach((code) => {
      expect(ErrorCodes[code as keyof typeof ErrorCodes]).toBe(code);
    });
  });
});

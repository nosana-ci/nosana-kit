import { NosanaError, ErrorCodes } from '../NosanaError';

describe('NosanaError', () => {
  it('should create an error with message and code', () => {
    const error = new NosanaError('Test error', ErrorCodes.RPC_ERROR);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe(ErrorCodes.RPC_ERROR);
    expect(error.name).toBe('NosanaError');
  });

  it('should include details when provided', () => {
    const details = { foo: 'bar' };
    const error = new NosanaError('Test error', ErrorCodes.RPC_ERROR, details);
    expect(error.details).toEqual(details);
  });

  it('should be instanceof Error', () => {
    const error = new NosanaError('Test error', ErrorCodes.RPC_ERROR);
    expect(error instanceof Error).toBe(true);
  });

  it('should have correct error codes', () => {
    expect(ErrorCodes).toEqual({
      INVALID_NETWORK: 'INVALID_NETWORK',
      INVALID_CONFIG: 'INVALID_CONFIG',
      RPC_ERROR: 'RPC_ERROR',
      TRANSACTION_ERROR: 'TRANSACTION_ERROR',
      PROGRAM_ERROR: 'PROGRAM_ERROR',
      VALIDATION_ERROR: 'VALIDATION_ERROR',
    });
  });
}); 
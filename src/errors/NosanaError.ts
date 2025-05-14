export class NosanaError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'NosanaError';
  }
}

export const ErrorCodes = {
  INVALID_NETWORK: 'INVALID_NETWORK',
  INVALID_CONFIG: 'INVALID_CONFIG',
  RPC_ERROR: 'RPC_ERROR',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',
  PROGRAM_ERROR: 'PROGRAM_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]; 
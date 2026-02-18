import { vi } from 'vitest';
import type { QueryClient } from '../src/client';
import type { ExternalSolanaFunctions } from '../src/types';

/**
 * Creates a mock QueryClient for testing
 * Returns an object with vi.fn() mocks that can be used with .mockResolvedValue() etc
 * Typed as QueryClient for compatibility with code that expects a real client
 */
export function createMockQueryClient(): QueryClient {
  return {
    GET: vi.fn(),
    POST: vi.fn(),
    PUT: vi.fn(),
    DELETE: vi.fn(),
    OPTIONS: vi.fn(),
    HEAD: vi.fn(),
    PATCH: vi.fn(),
    TRACE: vi.fn(),
    request: vi.fn(),
    use: vi.fn(),
    eject: vi.fn(),
  } as QueryClient;
}

/**
 * Creates mock Solana functions for testing
 */
export function createMockSolanaFunctions(): ExternalSolanaFunctions {
  return {
    getBalance: vi.fn(),
    transferTokensToRecipient: vi.fn(),
    deserializeSignSendAndConfirmTransaction: vi.fn(),
  };
}

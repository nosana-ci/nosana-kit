/**
 * Global test setup
 *
 * This file runs before all tests to configure global test behavior.
 * It's automatically loaded by Vitest via the setupFiles configuration.
 */

import { beforeEach, afterEach, vi } from 'vitest';

// Minimal global mock of @solana/kit to prevent WebSocket connections in tests
// This is a boundary (external network dependency), so mocking is appropriate.
// Test files that need specific mock behavior can override this mock.
vi.mock('@solana/kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solana/kit')>();
  const rpc = {
    getProgramAccounts: vi.fn(),
    getTokenAccountsByOwner: vi.fn(),
    getBalance: vi.fn(() => ({
      send: vi.fn().mockResolvedValue({ value: BigInt(0) }),
    })),
    getLatestBlockhash: vi.fn(() => ({
      send: vi.fn().mockResolvedValue({
        value: { blockhash: 'mock-blockhash', lastValidBlockHeight: BigInt(0) },
      }),
    })),
  } as any;
  const rpcSubscriptions = {} as any;
  const sendAndConfirmTransaction = vi.fn().mockResolvedValue(undefined);

  return {
    ...actual,
    createSolanaRpc: vi.fn(() => rpc),
    createSolanaRpcSubscriptions: vi.fn(() => rpcSubscriptions),
    sendAndConfirmTransactionFactory: vi.fn(() => sendAndConfirmTransaction),
  };
});

// Global test hooks
beforeEach(() => {
  // Clear all mock call history before each test
  // This ensures test isolation - each test starts with clean mock state
  vi.clearAllMocks();
});

afterEach(() => {
  // Restore all mocks after each test
  // This restores original implementations and ensures no mocks leak between tests
  vi.restoreAllMocks();
});

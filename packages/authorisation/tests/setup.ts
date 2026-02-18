/**
 * Global test setup file
 * This file runs before all tests and sets up the testing environment
 */

import base58 from 'bs58';
import { vi, beforeEach, afterEach } from 'vitest';

declare global {
  var TEST_WALLET: Uint8Array;
  var TEST_WALLET_PUBLIC_KEY: Uint8Array;
  var TEST_WRONG_WALLET_PUBLIC_KEY: Uint8Array;
}

// Global test hooks
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  vi.setSystemTime(new Date('2024-12-16'));
  global.TEST_WALLET = base58.decode(process.env.TEST_SOLANA_WALLET as string);
  global.TEST_WALLET_PUBLIC_KEY = base58.decode(process.env.TEST_SOLANA_WALLET_PUBLIC_KEY as string);
  global.TEST_WRONG_WALLET_PUBLIC_KEY = base58.decode(process.env.TEST_WRONG_SOLANA_WALLET_PUBLIC_KEY as string);
});

afterEach(() => {
  // Clean up after each test
  vi.restoreAllMocks();
});

// Suppress console logs during tests (optional)
// Uncomment if you want to silence console output in tests
// global.console = {
//   ...console,
//   log: vi.fn(),
//   debug: vi.fn(),
//   info: vi.fn(),
//   warn: vi.fn(),
//   error: vi.fn(),
// };
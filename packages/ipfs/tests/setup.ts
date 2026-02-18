/**
 * Global test setup file
 * This file runs before all tests and sets up the testing environment
 */

import { vi, beforeEach, afterEach } from 'vitest';

// Global test hooks
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();

  global.TEST_HASH = "QmR9F9tMJWdhSCvqjPiTnthG4aEKz8DgJK35ko96YgbpXY"
  global.TEST_INVALID_HASH = "AbR9F9tMJWdhSCvqjPiTnthG4aEKz8DgJK35ko96YgbpXY"
  global.TEST_PIN_DATA = { name: "test", description: "This is a test" };
  global.TEST_PIN_ERROR = new Error("Pinning failed.");
  global.TEST_RETRIEVE_ERROR = new Error("Retrieval failed.");
  global.TEST_SOLANA_ARRAY = [41, 167, 9, 157, 163, 220, 198, 158, 116, 84, 100, 124, 200, 148, 159, 180, 168, 125, 94, 82, 33, 53, 20, 64, 183, 136, 76, 159, 186, 229, 100, 231];
  global.TEST_INVALID_SOLANA_ARRAY = global.TEST_SOLANA_ARRAY.slice(0, 30);
  global.TEST_FETCH_CLIENT = { GET: vi.fn(), POST: vi.fn() };
  global.TEST_IPFS_CONFIG = {
    gateway: 'https://ipfs.gateway.test',
    api: 'https://ipfs.api.test',
    jwt: 'test-jwt-token'
  };
  global.TEST_IPFS_CONFIG_NO_JWT = {
    gateway: 'https://ipfs.gateway.test',
    api: 'https://ipfs.api.test'
  };
  global.TEST_IPFS_RESPONSE = {
    IpfsHash: global.TEST_HASH,
    PinSize: 123,
    Timestamp: "2024-06-01T12:00:00Z"
  };
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
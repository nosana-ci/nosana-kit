
import { vi, beforeEach, afterEach } from 'vitest';

declare global {
}

// Global test hooks
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  vi.restoreAllMocks();
});
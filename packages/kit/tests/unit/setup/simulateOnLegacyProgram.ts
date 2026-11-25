import { vi } from 'vitest';

/** A `simulateTransaction` mock that succeeds, as the jobs program before the fee release does for a legacy layout. */
export function simulateOnLegacyProgram() {
  return vi.fn(() => ({ send: vi.fn().mockResolvedValue({ value: { err: null } }) }));
}

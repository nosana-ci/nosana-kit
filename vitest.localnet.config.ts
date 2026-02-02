import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/scenarios/specs/**/*.test.ts'],
    setupFiles: ['tests/scenarios/helpers/vitest.setup.ts'],
  },
});

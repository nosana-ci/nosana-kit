import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/localnet/specs/**/*.test.ts'],
    setupFiles: ['tests/localnet/helpers/vitest.setup.ts'],
  },
});


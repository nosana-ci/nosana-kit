import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/scripts/**',
      ],
    },
    include: ['src/**/*.{test,spec}.{js,ts}', 'test/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],
    typecheck: {
      tsconfig: './tsconfig.json'
    }
  },
});

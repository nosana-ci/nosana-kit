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
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/scripts/**',
        "**/types.ts"
      ],
    },
    include: ['src/**/*.{test,spec}.{js,ts}', 'test/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', "**/*.types.ts"],
    typecheck: {
      tsconfig: './tsconfig.json'
    }
  },
});

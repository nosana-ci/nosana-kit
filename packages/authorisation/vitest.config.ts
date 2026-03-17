import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    env: {
      TEST_SOLANA_WALLET: 'ur8xmv5JChjUck8WzRjyaZfjfrdTpX427GnU7E6sZFZUTtBxF6kax67aK6CneKcYf4xCicLfYQ4kDKmT3Kk6gBK',
      TEST_SOLANA_WALLET_PUBLIC_KEY: '4bCBxyfdVCD6ZLsfd9EwcaCyWQT7cte94fsGKm6BD6Mo',
      TEST_WRONG_SOLANA_WALLET_PUBLIC_KEY: '5bCBxyfdVCD6ZLsfd9EwcaCyWQT7cte94fsGKm6BD6Mo'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
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
  },
});

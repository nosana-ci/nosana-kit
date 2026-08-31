import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    ignores: ['**/*.test.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // True globals
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        Buffer: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly',
        crypto: 'readonly',
        Crypto: 'readonly',
        CryptoKey: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        global: 'readonly',
        globalThis: 'readonly',
        Headers: 'readonly',
        history: 'readonly',
        localStorage: 'readonly',
        location: 'readonly',
        navigator: 'readonly',
        process: 'readonly',
        queueMicrotask: 'readonly',
        Request: 'readonly',
        RequestInit: 'readonly',
        Response: 'readonly',
        sessionStorage: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        structuredClone: 'readonly',
        SubtleCrypto: 'readonly',
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        window: 'readonly',

        // CommonJS-specific (appear global but are module-scoped)
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        module: 'writable',
        require: 'readonly',

        // TypeScript types/namespaces
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-empty-object-type': 0,
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'off',
      'semi': ['error', 'always'],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];

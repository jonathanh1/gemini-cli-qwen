import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/types.ts'], // Exclude test files and types if any
    },
  },
});

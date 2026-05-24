import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/e2e/**/*.e2e-spec.ts'],
    testTimeout: 15000,
    hookTimeout: 30000,
    setupFiles: ['test/e2e/setup.ts'],
  },
});

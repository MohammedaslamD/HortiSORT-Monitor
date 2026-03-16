import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: './src/__tests__/setup.ts',
    // Run test files one at a time — they share a single PostgreSQL DB so
    // parallel execution causes truncate/insert races between suites.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://hortisort:hortisort_dev@localhost:5432/hortisort_test',
      JWT_SECRET: 'test-secret-key-min-8',
      PORT: '4001',
    },
    pool: 'forks',
  },
})

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-for-vitest-only-0123456789',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    },
  },
});

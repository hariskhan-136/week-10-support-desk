import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/app.e2e-spec.ts'],
    globals: true,
  },
});

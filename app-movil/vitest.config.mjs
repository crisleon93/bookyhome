import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: '..',
  test: {
    environment: 'node',
    include: ['app-movil/src/test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './app-movil/coverage',
      include: ['app-movil/src/**/*.{js,jsx}'],
      exclude: ['app-movil/src/test/**'],
      reporter: ['text', 'lcov'],
    },
  },
});

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: '..',
  resolve: {
    alias: [
      {
        find: /^\.{2}\/components\/AddressMapFrame$/,
        replacement: fileURLToPath(new URL('./src/components/AddressMapFrame.web.jsx', import.meta.url)),
      },
    ],
  },
  define: {
    __DEV__: true,
  },
  test: {
    environment: 'jsdom',
    include: ['app-movil/src/test/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './app-movil/coverage',
      include: ['app-movil/src/**/*.{js,jsx}'],
      exclude: ['app-movil/src/test/**'],
      reporter: ['text', 'lcov'],
    },
  },
});

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    maxConcurrency: 20,
    setupFiles: [path.resolve(__dirname, 'scripts/vitest/setup.js')],
    clearMocks: true,
    alias: {
      urql: path.resolve(__dirname, 'node_modules/urql/src'),
      '@urql/core': path.resolve(__dirname, 'node_modules/@urql/core/src'),
      '@urql/introspection': path.resolve(
        __dirname,
        'node_modules/@urql/introspection/src'
      ),
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/e2e-tests/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress}.config.*',
    ],
  },
});

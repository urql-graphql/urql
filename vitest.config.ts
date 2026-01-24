import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  resolve: {
    alias: {
      'preact/hooks':
        __dirname +
        '/packages/preact-urql/node_modules/preact/hooks/dist/hooks.js',
      preact:
        __dirname + '/packages/preact-urql/node_modules/preact/dist/preact.js',
    },
  },
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    setupFiles: [resolve(__dirname, 'scripts/vitest/setup.js')],
    clearMocks: true,
    exclude: [
      'packages/solid-urql/**',
      'packages/solid-start-urql/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/e2e-tests/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress}.config.*',
    ],
  },
});

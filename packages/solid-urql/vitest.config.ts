import { defineConfig, mergeConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import rootConfig from '../../vitest.config';

export default mergeConfig(
  rootConfig,
  defineConfig({
    plugins: [solidPlugin()],
    test: {
      globals: true,
    },
  })
);

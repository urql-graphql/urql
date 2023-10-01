import { mergeConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import rootConfig from '../../vitest.config';
import { defineProject } from 'vitest/config';

export default mergeConfig(
  rootConfig,
  defineProject({
    plugins: [solidPlugin()],
    test: {
      globals: true,
    },
  })
);

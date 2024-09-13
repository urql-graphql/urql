import { mergeConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';
import baseConfig from '../../vitest.config';

export default mergeConfig(baseConfig, {
  // Must be pinned to 2.8.2, see: https://github.com/solidjs/vite-plugin-solid/issues/141
  plugins: [solidPlugin({ hot: false })],
  resolve: {
    dedupe: ['solid-js'],
  },
});

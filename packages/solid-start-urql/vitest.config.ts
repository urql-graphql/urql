import { mergeConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';
import baseConfig from '../../vitest.config';

export default mergeConfig(baseConfig, {
  plugins: [solidPlugin({ hot: false })],
});

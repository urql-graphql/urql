import { mergeConfig } from 'vitest/config';
import path from 'node:path';
import baseConfig from '../../vitest.config';

console.log(path.resolve(__dirname, './node_modules/preact/hooks/dist/hooks.js'));
export default mergeConfig(baseConfig, {
  resolve: {
    alias: {
      'preact/hooks': path.resolve(__dirname, './node_modules/preact/hooks/dist/hooks.js'),
      preact: path.resolve(__dirname, './node_modules/preact/dist/preact.js')
    },
  },
});

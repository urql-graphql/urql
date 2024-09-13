import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.config';

export default mergeConfig(baseConfig, {
  resolve: {
    alias: {
      'preact/hooks':
        __dirname +
        '/packages/preact-urql/node_modules/preact/hooks/dist/hooks.js',
      preact:
        __dirname + '/packages/preact-urql/node_modules/preact/dist/preact.js',
    },
  },
});

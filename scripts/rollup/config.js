import { makePlugins } from './plugins';
import * as settings from './settings';

const input = {
  [settings.name]: settings.source,
};

const config = {
  input,
  external: settings.isExternal,
  treeshake: {
    unknownGlobalSideEffects: false,
    tryCatchDeoptimization: false,
    moduleSideEffects: false
  }
};

const output = (format = 'cjs', ext = '.js') => ({
  chunkFileNames: '[name]-[hash].[format]' + ext,
  entryFileNames: '[name].[format]' + ext,
  dir: './dist',
  exports: 'named',
  externalLiveBindings: false,
  sourcemap: true,
  esModule: false,
  indent: false,
  freeze: false,
  strict: false,
  format,
});

export default [
  {
    ...config,
    plugins: makePlugins({ isProduction: false }),
    output: [
      output('cjs', '.js'),
      output('esm', '.js'),
    ],
  },
  {
    ...config,
    plugins: makePlugins({ isProduction: true }),
    output: [
      output('cjs', '.min.js'),
      output('esm', '.min.js'),
    ],
  },
];

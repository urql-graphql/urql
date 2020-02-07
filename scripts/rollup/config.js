import genPackageJson from 'rollup-plugin-generate-package-json';
import { relative, join } from 'path';
import { makePlugins } from './plugins';
import * as settings from './settings';

const plugins = makePlugins({ isProduction: false });

const input = settings.sources.reduce((acc, source) => {
  acc[source.name] = source.source;
  if (source.name !== settings.name) {
    const rel = relative(source.dir, process.cwd());
    plugins.push(genPackageJson({
      outputFolder: source.dir,
      baseContents: {
        name: source.name,
        private: true,
        main: join(rel, source.main),
        module: join(rel, source.module),
        types: join(rel, source.types),
        source: join(rel, source.source),
      }
    }));
  }

  return acc;
}, {});

const config = {
  input,
  external: settings.isExternal,
  onwarn() {},
  treeshake: {
    unknownGlobalSideEffects: false,
    tryCatchDeoptimization: false,
    moduleSideEffects: false
  }
};

const output = (format = 'cjs', ext = '.js') => ({
  chunkFileNames: '[hash].[format]' + ext,
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
    plugins,
    output: [
      output('cjs', '.js'),
      output('esm', '.js'),
    ],
  },
  !settings.isCI && {
    ...config,
    plugins: makePlugins({ isProduction: true }),
    output: [
      output('cjs', '.min.js'),
      output('esm', '.min.js'),
    ],
  },
].filter(Boolean);

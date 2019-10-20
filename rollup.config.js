import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

const external = [];

if (pkg.peerDependencies) {
  external.push(...Object.keys(pkg.peerDependencies));
}

if (pkg.dependencies) {
  external.push(...Object.keys(pkg.dependencies));
}

const terserPretty = terser({
  sourcemap: true,
  warnings: true,
  ecma: 5,
  keep_fnames: true,
  ie8: false,
  compress: {
    pure_getters: true,
    toplevel: true,
    booleans_as_integers: false,
    keep_fnames: true,
    keep_fargs: true,
    if_return: false,
    ie8: false,
    sequences: false,
    loops: false,
    conditionals: false,
    join_vars: false,
  },
  mangle: false,
  output: {
    beautify: true,
    braces: true,
    indent_level: 2,
  },
});

const terserMinified = terser({
  sourcemap: true,
  warnings: true,
  ecma: 5,
  ie8: false,
  toplevel: true,
  compress: {
    keep_infinity: true,
    pure_getters: true,
    passes: 10,
  },
  output: {
    comments: false,
  },
});

export default {
  input: './src/index.ts',
  external,
  plugins: [
    resolve({
      mainFields: ['module', 'jsnext', 'main'],
      browser: true,
    }),
    commonjs({
      ignoreGlobal: true,
      include: /\/node_modules\//,
      namedExports: {
        react: Object.keys(require('react')),
      },
    }),
    typescript({
      typescript: require('typescript'),
      cacheRoot: './node_modules/.cache/.rts2_cache',
      useTsconfigDeclarationDir: true,
      tsconfigDefaults: {
        compilerOptions: {
          sourceMap: true,
        },
      },
    }),
    // Compile TypeScript files using Babel.
    babel({ extensions, include: ['src/**/*'], exclude: 'node_modules/**' }),
    terserPretty,
  ],

  output: [
    {
      file: './dist/next-urql.min.js',
      format: 'cjs',
    },
    {
      file: './dist/next-urql.es.min.js',
      format: 'esm',
    },
  ],
};

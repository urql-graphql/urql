/* eslint-disable @typescript-eslint/camelcase */
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';
import buble from '@rollup/plugin-buble';

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
  warnings: true,
  ecma: 5,
  keep_fnames: true,
  compress: {
    conditionals: false,
    if_return: false,
    join_vars: false,
    keep_fnames: true,
    loops: false,
    pure_getters: true,
    toplevel: true,
    sequences: false,
  },
  mangle: false,
  output: {
    braces: true,
    indent_level: 2,
  },
});

const terserMinified = terser({
  warnings: true,
  ecma: 5,
  toplevel: true,
  compress: {
    keep_infinity: true,
    passes: 10,
    pure_getters: true,
  },
});

const makePlugins = isProduction =>
  [
    resolve({
      mainFields: ['module', 'jsnext', 'main'],
      browser: true,
    }),
    commonjs({
      ignoreGlobal: true,
      include: /\/node_modules\//,
      namedExports: {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
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
      tsconfigOverride: {
        compilerOptions: {
          declaration: !isProduction,
          declarationDir: './dist/types',
          target: 'es6',
        },
        include: ['src/**/*'],
        exclude: ['__tests__/**/*'],
      },
    }),
    buble({
      transforms: {
        unicodeRegExp: false,
        dangerousForOf: true,
        dangerousTaggedTemplateString: true,
        generator: false,
      },
      objectAssign: 'Object.assign',
      exclude: 'node_modules/**',
    }),
    babel({
      babelrc: false,
      extensions,
      include: ['src/**/*'],
      exclude: 'node_modules/**',
      plugins: [
        '@babel/plugin-transform-object-assign',
        [
          'babel-plugin-transform-async-to-promises',
          {
            inlineHelpers: true,
            externalHelpers: true,
          },
        ],
      ],
    }),
    isProduction &&
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
    isProduction ? terserMinified : terserPretty,
  ].filter(Boolean);

export default [
  {
    input: './src/index.ts',
    external,
    plugins: makePlugins(false),
    output: [
      {
        file: './dist/next-urql.js',
        format: 'cjs',
      },
      {
        file: './dist/next-urql.es.js',
        format: 'esm',
      },
    ],
  },
  {
    input: './src/index.ts',
    external,
    plugins: makePlugins(true),
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
  },
];

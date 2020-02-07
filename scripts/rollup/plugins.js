import { DEFAULT_EXTENSIONS } from '@babel/core';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import buble from '@rollup/plugin-buble';
import replace from '@rollup/plugin-replace';
import babel from 'rollup-plugin-babel';
import compiler from '@ampproject/rollup-plugin-closure-compiler';
import { terser } from 'rollup-plugin-terser';

import babelPluginTransformPipe from '../babel/transform-pipe';
import babelPluginTransformInvariant from '../babel/transform-invariant-warning';

import * as settings from './settings';

export const makePlugins = ({ isProduction } = {}) => [
  nodeResolve({
    dedupe: settings.externalModules,
    mainFields: ['module', 'jsnext', 'main'],
    preferBuiltins: false,
    browser: true
  }),
  commonjs({
    ignoreGlobal: true,
    include: /\/node_modules\//,
    namedExports: settings.hasReact ? {
      react: Object.keys(require('react'))
    } : {},
  }),
  typescript({
    useTsconfigDeclarationDir: true,
    objectHashIgnoreUnknownHack: true,
    tsconfigDefaults: {
      compilerOptions: {
        sourceMap: true
      },
    },
    tsconfigOverride: {
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/test-utils/*'
      ],
      compilerOptions: {
        baseUrl: '.',
        declaration: !isProduction,
        declarationDir: './dist/types',
        target: 'es6',
      },
    },
  }),
  buble({
    transforms: {
      unicodeRegExp: false,
      dangerousForOf: true,
      dangerousTaggedTemplateString: true
    },
    objectAssign: 'Object.assign',
    exclude: 'node_modules/**'
  }),
  babel({
    babelrc: false,
    extensions: [...DEFAULT_EXTENSIONS, 'ts', 'tsx'],
    exclude: 'node_modules/**',
    presets: [],
    plugins: [
      babelPluginTransformPipe,
      babelPluginTransformInvariant,
      'babel-plugin-closure-elimination',
      '@babel/plugin-transform-object-assign',
      settings.hasReact && ['@babel/plugin-transform-react-jsx', {
        pragma: 'React.createElement',
        pragmaFrag: 'React.Fragment',
        useBuiltIns: true
      }],
      settings.hasPreact && ['@babel/plugin-transform-react-jsx', {
        pragma: 'h',
        useBuiltIns: true
      }],
      ['babel-plugin-transform-async-to-promises', {
        inlineHelpers: true,
        externalHelpers: true
      }]
    ].filter(Boolean)
  }),
  isProduction && replace({
    'process.env.NODE_ENV': JSON.stringify('production')
  }),
  !settings.mayReexport && compiler({
    formatting: 'PRETTY_PRINT',
    compilation_level: 'SIMPLE_OPTIMIZATIONS'
  }),
  isProduction ? terserMinified : terserPretty
].filter(Boolean);

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
    join_vars: false
  },
  mangle: false,
  output: {
    beautify: true,
    braces: true,
    indent_level: 2
  }
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
    passes: 10
  },
  output: {
    comments: false
  }
});



import * as path from 'path';

import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import sucrase from '@rollup/plugin-sucrase';
import buble from '@rollup/plugin-buble';
import replace from '@rollup/plugin-replace';
import babel from 'rollup-plugin-babel';
import compiler from '@ampproject/rollup-plugin-closure-compiler';
import visualizer from 'rollup-plugin-visualizer';
import { terser } from 'rollup-plugin-terser';

import cleanup from './cleanup-plugin.js'
import babelPluginTransformPipe from '../babel/transform-pipe';
import babelPluginTransformInvariant from '../babel/transform-invariant-warning';
import babelPluginTransformDebugTarget from '../babel/transform-debug-target';

import * as settings from './settings';

export const makePlugins = ({ isProduction } = {}) => [
  resolve({
    dedupe: settings.externalModules,
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
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
  settings.isCI
    ? sucrase({
      exclude: ['node_modules/**'],
      transforms: ['jsx', 'typescript']
    })
    : typescript({
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        exclude: [
          'src/**/*.test.ts',
          'src/**/*.test.tsx',
          'src/**/test-utils/*'
        ],
        compilerOptions: {
          sourceMap: true,
          noEmit: false,
          declaration: !isProduction,
          declarationDir: settings.types,
          target: 'esnext',
        },
      },
    }),
  buble({
    transforms: {
      unicodeRegExp: false,
      dangerousForOf: true,
      dangerousTaggedTemplateString: true,
      asyncAwait: false,
    },
    objectAssign: 'Object.assign',
    exclude: 'node_modules/**'
  }),
  babel({
    babelrc: false,
    extensions: ['js', 'jsx', 'ts', 'tsx'],
    exclude: 'node_modules/**',
    presets: [],
    plugins: [
      babelPluginTransformDebugTarget,
      babelPluginTransformPipe,
      babelPluginTransformInvariant,
      'babel-plugin-modular-graphql',
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
  cleanup(),
  isProduction ? terserMinified : terserPretty,
  isProduction && settings.isAnalyze && visualizer({
    filename: path.resolve(settings.cwd, 'node_modules/.cache/analyze.html'),
    sourcemap: true,
  }),
].filter(Boolean);

const terserPretty = terser({
  warnings: true,
  ecma: 5,
  keep_fnames: true,
  ie8: false,
  compress: {
    // We need to hoist vars for process.env.NODE_ENV if-clauses for Metro:
    hoist_vars: true,
    hoist_funs: true,
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



import * as path from 'path';
import * as React from 'react';

import tsConfigPaths from 'rollup-plugin-tsconfig-paths';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import sucrase from '@rollup/plugin-sucrase';
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';
import visualizer from 'rollup-plugin-visualizer';
import terser from '@rollup/plugin-terser';

import cleanup from './cleanup-plugin.mjs'
import cjsCheck from './cjs-check-plugin.mjs'
import babelPluginTransformPipe from '../babel/transform-pipe.mjs';
import babelPluginTransformInvariant from '../babel/transform-invariant-warning.mjs';
import babelPluginTransformDebugTarget from '../babel/transform-debug-target.mjs';

import * as settings from './settings.mjs';

export const makePlugins = () => [
  tsConfigPaths(),
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
      react: Object.keys(React)
    } : {},
  }),
  typescript({
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
        declaration: true,
        declarationDir: settings.types,
        target: 'esnext',
      },
    },
  }),
  sucrase({
    exclude: ['node_modules/**'],
    transforms: ['jsx', 'typescript']
  }),
  babel({
    babelrc: false,
    babelHelpers: 'bundled',
    extensions: ['js', 'jsx', 'ts', 'tsx'],
    exclude: 'node_modules/**',
    presets: [],
    plugins: [
      '@babel/plugin-transform-block-scoping',
      babelPluginTransformDebugTarget,
      babelPluginTransformPipe,
      babelPluginTransformInvariant,
      settings.hasReact && ['@babel/plugin-transform-react-jsx', {
        pragma: 'React.createElement',
        pragmaFrag: 'React.Fragment',
        useBuiltIns: true
      }],
      !settings.hasReact && settings.hasPreact && ['@babel/plugin-transform-react-jsx', {
        pragma: 'h',
        useBuiltIns: true
      }],
    ].filter(Boolean)
  }),
];

export const makeOutputPlugins = ({ isProduction, extension }) => {
  if (typeof isProduction !== 'boolean')
    throw new Error('Missing option `isProduction` on makeOutputPlugins({ ... })');
  if (extension !== '.mjs' && extension !== '.js')
    throw new Error('Missing option `extension` on makeOutputPlugins({ ... })');

  return [
    isProduction && replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    cjsCheck({ extension }),
    cleanup({ extension, maintainImports: settings.name === 'urql-introspection' }),
    isProduction ? terserMinified : (extension !== '.js' ? terserPretty : null),
    isProduction && settings.isAnalyze && visualizer({
      filename: path.resolve(settings.cwd, 'node_modules/.cache/analyze.html'),
      sourcemap: true,
    }),
  ].filter(Boolean);
};

const terserPretty = terser({
  warnings: true,
  ecma: 2015,
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
  mangle: {
    module: true,
    keep_fnames: true,
  },
  output: {
    beautify: true,
    braces: true,
    indent_level: 2
  }
});

const terserMinified = terser({
  warnings: true,
  ecma: 2015,
  ie8: false,
  toplevel: true,
  compress: {
    keep_infinity: true,
    pure_getters: true,
    passes: 10
  },
  mangle: {
    module: true,
  },
  output: {
    comments: false
  }
});



import json from 'rollup-plugin-json';
import sourcemaps from 'rollup-plugin-sourcemaps';
import alias from 'rollup-plugin-alias';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import buble from 'rollup-plugin-buble';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.es6', '.es', '.mjs'];
const pkgInfo = require('./package.json');

const external = ['dns', 'fs', 'path', 'url'];

if (pkgInfo.peerDependencies) {
  external.push(...Object.keys(pkgInfo.peerDependencies));
}

if (pkgInfo.dependencies) {
  external.push(...Object.keys(pkgInfo.dependencies));
}

const externalPredicate = new RegExp(`^(${external.join('|')})($|/)`);
const externalTest = id => {
  if (id === 'babel-plugin-transform-async-to-promises/helpers') {
    return false;
  }

  return externalPredicate.test(id);
};

const plugins = [
  sourcemaps(),
  json(),
  alias({
    resolve: EXTENSIONS
  }),
  nodeResolve({
    mainFields: ['module', 'jsnext', 'main'],
    browser: true
  }),
  commonjs({
    ignoreGlobal: true,
    include: /\/node_modules\//,
    namedExports: {
      'react': Object.keys(require('react'))
    },
  }),
  typescript({
    typescript: require('typescript'),
    cacheRoot: './node_modules/.cache/.rts2_cache',
    tsconfigDefaults: {
      compilerOptions: {
        sourceMap: true,
        declaration: true
      },
    },
    tsconfigOverride: {
      compilerOptions: {
        target: 'esnext',
      },
    },
  }),
  buble({
    transforms: {
      unicodeRegExp: false,
      spreadRest: false,
      dangerousForOf: true,
      dangerousTaggedTemplateString: true
    },
    objectAssign: 'Object.assign',
    exclude: 'node_modules/**'
  }),
  babel({
    babelrc: false,
    extensions: EXTENSIONS,
    exclude: 'node_modules/**',
    passPerPreset: true,
    presets: [
      ['@babel/preset-env', {
        loose: true,
        modules: false,
        exclude: ['transform-async-to-generator']
      }]
    ],
    plugins: [
      '@babel/plugin-external-helpers',
      ['@babel/plugin-proposal-object-rest-spread', {
        loose: true,
        useBuiltIns: true
      }],
      ['@babel/plugin-transform-react-jsx', {
        pragma: 'React.createElement',
        pragmaFrag: 'React.Fragment',
        useBuiltIns: true
      }],
      ['babel-plugin-transform-async-to-promises', {
        inlineHelpers: true,
        externalHelpers: true
      }],
      ['@babel/plugin-proposal-class-properties', {
        loose: true
      }]
    ]
  }),
  terser({
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
  })
];

const config = {
  input: './src/index.ts',
  external: externalTest,
  plugins,
  treeshake: {
    propertyReadSideEffects: false
  },
  output: [
    {
      sourcemap: true,
      legacy: true,
      freeze: false,
      esModule: false,
      file: './dist/urql.js',
      format: 'cjs'
    },
    {
      sourcemap: true,
      legacy: true,
      freeze: false,
      esModule: false,
      file: './dist/urql.es.js',
      format: 'esm'
    }
  ]
};

export default config;

import { DEFAULT_EXTENSIONS } from '@babel/core';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import buble from 'rollup-plugin-buble';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';
import transformPipe from './scripts/transform-pipe';

const pkgInfo = require('./package.json');

let external = ['dns', 'fs', 'path', 'url'];
if (pkgInfo.peerDependencies)
  external.push(...Object.keys(pkgInfo.peerDependencies));
if (pkgInfo.dependencies)
  external.push(...Object.keys(pkgInfo.dependencies));

external = external.filter(x => x !== 'react-wonka');

const externalPredicate = new RegExp(`^(${external.join('|')})($|/)`);
const externalTest = id => {
  if (id === 'babel-plugin-transform-async-to-promises/helpers') {
    return false;
  }

  return externalPredicate.test(id);
};

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

const makePlugins = (isProduction = false) => [
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
    useTsconfigDeclarationDir: true,
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
        declaration: !isProduction,
        declarationDir: './dist/types/',
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
      transformPipe,
      'babel-plugin-closure-elimination',
      '@babel/plugin-transform-object-assign',
      ['@babel/plugin-transform-react-jsx', {
        pragma: 'React.createElement',
        pragmaFrag: 'React.Fragment',
        useBuiltIns: true
      }],
      ['babel-plugin-transform-async-to-promises', {
        inlineHelpers: true,
        externalHelpers: true
      }]
    ]
  }),
  isProduction && replace({
    'process.env.NODE_ENV': JSON.stringify('production')
  }),
  isProduction ? terserMinified : terserPretty
].filter(Boolean);

const config = {
  input: './src/index.ts',
  external: externalTest,
  treeshake: {
    propertyReadSideEffects: false
  }
};

export default [
  {
    ...config,
    plugins: makePlugins(false),
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
  }, {
    ...config,
    plugins: makePlugins(true),
    onwarn: () => {},
    output: [
      {
        sourcemap: false,
        legacy: true,
        freeze: false,
        file: './dist/urql.min.js',
        format: 'cjs'
      },
      {
        sourcemap: false,
        legacy: true,
        freeze: false,
        file: './dist/urql.es.min.js',
        format: 'esm'
      }
    ]
  }
];

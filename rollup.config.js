import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import commonJs from 'rollup-plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import replace from 'rollup-plugin-replace';
import pkg from './package.json';

const basePlugins = [
  nodeResolve({
    extensions: ['.ts', '.tsx'],
  }),
  sourceMaps(),
  typescript({
    typescript: require('typescript'),
  }),
  commonJs({
    ignoreGlobal: true,
    extensions: ['.js', '.ts', '.tsx'],
  }),
  babel(),
];

const makePlugins = (isProd = false) => [
  ...basePlugins,
  ...(isProd
    ? [
        replace({
          'process.env.NODE_ENV': '"production"',
        }),
        uglify({ sourceMap: true }),
      ]
    : []),
];

const baseConfig = {
  input: 'src/index.ts',
  globals: {
    'prop-types': 'PropTypes',
    react: 'React',
  },
  external: [
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.peerDependencies),
  ],
  sourcemap: true,
};

export default [
  Object.assign({}, baseConfig, {
    plugins: makePlugins(false),
    output: [
      { file: 'bundles/urql.es.js', format: 'es' },
      { file: 'bundles/urql.cjs.js', format: 'cjs' },
    ],
  }),
  Object.assign({}, baseConfig, {
    plugins: makePlugins(true),
    output: [
      { file: 'bundles/urql.es.min.js', format: 'es' },
      { file: 'bundles/urql.cjs.min.js', format: 'cjs' },
    ],
  }),
];

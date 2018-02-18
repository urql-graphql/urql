const { NODE_ENV, BABEL_ENV } = process.env;
const test = NODE_ENV === 'test';
const cjs = BABEL_ENV === 'commonjs' || test;
const loose = true;

module.exports = {
  presets: [
    '@babel/typescript',
    '@babel/react',
    ['@babel/stage-3', { loose }],
    ['@babel/env', { modules: false, loose }],
  ],
  plugins: [
    ['@babel/proposal-class-properties', { loose }],
    '@babel/proposal-pipeline-operator',
    [
      'module-resolver',
      {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        root: ['.'],
      },
    ],
    test && './coverage-fix.js',
    // intentionally not using `modules: 'cjs'` conditionally in @babel/env options
    // `loose` commonjs makes __esModule property enumerable
    // thus "breaking" spreading namespaced imports
    cjs && '@babel/transform-modules-commonjs',
  ].filter(Boolean),
};

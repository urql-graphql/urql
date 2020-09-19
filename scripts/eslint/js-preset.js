module.exports = {
  extends: [
    './common.js',
    'plugin:import/errors',
  ],
  rules: {
    'consistent-return': 'warn',
    'no-magic-numbers': 'off', // TODO
    'react/jsx-key': 'off',
    'react/jsx-handler-names': 'off',
    'import/no-internal-modules': 'off',
    'es5/no-es6-methods': 'off',
  },
};

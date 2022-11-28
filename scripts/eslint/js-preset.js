module.exports = {
  extends: [
    './common.js',
  ],
  rules: {
    'consistent-return': 'warn',
    'no-magic-numbers': 'off', // TODO
    'react/jsx-key': 'off',
    'react/jsx-handler-names': 'off',
    'es5/no-es6-methods': 'off',
  },
};

module.exports = {
  parserOptions: {
    ecmaVersion: 9,
    sourceType: 'module',
    ecmaFeatures: {
      modules: true,
      jsx: true,
    },
  },
  extends: [
    'plugin:react/recommended',
    'prettier',
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    'benchmark/',
    'example/',
    'examples/',
    'scripts/'
  ],
  plugins: [
    'react-hooks',
    'prettier',
  ],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/no-children-prop': 'off',
    'sort-keys': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'prefer-arrow/prefer-arrow-functions': 'off',

    'prettier/prettier': ['error', {
      singleQuote: true,
      arrowParens: 'avoid',
      trailingComma: 'es5',
    }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};

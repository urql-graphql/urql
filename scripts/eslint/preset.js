module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 9,
    sourceType: 'module',
    ecmaFeatures: {
      modules: true,
      jsx: true,
    },
  },

  ignorePatterns: [
    'node_modules/',
    'dist/',
    'dist-prod/',
    'build/',
    'coverage/',
    'benchmark/',
    'scripts/',
    'docs/',
  ],

  settings: {
    react: {
      version: 'detect',
    },
  },

  extends: ['eslint:recommended', 'prettier'],

  plugins: [
    '@typescript-eslint',
    'prettier',
    'es5',
  ],

  rules: {
    'no-undef': 'off',
    'no-empty': 'off',
    'sort-keys': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'prefer-arrow/prefer-arrow-functions': 'off',

    'es5/no-for-of': 'off',
    'es5/no-generators': 'off',
    'es5/no-typeof-symbol': 'warn',

    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
    }],

    'prettier/prettier': ['error', {
      singleQuote: true,
      arrowParens: 'avoid',
      trailingComma: 'es5',
    }],
  },

  overrides: [
    {
      extends: ['plugin:@typescript-eslint/recommended'],
      files: ['*.ts'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/member-ordering': 'off',
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/no-object-literal-type-assertion': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-misused-new': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/array-type': 'off',
        'import/no-internal-modules': 'off',

        '@typescript-eslint/no-unused-vars': ['error', {
          argsIgnorePattern: '^_',
        }],
      },
    },

    {
      extends: ['plugin:@typescript-eslint/recommended'],
      files: ['*.tsx'],
      extends: ['plugin:react/recommended'],
      plugins: ['react-hooks'],
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'react/no-children-prop': 'off',
      },
    },

    {
      files: ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx'],
      globals: { vi: true },
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        'es5/no-for-of': 'off',
        'es5/no-generators': 'off',
        'es5/no-typeof-symbol': 'off',
      }
    },

    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'consistent-return': 'warn',
        'no-magic-numbers': 'off',
        'es5/no-es6-methods': 'off',
      },
    },

    {
      files: ['*.jsx'],
      extends: ['plugin:react/recommended'],
      rules: {
        'consistent-return': 'warn',
        'no-magic-numbers': 'off',
        'react/jsx-key': 'off',
        'react/jsx-handler-names': 'off',
        'es5/no-es6-methods': 'off',
      },
    },

    {
      files: ['examples/**/*.jsx'],
      rules: {
        'react/prop-types': 'off',
      },
    },
  ],
};

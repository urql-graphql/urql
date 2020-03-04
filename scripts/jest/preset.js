module.exports = {
  preset: 'ts-jest',
  setupFiles: [
    require.resolve('./setup.js')
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    "^urql$": "<rootDir>/../../node_modules/urql/src",
    "^(.*-urql)$": "<rootDir>/../../node_modules/$1/src",
    "^@urql/(.*)$": "<rootDir>/../../node_modules/@urql/$1/src",
    "shared$": "<rootDir>/../../node_modules/shared/src",
  },
  watchPlugins: ['jest-watch-yarn-workspaces'],
  testRegex: '(src/.*(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx}'],
  coveragePathIgnorePatterns: ['<rootDir>/src/test-utils'],
};

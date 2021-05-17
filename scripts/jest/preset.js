module.exports = {
  setupFiles: [
    require.resolve('./setup.js')
  ],
  clearMocks: true,
  transform: {
    '^.+\\.tsx?$': '@sucrase/jest-plugin',
  },
  moduleNameMapper: {
    "^urql$": "<rootDir>/../../node_modules/urql/src",
    "^(.*-urql)$": "<rootDir>/../../node_modules/$1/src",
    "^@urql/(.*)/(.*)$": "<rootDir>/../../node_modules/@urql/$1/src/$2",
    "^@urql/(.*)$": "<rootDir>/../../node_modules/@urql/$1/src",
  },
  watchPlugins: ['jest-watch-yarn-workspaces'],
  testRegex: '(src/.*(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx}'],
  coveragePathIgnorePatterns: ['<rootDir>/src/test-utils'],
};

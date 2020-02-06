const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('../../tsconfig.json');

module.exports = {
  preset: 'ts-jest',
  setupFiles: [
    require.resolve('./setup.js')
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: pathsToModuleNameMapper(
    compilerOptions.paths,
    { prefix: '<rootDir>/../../' }
  ),
  watchPlugins: ['jest-watch-yarn-workspaces'],
  testRegex: '(src/.*(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx}'],
  coveragePathIgnorePatterns: ['<rootDir>/src/test-utils'],
};

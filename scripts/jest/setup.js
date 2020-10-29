// This script is run before each `.test.ts` file.

global.AbortController = undefined;
global.fetch = jest.fn();

process.on('unhandledRejection', error => {
  throw error;
});

const originalConsole = console;
global.console = {
  ...originalConsole,
  warn: jest.SpyInstance = () => { /* noop */ },
  error: jest.SpyInstance = (message) => { throw new Error(message); }
};

jest.spyOn(console, 'log');
jest.spyOn(console, 'warn');
jest.spyOn(console, 'error');

jest.mock('../../packages/core/src/utils/deprecation.ts', () => ({
  deprecationWarning({ message }) {
    const error = new Error(`Deprecation Warnings are thrown in tests.\n${message}`);
    if (!/jest-snapshot|pretty-format|jest-jasmine2/i.test(error.stack)) {
      console.log(error.stack);
      throw error;
    }
  },
  _clearWarnings() {},
}));

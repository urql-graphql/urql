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

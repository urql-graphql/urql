// This script is run before each `.test.ts` file.
globalThis.AbortController = undefined;
globalThis.fetch = vi.fn();

process.on('unhandledRejection', error => {
  throw error;
});

const originalConsole = console;
globalThis.console = {
  ...originalConsole,
  warn: (vi.SpyInstance = () => {
    /* noop */
  }),
  error: (vi.SpyInstance = message => {
    throw new Error(message);
  }),
};

vi.spyOn(console, 'log');
vi.spyOn(console, 'warn');
vi.spyOn(console, 'error');

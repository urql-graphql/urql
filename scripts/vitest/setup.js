// This script is run before each `.test.ts` file.
import { vi } from 'vitest';

global.AbortController = undefined;
global.fetch = vi.fn();

process.on('unhandledRejection', error => {
  throw error;
});

const originalConsole = console;
global.console = {
  ...originalConsole,
  warn: vi.SpyInstance = () => { /* noop */ },
  error: vi.SpyInstance = (message) => { throw new Error(message); }
};

vi.spyOn(console, 'log');
vi.spyOn(console, 'warn');
vi.spyOn(console, 'error');

global.AbortController = undefined;
global.fetch = jest.fn();

process.on('unhandledRejection', error => {
  throw error;
});

jest.restoreAllMocks();

jest.spyOn(console, 'log');
jest.spyOn(console, 'warn').mockReturnValue();
jest.spyOn(console, 'error').mockImplementation(() => {
  throw new Error(message);
});

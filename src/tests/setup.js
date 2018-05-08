'use strict';

global._AbortController = global.AbortController;
global.AbortController = undefined;
global.fetch = jest.fn();

process.on('unhandledRejection', error => {
  throw error;
});

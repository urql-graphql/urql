'use strict';

global.fetch = jest.fn();

process.on('unhandledRejection', error => {
  throw error;
});

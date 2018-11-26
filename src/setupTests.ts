'use strict';
const g = global as any;

g._AbortController = g.AbortController;
g.AbortController = undefined;
g.fetch = jest.fn();

process.on('unhandledRejection', error => {
  throw error;
});

import { Cache } from '../types';

export const defaultCache = (store: object): Cache => ({
  invalidate: hash =>
    new Promise(resolve => {
      delete store[hash];
      resolve(hash);
    }),
  invalidateAll: () =>
    new Promise(resolve => {
      store = {};
      resolve();
    }),
  read: hash =>
    new Promise(resolve => {
      resolve(store[hash] || null);
    }),
  update: callback =>
    new Promise(resolve => {
      if (typeof callback === 'function') {
        Object.keys(store).forEach(key => {
          callback(store, key, store[key]);
        });
      }
      resolve();
    }),
  write: (hash, data) =>
    new Promise(resolve => {
      store[hash] = data;
      resolve(hash);
    }),
});

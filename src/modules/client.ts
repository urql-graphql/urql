import uuid from 'uuid/v4';

import { ICache, IClientOptions, IMutation, IQuery } from '../interfaces/index';
import { gankTypeNamesFromResponse } from '../modules/typenames';
import { hashString } from './hash';

// Response from executeQuery call
export interface IQueryResponse {
  data: object[];
  typeNames?: string[];
}

const checkStatus = (redirectMode: string = 'follow') => (
  response: Response
) => {
  // If using manual redirect mode, don't error on redirect!
  const statusRangeEnd = redirectMode === 'manual' ? 400 : 300;
  if (response.status >= 200 && response.status < statusRangeEnd) {
    return response;
  }
  const err = new Error(response.statusText);
  (err as any).response = response;
  throw err;
};

export const defaultCache = store => {
  return {
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
  };
};

export default class Client {
  url?: string; // Graphql API URL
  store: object; // Internal store
  fetchOptions: RequestInit | (() => RequestInit); // Options for fetch call
  subscriptions: object; // Map of subscribed Connect components
  cache: ICache; // Cache object

  constructor(opts?: IClientOptions) {
    if (!opts) {
      throw new Error('Please provide configuration object');
    }
    // Set option/internal defaults
    if (!opts.url) {
      throw new Error('Please provide a URL for your GraphQL API');
    }

    this.url = opts.url;
    this.fetchOptions = opts.fetchOptions || {};
    this.store = opts.initialCache || {};
    this.cache = opts.cache || defaultCache(this.store);
    this.subscriptions = {};
    // Bind methods
    this.executeQuery = this.executeQuery.bind(this);
    this.executeMutation = this.executeMutation.bind(this);
    this.updateSubscribers = this.updateSubscribers.bind(this);
    this.refreshAllFromCache = this.refreshAllFromCache.bind(this);
  }

  updateSubscribers(typenames, changes) {
    // On mutation, call subscribed callbacks with eligible typenames
    for (const sub in this.subscriptions) {
      if (this.subscriptions.hasOwnProperty(sub)) {
        this.subscriptions[sub](typenames, changes);
      }
    }
  }

  subscribe(
    callback: (changedTypes: string[], response: object) => void
  ): string {
    // Create an identifier, add callback to subscriptions, return identifier
    const id = uuid();
    this.subscriptions[id] = callback;
    return id;
  }

  unsubscribe(id: string) {
    // Delete from subscriptions by identifier
    delete this.subscriptions[id];
  }

  refreshAllFromCache() {
    // On mutation, call subscribed callbacks with eligible typenames
    return new Promise(resolve => {
      for (const sub in this.subscriptions) {
        if (this.subscriptions.hasOwnProperty(sub)) {
          this.subscriptions[sub](null, null, true);
        }
      }
      resolve();
    });
  }

  executeQuery(
    queryObject: IQuery,
    skipCache: boolean
  ): Promise<IQueryResponse> {
    return new Promise<IQueryResponse>((resolve, reject) => {
      const { query, variables } = queryObject;
      // Create query POST body
      const body = JSON.stringify({
        query,
        variables,
      });

      // Create hash from serialized body
      const hash = hashString(body);

      // Check cache for hash
      this.cache.read(hash).then(data => {
        if (data && !skipCache) {
          const typeNames = gankTypeNamesFromResponse(data);
          resolve({ data, typeNames });
        } else {
          const fetchOptions =
            typeof this.fetchOptions === 'function'
              ? this.fetchOptions()
              : this.fetchOptions;
          // Fetch data
          fetch(this.url, {
            body,
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            ...fetchOptions,
          })
            .then(checkStatus(fetchOptions.redirect))
            .then(res => res.json())
            .then(response => {
              if (response.data) {
                // Grab typenames from response data
                const typeNames = gankTypeNamesFromResponse(response.data);
                // Store data in cache, using serialized query as key
                this.cache.write(hash, response.data);
                resolve({
                  data: response.data,
                  typeNames,
                });
              } else {
                reject({
                  message: 'No data',
                });
              }
            })
            .catch(e => {
              reject(e);
            });
        }
      });
    });
  }

  executeMutation(mutationObject: IMutation): Promise<object[]> {
    return new Promise<object[]>((resolve, reject) => {
      const { query, variables } = mutationObject;
      // Convert POST body to string
      const body = JSON.stringify({
        query,
        variables,
      });

      const fetchOptions =
        typeof this.fetchOptions === 'function'
          ? this.fetchOptions()
          : this.fetchOptions;
      // Call mutation
      fetch(this.url, {
        body,
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        ...fetchOptions,
      })
        .then(checkStatus(fetchOptions.redirect))
        .then(res => res.json())
        .then(response => {
          if (response.data) {
            // Retrieve typenames from response data
            const typeNames = gankTypeNamesFromResponse(response.data);
            // Notify subscribed Connect wrappers
            this.updateSubscribers(typeNames, response);

            resolve(response.data);
          } else {
            reject({
              message: 'No data',
            });
          }
        })
        .catch(e => {
          reject(e);
        });
    });
  }
}

import { ExecutionResult } from 'graphql';

import { ICache, IClientOptions, IExchange, IQuery } from '../interfaces/index';
import { gankTypeNamesFromResponse } from '../modules/typenames';
import { hashString } from './hash';

import { dedupExchange } from './dedup-exchange';
import { httpExchange } from './http-exchange';
import { IExchangeResult } from '../interfaces/exchange';

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
  url: string;
  store: object; // Internal store
  subscriptions: object; // Map of subscribed Connect components
  subscriptionSize: number; // Used to generate IDs for subscriptions
  cache: ICache; // Cache object
  exchange: IExchange; // Exchange to communicate with GraphQL APIs
  fetchOptions: RequestInit | (() => RequestInit); // Options for fetch call

  constructor(opts?: IClientOptions) {
    if (!opts) {
      throw new Error('Please provide configuration object');
    } else if (!opts.url) {
      throw new Error('Please provide a URL for your GraphQL API');
    }

    this.url = opts.url;
    this.store = opts.initialCache || {};
    this.subscriptions = {};
    this.subscriptionSize = 0;
    this.cache = opts.cache || defaultCache(this.store);
    this.exchange = dedupExchange(httpExchange());
    this.fetchOptions = opts.fetchOptions || {};

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
  ): () => void {
    // Create an identifier, add callback to subscriptions
    const id = this.subscriptionSize++;
    this.subscriptions[id] = callback;

    // Return unsubscription function
    return () => {
      delete this.subscriptions[id];
    };
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

  makeContext(): Record<string, any> {
    return {
      fetchOptions:
        typeof this.fetchOptions === 'function'
          ? this.fetchOptions()
          : this.fetchOptions,
      url: this.url,
    };
  }

  executeQuery(
    queryObject: IQuery,
    skipCache: boolean
  ): Promise<IQueryResponse> {
    return new Promise<IQueryResponse>((resolve, reject) => {
      // Create hash key for unique query/variables
      const { query, variables } = queryObject;
      const key = hashString(JSON.stringify({ query, variables }));

      // Check cache for hash
      this.cache.read(key).then(cachedResult => {
        if (cachedResult && !skipCache) {
          return resolve(cachedResult);
        }

        const operation = {
          context: this.makeContext(),
          key,
          operationName: 'query',
          query,
          variables,
        };

        this.exchange(operation).subscribe({
          error: reject,
          next: (response: IExchangeResult) => {
            // Grab typenames from response data
            response.typeNames = gankTypeNamesFromResponse(response.data);
            // Store data in cache, using serialized query as key
            this.cache.write(key, response);
            // Resolve result
            resolve(response);
          },
        });
      });
    });
  }

  executeMutation(mutationObject: IQuery): Promise<object> {
    return new Promise<object>((resolve, reject) => {
      // Create hash key for unique query/variables
      const { query, variables } = mutationObject;
      const key = hashString(JSON.stringify({ query, variables }));

      const operation = {
        context: this.makeContext(),
        key,
        operationName: 'mutation',
        query,
        variables,
      };

      this.exchange(operation).subscribe({
        error: reject,
        next: response => {
          // Retrieve typenames from response data
          const typeNames = gankTypeNamesFromResponse(response.data);
          // Notify subscribed Connect wrappers
          this.updateSubscribers(typeNames, response);
          // Resolve result
          resolve(response.data);
        },
      });
    });
  }
}

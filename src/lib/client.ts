import Observable from 'zen-observable-ts';

import {
  ClientEventType,
  EventFn,
  Cache,
  ClientOptions,
  Exchange,
  ExchangeResult,
  Query,
} from '../types';

import { cacheExchange } from '../exchanges/cache';
import { dedupExchange } from '../exchanges/dedup';
import { defaultCache } from './default-cache';
import { hashString } from './hash';
import { httpExchange } from '../exchanges/http';

const getQueryKey = (q: Query) => {
  const { query, variables } = q;
  return hashString(JSON.stringify({ query, variables }));
};

export class Client {
  url: string;
  store: object; // Internal store
  subscriptionSize: number; // Used to generate IDs for subscriptions
  cache: Cache; // Cache object
  exchange: Exchange; // Exchange to communicate with GraphQL APIs
  fetchOptions: RequestInit | (() => RequestInit); // Options for fetch call
  subscriptions: { [id: string]: EventFn }; // Map of subscribed Connect components

  constructor(opts?: ClientOptions) {
    if (!opts) {
      throw new Error('Please provide configuration object');
    } else if (!opts.url) {
      throw new Error('Please provide a URL for your GraphQL API');
    }

    this.url = opts.url;
    this.store = opts.initialCache || {};
    this.subscriptions = Object.create(null);
    this.subscriptionSize = 0;
    this.cache = opts.cache || defaultCache(this.store);
    this.fetchOptions = opts.fetchOptions || {};

    const exchange = cacheExchange(this, dedupExchange(httpExchange()));
    this.exchange = opts.transformExchange
      ? opts.transformExchange(exchange, this)
      : exchange;
  }

  /* Event handler methods: */

  dispatch: EventFn = (type, payload) => {
    /* tslint:disable-next-line forin */
    for (const sub in this.subscriptions) {
      this.subscriptions[sub](type, payload);
    }
  };

  subscribe(callback: EventFn): () => void {
    // Create an identifier, add callback to subscriptions
    const id = this.subscriptionSize++;
    this.subscriptions[id] = callback;

    // Return unsubscription function
    return () => {
      delete this.subscriptions[id];
    };
  }

  /* Cache methods: */

  // Receives keys and invalidates them on the cache
  // Dispatches a CacheKeysInvalidated event after
  deleteCacheKeys = (keys: string[]): Promise<void> => {
    const batchedInvalidate = keys.map(key => this.cache.invalidate(key));

    return Promise.all(batchedInvalidate).then(() => {
      this.dispatch(ClientEventType.CacheKeysInvalidated, keys);
    });
  };

  // Receives [key, value] entry and writes it to the cache
  // Dispatches a CacheEntryUpdated event after
  updateCacheEntry = (key: string, value: any): Promise<void> => {
    return this.cache.write(key, value).then(() => {
      this.dispatch(ClientEventType.CacheKeysInvalidated, [key]);
    });
  };

  refreshAllFromCache = () => {
    this.dispatch(ClientEventType.RefreshAll, undefined);
  };

  invalidateQuery = (queryObject: Query) => {
    const key = getQueryKey(queryObject);
    return this.cache.invalidate(key).then(() => {
      this.dispatch(ClientEventType.CacheKeysInvalidated, [key]);
    });
  };

  // Cache methods that are exposed on the component and will dispatch their
  // changes
  cacheWithEvents: Cache = {
    write: this.updateCacheEntry,
    read: (key: string) => this.cache.read(key),
    invalidate: (key: string) => this.deleteCacheKeys([key]),
    invalidateAll: () =>
      this.cache.invalidateAll().then(() => {
        this.dispatch(ClientEventType.RefreshAll, undefined);
      }),
    update: (callback: (...args: any[]) => void) =>
      this.cache.update(callback).then(() => {
        this.dispatch(ClientEventType.RefreshAll, undefined);
      }),
  };

  /* Execute methods: */

  makeContext({ skipCache }: { skipCache?: boolean }): Record<string, any> {
    return {
      fetchOptions:
        typeof this.fetchOptions === 'function'
          ? this.fetchOptions()
          : this.fetchOptions,
      skipCache: !!skipCache,
      url: this.url,
    };
  }

  executeSubscription$(subscriptionObject: Query): Observable<ExchangeResult> {
    const { query, variables } = subscriptionObject;

    const operation = {
      context: this.makeContext({}),
      key: getQueryKey(subscriptionObject),
      operationName: 'subscription',
      query,
      variables,
    };

    return this.exchange(operation);
  }

  executeQuery$(
    queryObject: Query,
    skipCache: boolean
  ): Observable<ExchangeResult> {
    const { query, variables } = queryObject;

    const operation = {
      context: this.makeContext({ skipCache }),
      key: getQueryKey(queryObject),
      operationName: 'query',
      query,
      variables,
    };

    return this.exchange(operation);
  }

  executeQuery = (
    queryObject: Query,
    skipCache: boolean
  ): Promise<ExchangeResult> => {
    return new Promise<ExchangeResult>((resolve, reject) => {
      this.executeQuery$(queryObject, skipCache).subscribe({
        error: reject,
        next: resolve,
      });
    });
  };

  executeMutation$(mutationObject: Query): Observable<ExchangeResult['data']> {
    const { query, variables } = mutationObject;

    const operation = {
      context: this.makeContext({}),
      key: getQueryKey(mutationObject),
      operationName: 'mutation',
      query,
      variables,
    };

    return this.exchange(operation).map(x => x.data);
  }

  executeMutation = (
    mutationObject: Query
  ): Promise<ExchangeResult['data']> => {
    return new Promise<ExchangeResult>((resolve, reject) => {
      this.executeMutation$(mutationObject).subscribe({
        error: reject,
        next: resolve,
      });
    });
  };
}

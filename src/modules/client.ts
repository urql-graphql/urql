import Observable from 'zen-observable-ts';

import {
  ClientEventType,
  IEventFn,
  ICache,
  IClient,
  IClientOptions,
  IExchange,
  IExchangeResult,
  IQuery,
} from '../interfaces/index';

import { cacheExchange } from './cache-exchange';
import { dedupExchange } from './dedup-exchange';
import { defaultCache } from './default-cache';
import { hashString } from './hash';
import { httpExchange } from './http-exchange';

const getQueryKey = (q: IQuery) => {
  const { query, variables } = q;
  return hashString(JSON.stringify({ query, variables }));
};

export default class Client implements IClient {
  url: string;
  store: object; // Internal store
  subscriptionSize: number; // Used to generate IDs for subscriptions
  cache: ICache; // Cache object
  exchange: IExchange; // Exchange to communicate with GraphQL APIs
  fetchOptions: RequestInit | (() => RequestInit); // Options for fetch call
  subscriptions: { [id: string]: IEventFn }; // Map of subscribed Connect components

  constructor(opts?: IClientOptions) {
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

  dispatch: IEventFn = (type, payload) => {
    /* tslint:disable-next-line forin */
    for (const sub in this.subscriptions) {
      this.subscriptions[sub](type, payload);
    }
  };

  subscribe(callback: IEventFn): () => void {
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

  invalidateQuery = (queryObject: IQuery) => {
    const key = getQueryKey(queryObject);
    return this.cache.invalidate(key).then(() => {
      this.dispatch(ClientEventType.CacheKeysInvalidated, [key]);
    });
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

  executeSubscription$(
    subscriptionObject: IQuery
  ): Observable<IExchangeResult> {
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
    queryObject: IQuery,
    skipCache: boolean
  ): Observable<IExchangeResult> {
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
    queryObject: IQuery,
    skipCache: boolean
  ): Promise<IExchangeResult> => {
    return new Promise<IExchangeResult>((resolve, reject) => {
      this.executeQuery$(queryObject, skipCache).subscribe({
        error: reject,
        next: resolve,
      });
    });
  };

  executeMutation$(
    mutationObject: IQuery
  ): Observable<IExchangeResult['data']> {
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
    mutationObject: IQuery
  ): Promise<IExchangeResult['data']> => {
    return new Promise<IExchangeResult>((resolve, reject) => {
      this.executeMutation$(mutationObject).subscribe({
        error: reject,
        next: resolve,
      });
    });
  };
}

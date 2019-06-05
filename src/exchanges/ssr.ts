import { pipe, share, filter, merge, map, tap } from 'wonka';
import { Exchange, OperationResult, Operation } from '../types';

export interface SSRData {
  [key: string]: OperationResult;
}

export interface SSRExchangeParams {
  initialState?: SSRData;
}

export interface SSRExchange extends Exchange {
  /** Rehydrates cached data */
  restoreData(data: SSRData): void;
  /** Extracts cached data */
  extractData(): SSRData;
}

const shouldSkip = ({ operationName }: Operation) =>
  operationName !== 'subscription' && operationName !== 'query';

/** The ssrExchange can be created to capture data during SSR and also to rehydrate it on the client */
export const ssrExchange = (params?: SSRExchangeParams): SSRExchange => {
  const data: SSRData = {};

  const isCached = (operation: Operation) => {
    return !shouldSkip(operation) && data[operation.key] !== undefined;
  };

  // The SSR Exchange is a temporary cache that can populate results into data for suspense
  // On the client it can be used to retrieve these temporary results from a rehydrated cache
  const ssr: SSRExchange = ({ client, forward }) => ops$ => {
    const sharedOps$ = share(ops$);

    let cachedOps$ = pipe(
      sharedOps$,
      filter(op => isCached(op)),
      map(op => data[op.key])
    );

    let forwardedOps$ = pipe(
      sharedOps$,
      filter(op => !isCached(op)),
      forward
    );

    if (!client.suspense) {
      // Outside of suspense-mode we delete results from the cache as they're resolved
      cachedOps$ = pipe(
        cachedOps$,
        tap((result: OperationResult) => {
          delete data[result.operation.key];
        })
      );
    } else {
      // Inside suspense-mode we cache results in the cache as they're resolved
      forwardedOps$ = pipe(
        forwardedOps$,
        tap((result: OperationResult) => {
          const { operation } = result;
          if (!shouldSkip(operation)) {
            data[operation.key] = result;
          }
        })
      );
    }

    return merge([cachedOps$, forwardedOps$]);
  };

  ssr.restoreData = (restore: SSRData) => Object.assign(data, restore);
  ssr.extractData = () => Object.assign({}, data);

  if (params && params.initialState) {
    ssr.restoreData(params.initialState);
  }

  return ssr;
};

import { GraphQLError } from 'graphql';
import { pipe, share, filter, merge, map, tap } from 'wonka';
import { Exchange, OperationResult, Operation } from '../types';
import { CombinedError } from '../utils';

export interface SerializedResult {
  data?: string | undefined; // JSON string of data
  error?: {
    graphQLErrors: Array<Partial<GraphQLError> | string>;
    networkError?: string;
  };
}

export interface SSRData {
  [key: string]: SerializedResult;
}

export interface SSRExchangeParams {
  isClient?: boolean;
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

/** Serialize an OperationResult to plain JSON */
const serializeResult = ({
  data,
  error,
}: OperationResult): SerializedResult => {
  const result: SerializedResult = {
    data: JSON.stringify(data),
    error: undefined,
  };

  if (error) {
    result.error = {
      graphQLErrors: error.graphQLErrors.map(error => {
        if (!error.path && !error.extensions) return error.message;

        return {
          message: error.message,
          path: error.path,
          extensions: error.extensions,
        };
      }),
      networkError: error.networkError ? '' + error.networkError : undefined,
    };
  }

  return result;
};

/** Deserialize plain JSON to an OperationResult */
const deserializeResult = (
  operation: Operation,
  result: SerializedResult
): OperationResult => {
  const { error, data: dataJson } = result;

  const deserialized: OperationResult = {
    operation,
    data: dataJson ? JSON.parse(dataJson) : undefined,
    extensions: undefined,
    error: error
      ? new CombinedError({
          networkError: error.networkError
            ? new Error(error.networkError)
            : undefined,
          graphQLErrors:
            error.graphQLErrors && error.graphQLErrors.length
              ? error.graphQLErrors
              : undefined,
        })
      : undefined,
  };

  return deserialized;
};

/** The ssrExchange can be created to capture data during SSR and also to rehydrate it on the client */
export const ssrExchange = (params?: SSRExchangeParams): SSRExchange => {
  const data: SSRData = {};

  // On the client-side, we delete results from the cache as they're resolved
  // this is delayed so that concurrent queries don't delete each other's data
  const invalidateQueue: number[] = [];
  const invalidate = (result: OperationResult) => {
    invalidateQueue.push(result.operation.key);
    if (invalidateQueue.length === 1) {
      Promise.resolve().then(() => {
        let key: number | void;
        while ((key = invalidateQueue.shift())) delete data[key];
      });
    }
  };

  const isCached = (operation: Operation) => {
    return !shouldSkip(operation) && data[operation.key] !== undefined;
  };

  // The SSR Exchange is a temporary cache that can populate results into data for suspense
  // On the client it can be used to retrieve these temporary results from a rehydrated cache
  const ssr: SSRExchange = ({ client, forward }) => ops$ => {
    // params.isClient tells us whether we're on the client-side
    // By default we assume that we're on the client if suspense-mode is disabled
    const isClient =
      params && typeof params.isClient === 'boolean'
        ? !!params.isClient
        : !client.suspense;

    const sharedOps$ = share(ops$);

    let forwardedOps$ = pipe(
      sharedOps$,
      filter(op => !isCached(op)),
      forward
    );

    // NOTE: Since below we might delete the cached entry after accessing
    // it once, cachedOps$ needs to be merged after forwardedOps$
    let cachedOps$ = pipe(
      sharedOps$,
      filter(op => isCached(op)),
      map(op => {
        const serialized = data[op.key];
        return deserializeResult(op, serialized);
      })
    );

    if (!isClient) {
      // On the server we cache results in the cache as they're resolved
      forwardedOps$ = pipe(
        forwardedOps$,
        tap((result: OperationResult) => {
          const { operation } = result;
          if (!shouldSkip(operation)) {
            const serialized = serializeResult(result);
            data[operation.key] = serialized;
          }
        })
      );
    } else {
      // On the client we delete results from the cache as they're resolved
      cachedOps$ = pipe(cachedOps$, tap(invalidate));
    }

    return merge([forwardedOps$, cachedOps$]);
  };

  ssr.restoreData = (restore: SSRData) => Object.assign(data, restore);
  ssr.extractData = () => Object.assign({}, data);

  if (params && params.initialState) {
    ssr.restoreData(params.initialState);
  }

  return ssr;
};

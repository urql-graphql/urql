import { GraphQLError } from 'graphql';
import { pipe, share, filter, merge, map, tap } from 'wonka';
import { Exchange, OperationResult, Operation } from '../types';
import { CombinedError } from '../utils';
import { reexecuteOperation } from './cache';

export interface SerializedResult {
  hasNext?: boolean;
  data?: string | undefined; // JSON string of data
  extensions?: string | undefined; // JSON string of data
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
  staleWhileRevalidate?: boolean;
  includeExtensions?: boolean;
}

export interface SSRExchange extends Exchange {
  /** Rehydrates cached data */
  restoreData(data: SSRData): void;
  /** Extracts cached data */
  extractData(): SSRData;
}

/** Serialize an OperationResult to plain JSON */
const serializeResult = (
  { hasNext, data, extensions, error }: OperationResult,
  includeExtensions: boolean
): SerializedResult => {
  const result: SerializedResult = {};
  if (data !== undefined) result.data = JSON.stringify(data);
  if (includeExtensions && extensions !== undefined) {
    result.extensions = JSON.stringify(extensions);
  }
  if (hasNext) result.hasNext = true;

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
    };

    if (error.networkError) {
      result.error.networkError = '' + error.networkError;
    }
  }

  return result;
};

/** Deserialize plain JSON to an OperationResult */
const deserializeResult = (
  operation: Operation,
  result: SerializedResult,
  includeExtensions: boolean
): OperationResult => ({
  operation,
  data: result.data ? JSON.parse(result.data) : undefined,
  extensions:
    includeExtensions && result.extensions
      ? JSON.parse(result.extensions)
      : undefined,
  error: result.error
    ? new CombinedError({
        networkError: result.error.networkError
          ? new Error(result.error.networkError)
          : undefined,
        graphQLErrors: result.error.graphQLErrors,
      })
    : undefined,
  hasNext: result.hasNext,
});

const revalidated = new Set<number>();

/** The ssrExchange can be created to capture data during SSR and also to rehydrate it on the client */
export const ssrExchange = (params?: SSRExchangeParams): SSRExchange => {
  const staleWhileRevalidate = !!(params && params.staleWhileRevalidate);
  const includeExtensions = !!(params && params.includeExtensions);
  const data: Record<string, SerializedResult | null> = {};

  // On the client-side, we delete results from the cache as they're resolved
  // this is delayed so that concurrent queries don't delete each other's data
  const invalidateQueue: number[] = [];
  const invalidate = (result: OperationResult) => {
    invalidateQueue.push(result.operation.key);
    if (invalidateQueue.length === 1) {
      Promise.resolve().then(() => {
        let key: number | void;
        while ((key = invalidateQueue.shift())) {
          data[key] = null;
        }
      });
    }
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
      filter(
        operation => !data[operation.key] || !!data[operation.key]!.hasNext
      ),
      forward
    );

    // NOTE: Since below we might delete the cached entry after accessing
    // it once, cachedOps$ needs to be merged after forwardedOps$
    let cachedOps$ = pipe(
      sharedOps$,
      filter(
        operation =>
          !!data[operation.key] &&
          operation.context.requestPolicy !== 'network-only'
      ),
      map(op => {
        const serialized = data[op.key]!;
        const result = deserializeResult(op, serialized, includeExtensions);
        if (staleWhileRevalidate && !revalidated.has(op.key)) {
          result.stale = true;
          revalidated.add(op.key);
          reexecuteOperation(client, op);
        }

        return result;
      })
    );

    if (!isClient) {
      // On the server we cache results in the cache as they're resolved
      forwardedOps$ = pipe(
        forwardedOps$,
        tap((result: OperationResult) => {
          const { operation } = result;
          if (operation.kind !== 'mutation') {
            const serialized = serializeResult(result, includeExtensions);
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

  ssr.restoreData = (restore: SSRData) => {
    for (const key in restore) {
      // We only restore data that hasn't been previously invalidated
      if (data[key] !== null) {
        data[key] = restore[key];
      }
    }
  };

  ssr.extractData = () => {
    const result: SSRData = {};
    for (const key in data) if (data[key] != null) result[key] = data[key]!;
    return result;
  };

  if (params && params.initialState) {
    ssr.restoreData(params.initialState);
  }

  return ssr;
};

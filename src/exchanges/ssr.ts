import { pipe, share, filter, merge, map, tap } from 'wonka';
import { Exchange, OperationResult, Operation } from '../types';
import { CombinedError } from '../utils';

export interface SerializedResult {
  data?: any;
  error?: {
    networkError?: string;
    graphQLErrors: string[];
  };
}

export interface SSRData {
  [key: string]: SerializedResult;
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

/** Serialize an OperationResult to plain JSON */
const serializeResult = ({
  data,
  error,
}: OperationResult): SerializedResult => {
  const result: SerializedResult = { data, error: undefined };
  if (error !== undefined) {
    result.error = {
      networkError: '' + error.networkError,
      graphQLErrors: error.graphQLErrors.map(x => '' + x),
    };
  }

  return result;
};

/** Deserialize plain JSON to an OperationResult */
const deserializeResult = (
  operation: Operation,
  result: SerializedResult
): OperationResult => {
  const { error, data } = result;
  const deserialized: OperationResult = { operation, data, error: undefined };
  if (error !== undefined) {
    deserialized.error = new CombinedError({
      networkError: new Error(error.networkError),
      graphQLErrors: error.graphQLErrors,
    });
  }

  return deserialized;
};

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
      map(op => {
        const serialized = data[op.key];
        return deserializeResult(op, serialized);
      })
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
            const serialized = serializeResult(result);
            data[operation.key] = serialized;
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

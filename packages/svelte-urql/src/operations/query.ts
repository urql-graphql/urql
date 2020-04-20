import { RequestPolicy, OperationContext, CombinedError } from '@urql/core';
import { pipe, fromValue, concat, scan, map, subscribe } from 'wonka';
import { Readable } from 'svelte/store';
import { DocumentNode } from 'graphql';

import { getClient } from '../context';
import { initialState, batchReadable } from './utils';

export interface QueryArguments<V> {
  query: string | DocumentNode;
  variables?: V;
  requestPolicy?: RequestPolicy;
  pollInterval?: number;
  context?: Partial<OperationContext>;
}

export interface QueryResult<T> {
  fetching: boolean;
  stale: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
}

export const query = <T = any, V = object>(
  args: QueryArguments<V>
): Readable<QueryResult<T>> => {
  const client = getClient();

  const queryResult$ = pipe(
    concat([
      fromValue({ fetching: true, stale: false }),
      pipe(
        client.query<T>(args.query, args.variables, {
          requestPolicy: args.requestPolicy,
          pollInterval: args.pollInterval,
          ...args.context,
        }),
        map(({ stale, data, error, extensions }) => ({
          fetching: false,
          stale: !!stale,
          data,
          error,
          extensions,
        }))
      ),
      fromValue({ fetching: false, stale: false }),
    ]),
    scan(
      (result, partial) => ({
        ...result,
        ...partial,
      }),
      initialState
    )
  );

  return batchReadable({
    subscribe(onValue) {
      const { unsubscribe } = pipe(queryResult$, subscribe(onValue));
      return unsubscribe as () => void;
    },
  });
};

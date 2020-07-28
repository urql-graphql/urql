import {
  pipe,
  makeSubject,
  fromValue,
  switchMap,
  onStart,
  concat,
  scan,
  map,
  take,
  share,
  subscribe,
  publish,
  toPromise,
} from 'wonka';

import {
  RequestPolicy,
  OperationContext,
  CombinedError,
  Operation,
} from '@urql/core';

import { Readable } from 'svelte/store';
import { DocumentNode } from 'graphql';

import { getClient } from '../context';
import { initialState } from './constants';

export interface QueryArguments<V> {
  query: string | DocumentNode;
  variables?: V;
  requestPolicy?: RequestPolicy;
  pollInterval?: number;
  pause?: boolean;
  context?: Partial<OperationContext>;
}

export interface QueryResult<T> {
  fetching: boolean;
  stale: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
  operation?: Operation;
}

export interface QueryStore<T = any, V = object>
  extends Readable<QueryResult<T>>,
    PromiseLike<QueryResult<T>> {
  (args?: Partial<QueryArguments<V>>): QueryStore<T>;
}

export const query = <T = any, V = object>(
  args: QueryArguments<V>
): QueryStore<T, V> => {
  const client = getClient();
  const { source: args$, next: nextArgs } = makeSubject<QueryArguments<V>>();

  const queryResult$ = pipe(
    args$,
    switchMap(args => {
      if (args.pause) {
        return fromValue({ fetching: false, stale: false });
      }

      return concat([
        // Initially set fetching to true
        fromValue({ fetching: true, stale: false }),
        pipe(
          client.query<T>(args.query, args.variables, {
            requestPolicy: args.requestPolicy,
            pollInterval: args.pollInterval,
            ...args.context,
          }),
          map(({ stale, data, error, extensions, operation }) => ({
            fetching: false,
            stale: !!stale,
            data,
            error,
            extensions,
            operation,
          }))
        ),
        // When the source proactively closes, fetching is set to false
        fromValue({ fetching: false, stale: false }),
      ]);
    }),
    // The individual partial results are merged into each previous result
    scan(
      (result, partial) => ({
        ...result,
        ...partial,
      }),
      initialState
    ),
    share
  );

  publish(queryResult$);

  const queryStore = (baseArgs: QueryArguments<V>): QueryStore<T, V> => {
    const result$ = pipe(
      queryResult$,
      onStart(() => {
        nextArgs({ ...baseArgs, ...args });
      })
    );

    function query$(args?: Partial<QueryArguments<V>>) {
      return queryStore({
        ...baseArgs,
        ...args,
      });
    }

    query$.subscribe = (onValue: (result: QueryResult<T>) => void) => {
      return pipe(result$, subscribe(onValue)).unsubscribe;
    };

    query$.then = (onValue: (result: QueryResult<T>) => any): Promise<any> => {
      return pipe(result$, take(1), toPromise).then(onValue);
    };

    return query$ as any;
  };

  return queryStore(args);
};

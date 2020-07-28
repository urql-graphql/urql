import { DocumentNode } from 'graphql';
import { useCallback, useMemo } from 'react';
import { pipe, concat, fromValue, switchMap, map, scan } from 'wonka';
import {
  CombinedError,
  OperationContext,
  RequestPolicy,
  Operation,
} from '@urql/core';

import { useClient } from '../context';
import { useSource, useBehaviourSubject } from './useSource';
import { useRequest } from './useRequest';
import { initialState } from './constants';

export interface UseQueryArgs<V> {
  query: string | DocumentNode;
  variables?: V;
  requestPolicy?: RequestPolicy;
  pollInterval?: number;
  context?: Partial<OperationContext>;
  pause?: boolean;
}

export interface UseQueryState<T> {
  fetching: boolean;
  stale: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
  operation?: Operation;
}

export type UseQueryResponse<T> = [
  UseQueryState<T>,
  (opts?: Partial<OperationContext>) => void
];

export function useQuery<T = any, V = object>(
  args: UseQueryArgs<V>
): UseQueryResponse<T> {
  const client = useClient();

  // This creates a request which will keep a stable reference
  // if request.key doesn't change
  const request = useRequest(args.query, args.variables);

  // Create a new query-source from client.executeQuery
  const makeQuery$ = useCallback(
    (opts?: Partial<OperationContext>) => {
      return client.executeQuery(request, {
        requestPolicy: args.requestPolicy,
        pollInterval: args.pollInterval,
        ...args.context,
        ...opts,
      });
    },
    [client, request, args.requestPolicy, args.pollInterval, args.context]
  );

  const [query$$, update] = useBehaviourSubject(
    useMemo(() => (args.pause ? null : makeQuery$()), [args.pause, makeQuery$])
  );

  const state = useSource(
    useMemo(() => {
      return pipe(
        query$$,
        switchMap(query$ => {
          if (!query$) return fromValue({ fetching: false, stale: false });

          return concat([
            // Initially set fetching to true
            fromValue({ fetching: true, stale: false }),
            pipe(
              query$,
              map(({ stale, data, error, extensions, operation }) => ({
                fetching: false,
                stale: !!stale,
                data,
                error,
                operation,
                extensions,
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
        )
      );
    }, [query$$]),
    initialState
  );

  // This is the imperative execute function passed to the user
  const executeQuery = useCallback(
    (opts?: Partial<OperationContext>) => update(makeQuery$(opts)),
    [update, makeQuery$]
  );

  return [state, executeQuery];
}

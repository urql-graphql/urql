import { DocumentNode } from 'graphql';
import { useCallback, useMemo } from 'react';
import { pipe, concat, fromValue, switchMap, map, scan } from 'wonka';
import { useSubjectValue } from 'react-wonka';

import { useClient } from '../context';
import { OperationContext, RequestPolicy } from '../types';
import { CombinedError } from '../utils';
import { useRequest } from './useRequest';

const initialState: UseQueryState<any> = {
  fetching: false,
  data: undefined,
  error: undefined,
  extensions: undefined,
};

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
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
}

export type UseQueryResponse<T> = [
  UseQueryState<T>,
  (opts?: Partial<OperationContext>) => void
];

export const useQuery = <T = any, V = object>(
  args: UseQueryArgs<V>
): UseQueryResponse<T> => {
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

  const [state, update] = useSubjectValue(
    query$$ =>
      pipe(
        query$$,
        switchMap(query$ => {
          if (!query$) return fromValue({ fetching: false });

          return concat([
            // Initially set fetching to true
            fromValue({ fetching: true }),
            pipe(
              query$,
              map(({ data, error, extensions }) => ({
                fetching: false,
                data,
                error,
                extensions,
              }))
            ),
            // When the source proactively closes, fetching is set to false
            fromValue({ fetching: false }),
          ]);
        }),
        // The individual partial results are merged into each previous result
        scan((result, partial) => ({ ...result, ...partial }), initialState)
      ),
    useMemo(() => (args.pause ? null : makeQuery$()), [args.pause, makeQuery$]),
    initialState
  );

  // This is the imperative execute function passed to the user
  const executeQuery = useCallback(
    (opts?: Partial<OperationContext>) => update(makeQuery$(opts)),
    [update, makeQuery$]
  );

  return [state, executeQuery];
};

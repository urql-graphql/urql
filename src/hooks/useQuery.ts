import { DocumentNode } from 'graphql';
import { useCallback, useMemo } from 'react';
import { pipe, concat, fromValue, switchMap, map, scan } from 'wonka';
import { useSubjectValue } from 'react-wonka';

import { useClient } from '../context';
import { GraphQLRequest, OperationContext, RequestPolicy } from '../types';
import { CombinedError } from '../utils';
import { useRequest } from './useRequest';

const initialState: UseQueryState<any> = {
  fetching: false,
  data: undefined,
  error: undefined,
  extensions: undefined,
};

type InternalEvent = [
  GraphQLRequest,
  Partial<OperationContext>,
  undefined | boolean
];

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

  // A utility function to create a new context merged with `opts` and some args
  const makeContext = useCallback(
    (opts?: Partial<OperationContext>) => ({
      requestPolicy: args.requestPolicy,
      pollInterval: args.pollInterval,
      ...args.context,
      ...opts,
    }),
    [args.context, args.requestPolicy, args.pollInterval]
  );

  // Create an internal event with only the changes we care about
  const input = useMemo<InternalEvent>(
    () => [request, makeContext(), args.pause],
    [request, makeContext, args.pause]
  );

  const [state, update] = useSubjectValue(
    event$ =>
      pipe(
        event$,
        switchMap(([request, context, pause]: InternalEvent) => {
          // On pause fetching is reset to false
          if (pause) return fromValue({ fetching: false });

          return concat([
            // Initially set fetching to true
            fromValue({ fetching: true }),
            pipe(
              // Call executeQuery and transform its result to the local state shape
              client.executeQuery(request, context),
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
    input,
    initialState
  );

  // This is the imperative execute function passed to the user
  const executeQuery = useCallback(
    (opts?: Partial<OperationContext>) =>
      update([request, makeContext(opts), false]),
    [makeContext, request, update]
  );

  return [state, executeQuery];
};

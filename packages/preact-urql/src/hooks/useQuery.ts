import { useEffect, useCallback, useMemo } from 'preact/hooks';

import {
  Source,
  pipe,
  share,
  takeWhile,
  concat,
  fromValue,
  switchMap,
  map,
  scan,
} from 'wonka';

import {
  Client,
  GraphQLRequestParams,
  AnyVariables,
  CombinedError,
  OperationContext,
  RequestPolicy,
  OperationResult,
  Operation,
} from '@urql/core';

import { useClient } from '../context';
import { useSource } from './useSource';
import { useRequest } from './useRequest';
import { initialState } from './constants';

export type UseQueryArgs<
  Variables extends AnyVariables = AnyVariables,
  Data = any
> = {
  requestPolicy?: RequestPolicy;
  context?: Partial<OperationContext>;
  pause?: boolean;
} & GraphQLRequestParams<Data, Variables>;

export interface UseQueryState<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> {
  fetching: boolean;
  stale: boolean;
  data?: Data;
  error?: CombinedError;
  extensions?: Record<string, any>;
  operation?: Operation<Data, Variables>;
}

export type UseQueryResponse<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = [
  UseQueryState<Data, Variables>,
  (opts?: Partial<OperationContext>) => void
];

/** Convert the Source to a React Suspense source on demand */
function toSuspenseSource<T>(source: Source<T>): Source<T> {
  const shared = share(source);
  let cache: T | void;
  let resolve: (value: T) => void;

  return sink => {
    let hasSuspended = false;

    pipe(
      shared,
      takeWhile(result => {
        // The first result that is received will resolve the suspense
        // promise after waiting for a microtick
        if (cache === undefined) Promise.resolve(result).then(resolve);
        cache = result;
        return !hasSuspended;
      })
    )(sink);

    // If we haven't got a previous result then start suspending
    // otherwise issue the last known result immediately
    if (cache !== undefined) {
      const signal = [cache] as [T] & { tag: 1 };
      signal.tag = 1;
      sink(signal);
    } else {
      hasSuspended = true;
      sink(0 /* End */);
      throw new Promise<T>(_resolve => {
        resolve = _resolve;
      });
    }
  };
}

const isSuspense = (client: Client, context?: Partial<OperationContext>) =>
  client.suspense && (!context || context.suspense !== false);

const sources = new Map<number, Source<OperationResult>>();

export function useQuery<
  Data = any,
  Variables extends AnyVariables = AnyVariables
>(args: UseQueryArgs<Variables, Data>): UseQueryResponse<Data, Variables> {
  const client = useClient();
  // This creates a request which will keep a stable reference
  // if request.key doesn't change
  const request = useRequest(args.query, args.variables as Variables);

  // Create a new query-source from client.executeQuery
  const makeQuery$ = useCallback(
    (opts?: Partial<OperationContext>) => {
      // Determine whether suspense is enabled for the given operation
      const suspense = isSuspense(client, args.context);
      let source: Source<OperationResult> | void = suspense
        ? sources.get(request.key)
        : undefined;

      if (!source) {
        source = client.executeQuery(request, {
          requestPolicy: args.requestPolicy,
          ...args.context,
          ...opts,
        });

        // Create a suspense source and cache it for the given request
        if (suspense) {
          source = toSuspenseSource(source);
          if (typeof window !== 'undefined') {
            sources.set(request.key, source);
          }
        }
      }

      return source;
    },
    [client, request, args.requestPolicy, args.context]
  );

  const query$ = useMemo(() => {
    return args.pause ? null : makeQuery$();
  }, [args.pause, makeQuery$]);

  const [state, update] = useSource(
    query$,
    useCallback((query$$, prevState?: UseQueryState<Data, Variables>) => {
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
          (result: UseQueryState<Data, Variables>, partial) => ({
            ...result,
            ...partial,
          }),
          prevState || initialState
        )
      );
    }, [])
  );

  // This is the imperative execute function passed to the user
  const executeQuery = useCallback(
    (opts?: Partial<OperationContext>) => {
      update(makeQuery$({ suspense: false, ...opts }));
    },
    [update, makeQuery$]
  );

  useEffect(() => {
    sources.delete(request.key); // Delete any cached suspense source
    if (!isSuspense(client, args.context)) update(query$);
  }, [update, client, query$, request, args.context]);

  if (isSuspense(client, args.context)) {
    update(query$);
  }

  return [state, executeQuery];
}

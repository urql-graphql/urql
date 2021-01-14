import { DocumentNode } from 'graphql';
import { useEffect, useCallback, useMemo } from 'react';

import {
  Source,
  pipe,
  share,
  concat,
  onPush,
  fromValue,
  switchMap,
  filter,
  map,
  scan,
} from 'wonka';

import {
  Client,
  TypedDocumentNode,
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

export interface UseQueryArgs<Variables = object, Data = any> {
  query: string | DocumentNode | TypedDocumentNode<Data, Variables>;
  variables?: Variables;
  requestPolicy?: RequestPolicy;
  pollInterval?: number;
  context?: Partial<OperationContext>;
  pause?: boolean;
}

export interface UseQueryState<Data = any, Variables = object> {
  fetching: boolean;
  stale: boolean;
  data?: Data;
  error?: CombinedError;
  extensions?: Record<string, any>;
  operation?: Operation<Data, Variables>;
}

export type UseQueryResponse<Data = any, Variables = object> = [
  UseQueryState<Data, Variables>,
  (opts?: Partial<OperationContext>) => void
];

/** Convert the Source to a React Suspense source on demand */
function toSuspenseSource<T>(source: Source<T>): Source<T> {
  const shared = share(source);
  let cache: T | undefined;
  let resolve: (value: T) => void;

  const suspend$: Source<T> = sink => {
    pipe(
      shared,
      onPush(result => {
        // The first result that is received will resolve the Suspense promise
        if (resolve && cache === undefined) resolve(result);
        cache = result;
      })
    )(sink);

    // If we haven't got a previous result then throw a Suspense promise
    if (cache === undefined) {
      throw new Promise<T>(_resolve => {
        resolve = _resolve;
      });
    }
  };

  return concat([
    pipe(
      fromValue<T>(cache!),
      map<T, T>(() => cache!),
      filter(x => x !== undefined)
    ),
    suspend$,
  ]);
}

const isSuspense = (client: Client, context?: Partial<OperationContext>) =>
  client.suspense && (!context || context.suspense !== false);

const sources = new Map<number, Source<OperationResult>>();

export function useQuery<Data = any, Variables = object>(
  args: UseQueryArgs<Variables, Data>
): UseQueryResponse<Data, Variables> {
  const client = useClient();
  // This creates a request which will keep a stable reference
  // if request.key doesn't change
  const request = useRequest<Data, Variables>(args.query, args.variables);

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
          pollInterval: args.pollInterval,
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
    [client, request, args.requestPolicy, args.pollInterval, args.context]
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

  if (isSuspense(client, args.context)) update(query$);

  return [state, executeQuery];
}

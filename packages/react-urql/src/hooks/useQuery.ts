/* eslint-disable react-hooks/exhaustive-deps */
import { DocumentNode } from 'graphql';
import { Source, pipe, subscribe, onPush, takeWhile } from 'wonka';
import { useCallback, useMemo, useState } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
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
import { useRequest } from './useRequest';
import { hasDepsChanged, computeNextState, initialState } from './state';
import { getCacheForClient } from './cache';

export interface UseQueryArgs<Variables = object, Data = any> {
  query: string | DocumentNode | TypedDocumentNode<Data, Variables>;
  variables?: Variables;
  requestPolicy?: RequestPolicy;
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

const notFetching = initialState;
const fetching = { ...initialState, fetching: true };

const isSuspense = (client: Client, context?: Partial<OperationContext>) =>
  client.suspense && (!context || context.suspense !== false);

export function useQuery<Data = any, Variables = object>(
  args: UseQueryArgs<Variables, Data>
): UseQueryResponse<Data, Variables> {
  const client = useClient();
  const request = useRequest<Data, Variables>(args.query, args.variables);
  const suspense = isSuspense(client, args.context);
  const cache = getCacheForClient(client);

  // We need to keep the source in state for 'executeQuery'
  const [sourcyboi, setSource] = useState<{
    source: Source<OperationResult<Data, Variables>> | null;
    prevValue: any;
    deps: Array<any>;
  }>({
    source: null,
    prevValue: notFetching as any,
    deps: [],
  });

  const { source, deps } = sourcyboi;

  const [getSnapshot, sub] = useMemo(() => {
    let result = cache.get(request.key);

    const getSnapshot = () => {
      if (!source) {
        return notFetching;
      } else if (!result) {
        let resolve;

        const subscription = pipe(
          source,
          takeWhile(() => (suspense && !resolve) || !result),
          subscribe(_result => {
            result = _result;
            if (resolve) resolve(result);
          })
        );
        if (result == null && suspense) {
          throw (result = new Promise(_resolve => {
            resolve = _resolve;
          }));
        } else {
          subscription.unsubscribe();
        }
      } else if (suspense && result != null && 'then' in result) {
        throw result;
      }

      return result || fetching;
    };

    const sub = notify => {
      if (!source) {
        return () => {
          /*noop*/
        };
      }

      const unsub = pipe(
        source,
        subscribe(_result => {
          result = _result;
          notify();
        })
      ).unsubscribe;

      return () => {
        cache.dispose(request.key);
        unsub();
      };
    };

    return [getSnapshot, sub];
  }, [source]);

  const executeQuery = useCallback(
    (opts?: Partial<OperationContext>) => {
      const fetchSource = client.executeQuery(request, {
        requestPolicy: args.requestPolicy,
        ...args.context,
        ...opts,
      });
      const source = suspense
        ? pipe(
            fetchSource,
            onPush(result => {
              cache.set(request.key, result);
            })
          )
        : fetchSource;
      setSource(prev => ({
        prevValue: prev.prevValue,
        deps: prev.deps,
        source,
      }));
    },
    [suspense, client, request, args.requestPolicy, args.context]
  );

  let result = useSyncExternalStore<UseQueryState<Data, Variables>>(
    sub,
    getSnapshot as any
  );
  sourcyboi.prevValue = result = computeNextState(sourcyboi.prevValue, result);

  const currDeps = [
    client,
    request,
    args.pause,
    args.requestPolicy,
    args.context,
  ];
  if (hasDepsChanged(deps, currDeps)) {
    const fetchSource = client.executeQuery(request, {
      requestPolicy: args.requestPolicy,
      ...args.context,
    });
    const source = suspense
      ? pipe(
          fetchSource,
          onPush(result => {
            cache.set(request.key, result);
          })
        )
      : fetchSource;
    setSource({
      prevValue: result,
      source: args.pause ? null : source,
      deps: currDeps,
    });
  }

  return [result, executeQuery];
}

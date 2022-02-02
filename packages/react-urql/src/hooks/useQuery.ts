/* eslint-disable react-hooks/exhaustive-deps */
import { DocumentNode } from 'graphql';
import { Source, pipe, subscribe, takeWhile } from 'wonka';
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
  const cache = getCacheForClient(client);

  const currDeps: unknown[] = [
    client,
    request,
    args.pause,
    args.requestPolicy,
    args.context,
  ];

  const [meta, setMeta] = useState<{
    source: Source<OperationResult<Data, Variables>> | null;
    prevValue: UseQueryState<Data, Variables>;
    deps: unknown[];
    suspense: boolean;
  }>(() => ({
    source: args.pause
      ? null
      : client.executeQuery(request, {
          requestPolicy: args.requestPolicy,
          ...args.context,
        }),
    prevValue: notFetching,
    deps: currDeps,
    suspense: isSuspense(client, args.context),
  }));

  const { source, deps, suspense } = meta;

  const [getSnapshot, sub] = useMemo(() => {
    let result = cache.get(request.key);

    const getSnapshot = (): Partial<UseQueryState<Data, Variables>> => {
      if (!source) {
        return notFetching;
      } else if (!result) {
        let resolve:
          | ((result: OperationResult<Data, Variables>) => void)
          | undefined;

        const subscription = pipe(
          source,
          takeWhile(
            () =>
              (suspense && (!resolve || (result && (result as any).then))) ||
              !result
          ),
          subscribe(_result => {
            result = _result;
            if (suspense) {
              cache.set(request.key, result);
            }

            if (resolve) {
              resolve(result);
              resolve = undefined;
            }
          })
        );

        if (result == null && suspense) {
          const promise = (result = new Promise(_resolve => {
            resolve = _resolve;
          }));
          cache.set(request.key, promise);
          throw promise;
        } else {
          subscription.unsubscribe();
        }
      } else if (suspense && result != null && 'then' in result) {
        throw result;
      }

      return (result as OperationResult<Data, Variables>) || fetching;
    };

    const sub = (notify: () => void) => {
      if (!source) {
        return () => {
          /*noop*/
        };
      }

      const unsub = pipe(
        source,
        subscribe(_result => {
          if (suspense) {
            cache.set(request.key, result);
          }
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
  }, [source, args.pause]);

  const executeQuery = useCallback(
    (opts?: Partial<OperationContext>) => {
      const context = {
        requestPolicy: args.requestPolicy,
        ...args.context,
        ...opts,
      };

      setMeta(prev => ({
        prevValue: prev.prevValue,
        deps: prev.deps,
        source: client.executeQuery(request, context),
        suspense: isSuspense(client, context),
      }));
    },
    [client, request, args.requestPolicy, args.context]
  );

  const result = (meta.prevValue = computeNextState(
    meta.prevValue,
    useSyncExternalStore<Partial<UseQueryState<Data, Variables>>>(
      sub,
      getSnapshot,
      getSnapshot
    )
  ));

  if (hasDepsChanged(deps, currDeps) && !args.pause) {
    setMeta({
      prevValue: result,
      source: args.pause
        ? null
        : client.executeQuery(request, {
            requestPolicy: args.requestPolicy,
            ...args.context,
          }),
      deps: currDeps,
      suspense: isSuspense(client, args.context),
    });
  }

  return [result, executeQuery];
}

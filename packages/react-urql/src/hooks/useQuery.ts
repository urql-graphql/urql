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

  const [meta, setMeta] = useState<{
    source: Source<OperationResult<Data, Variables>> | null;
    prevValue: UseQueryState<Data, Variables>;
    deps: Array<any>;
  }>({
    source: null,
    prevValue: notFetching as any,
    deps: [],
  });

  const { source, deps } = meta;

  const [getSnapshot, sub] = useMemo(() => {
    let result = cache.get(request.key);
    const getSnapshot = ():
      | OperationResult<Data, Variables>
      | UseQueryState<Data, Variables> => {
      if (!source) {
        return notFetching;
      } else if (!result) {
        let resolve;

        const subscription = pipe(
          source,
          takeWhile(
            () =>
              (suspense && (!resolve || (result && (result as any).then))) ||
              !result
          ),
          subscribe(_result => {
            result = _result;
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

      return (result || fetching) as
        | OperationResult<Data, Variables>
        | UseQueryState<Data, Variables>;
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
  }, [source, args.pause]);

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

      setMeta(prev => ({
        prevValue: prev.prevValue,
        deps: prev.deps,
        source,
      }));
    },
    [suspense, client, request, args.requestPolicy, args.context]
  );

  let result = useSyncExternalStore<
    UseQueryState<Data, Variables> | OperationResult<Data, Variables>
  >(sub, getSnapshot, getSnapshot);

  meta.prevValue = result = computeNextState(meta.prevValue, result);

  const currDeps = [
    client,
    request,
    args.pause,
    args.requestPolicy,
    args.context,
  ];

  if (hasDepsChanged(deps, currDeps) && !args.pause) {
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

    setMeta({
      prevValue: result,
      source: args.pause ? null : source,
      deps: currDeps,
    });
  }

  return [result, executeQuery];
}

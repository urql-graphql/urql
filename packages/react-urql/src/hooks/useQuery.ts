/* eslint-disable react-hooks/exhaustive-deps */

import { DocumentNode } from 'graphql';
import { Source, pipe, subscribe, onEnd, onPush, takeWhile } from 'wonka';
import { useState, useEffect, useCallback, useMemo } from 'react';

import {
  AnyVariables,
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
import { getCacheForClient } from './cache';
import { initialState, computeNextState, hasDepsChanged } from './state';

export type UseQueryArgs<
  Variables extends AnyVariables = AnyVariables,
  Data = any
> = {
  query: string | DocumentNode | TypedDocumentNode<Data, Variables>;
  requestPolicy?: RequestPolicy;
  context?: Partial<OperationContext>;
  pause?: boolean;
} & (Variables extends void
  ? {
      variables?: Variables;
    }
  : {
      variables: Variables;
    });

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

const isSuspense = (client: Client, context?: Partial<OperationContext>) =>
  client.suspense && (!context || context.suspense !== false);

export function useQuery<
  Data = any,
  Variables extends AnyVariables = AnyVariables
>(args: UseQueryArgs<Variables, Data>): UseQueryResponse<Data, Variables> {
  const client = useClient();
  const cache = getCacheForClient(client);
  const suspense = isSuspense(client, args.context);
  const request = useRequest(args.query, args.variables as Variables);

  const source = useMemo(() => {
    if (args.pause) return null;

    const source = client.executeQuery(request, {
      requestPolicy: args.requestPolicy,
      ...args.context,
    });

    return suspense
      ? pipe(
          source,
          onPush(result => {
            cache.set(request.key, result);
          })
        )
      : source;
  }, [
    cache,
    client,
    request,
    suspense,
    args.pause,
    args.requestPolicy,
    args.context,
  ]);

  const getSnapshot = useCallback(
    (
      source: Source<OperationResult<Data, Variables>> | null,
      suspense: boolean
    ): Partial<UseQueryState<Data, Variables>> => {
      if (!source) return { fetching: false };

      let result = cache.get(request.key);
      if (!result) {
        let resolve: (value: unknown) => void;

        const subscription = pipe(
          source,
          takeWhile(() => (suspense && !resolve) || !result),
          subscribe(_result => {
            result = _result;
            if (resolve) resolve(result);
          })
        );

        if (result == null && suspense) {
          const promise = new Promise(_resolve => {
            resolve = _resolve;
          });

          cache.set(request.key, promise);
          throw promise;
        } else {
          subscription.unsubscribe();
        }
      } else if (suspense && result != null && 'then' in result) {
        throw result;
      }

      return (result as OperationResult<Data, Variables>) || { fetching: true };
    },
    [cache, request]
  );

  const deps = [
    client,
    request,
    args.requestPolicy,
    args.context,
    args.pause,
  ] as const;

  const [state, setState] = useState(
    () =>
      [
        source,
        computeNextState(initialState, getSnapshot(source, suspense)),
        deps,
      ] as const
  );

  let currentResult = state[1];
  if (source !== state[0] && hasDepsChanged(state[2], deps)) {
    setState([
      source,
      (currentResult = computeNextState(
        state[1],
        getSnapshot(source, suspense)
      )),
      deps,
    ]);
  }

  useEffect(() => {
    const source = state[0];
    const request = state[2][1];

    let hasResult = false;

    const updateResult = (result: Partial<UseQueryState<Data, Variables>>) => {
      hasResult = true;
      setState(state => {
        const nextResult = computeNextState(state[1], result);
        return state[1] !== nextResult
          ? [state[0], nextResult, state[2]]
          : state;
      });
    };

    if (source) {
      const subscription = pipe(
        source,
        onEnd(() => {
          updateResult({ fetching: false });
        }),
        subscribe(updateResult)
      );

      if (!hasResult) updateResult({ fetching: true });

      return () => {
        cache.dispose(request.key);
        subscription.unsubscribe();
      };
    } else {
      updateResult({ fetching: false });
    }
  }, [cache, state[0], state[2][1]]);

  const executeQuery = useCallback(
    (opts?: Partial<OperationContext>) => {
      const context = {
        requestPolicy: args.requestPolicy,
        ...args.context,
        ...opts,
      };

      setState(state => {
        const source = suspense
          ? pipe(
              client.executeQuery(request, context),
              onPush(result => {
                cache.set(request.key, result);
              })
            )
          : client.executeQuery(request, context);
        return [source, state[1], deps];
      });
    },
    [
      client,
      cache,
      request,
      suspense,
      getSnapshot,
      args.requestPolicy,
      args.context,
    ]
  );

  return [currentResult, executeQuery];
}

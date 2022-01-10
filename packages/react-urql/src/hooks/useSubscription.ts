/* eslint-disable react-hooks/exhaustive-deps */

import { DocumentNode } from 'graphql';
import { pipe, subscribe, onEnd, Source } from 'wonka';
import { useState, useCallback, useMemo, useRef } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import {
  TypedDocumentNode,
  CombinedError,
  OperationContext,
  Operation,
  OperationResult,
} from '@urql/core';

import { useRequest } from './useRequest';
import { initialState, computeNextState, hasDepsChanged } from './state';
import { useClient } from '../context';

export interface UseSubscriptionArgs<Variables = object, Data = any> {
  query: DocumentNode | TypedDocumentNode<Data, Variables> | string;
  variables?: Variables;
  pause?: boolean;
  context?: Partial<OperationContext>;
}

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export interface UseSubscriptionState<Data = any, Variables = object> {
  fetching: boolean;
  stale: boolean;
  data?: Data;
  error?: CombinedError;
  extensions?: Record<string, any>;
  operation?: Operation<Data, Variables>;
}

export type UseSubscriptionResponse<Data = any, Variables = object> = [
  UseSubscriptionState<Data, Variables>,
  (opts?: Partial<OperationContext>) => void
];

const notFetching = initialState;
const fetching = { ...initialState, fetching: true };

export function useSubscription<Data = any, Result = Data, Variables = object>(
  args: UseSubscriptionArgs<Variables, Data>,
  handler?: SubscriptionHandler<Data, Result>
): UseSubscriptionResponse<Result, Variables> {
  const client = useClient();
  const request = useRequest(args.query, args.variables);

  const handlerRef = useRef<SubscriptionHandler<Data, Result> | undefined>(
    handler
  );

  handlerRef.current = handler;

  const [meta, setMeta] = useState<{
    source: Source<OperationResult<Data, Variables>> | null;
    deps: Array<any>;
  }>({
    source: null,
    deps: [],
  });

  const { source, deps } = meta;

  const state = useRef(args.pause ? notFetching : fetching);

  const [getSnapshot, sub] = useMemo(() => {
    const getSnapshot = () => state.current;

    const sub = notify => {
      const updateResult = (
        result: Partial<UseSubscriptionState<Data, Variables>>
      ) => {
        const nextResult = computeNextState(state.current, result);
        if (state.current === nextResult) return;
        if (handlerRef.current && state.current.data !== nextResult.data) {
          state.current.data = handlerRef.current(
            state.current.data,
            nextResult.data!
          ) as any;
        }
        notify();
      };

      if (source) {
        return pipe(
          source,
          onEnd(() => {
            updateResult({ fetching: false });
          }),
          subscribe(updateResult)
        ).unsubscribe;
      } else {
        updateResult({ fetching: false });
        return () => {
          /*noop*/
        };
      }
    };

    return [getSnapshot, sub];
  }, [source, args.pause]);

  const result = useSyncExternalStore(sub, getSnapshot, getSnapshot);

  const currDeps = [client, request, args.pause, args.context];
  if (hasDepsChanged(deps, currDeps) && !args.pause) {
    const fetchSource = client.executeSubscription(request, {
      ...args.context,
    });

    state.current.fetching = !args.pause;
    setMeta({
      source: args.pause ? null : fetchSource,
      deps: currDeps,
    });
  }

  const executeSubscription = useCallback(
    (opts?: Partial<OperationContext>) => {
      const s = client.executeSubscription(request, {
        ...args.context,
        ...opts,
      });

      state.current.fetching = true;
      setMeta(prev => ({
        deps: prev.deps,
        source: s,
      }));
    },
    [client, request, args.context]
  );

  return [result, executeSubscription];
}

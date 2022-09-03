/* eslint-disable react-hooks/exhaustive-deps */

import { DocumentNode } from 'graphql';
import { pipe, subscribe, onEnd } from 'wonka';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

import {
  AnyVariables,
  TypedDocumentNode,
  CombinedError,
  OperationContext,
  Operation,
} from '@urql/core';

import { useClient } from '../context';
import { useRequest } from './useRequest';
import { initialState, computeNextState, hasDepsChanged } from './state';

export type UseSubscriptionArgs<
  Variables extends AnyVariables = AnyVariables,
  Data = any
> = {
  query: DocumentNode | TypedDocumentNode<Data, Variables> | string;
  pause?: boolean;
  context?: Partial<OperationContext>;
} & (Variables extends void
  ? {
      variables?: Variables;
    }
  : Variables extends { [P in keyof Variables]: Variables[P] | null }
  ? { variables?: Variables }
  : {
      variables: Variables;
    });

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export interface UseSubscriptionState<
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

export type UseSubscriptionResponse<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = [
  UseSubscriptionState<Data, Variables>,
  (opts?: Partial<OperationContext>) => void
];

export function useSubscription<
  Data = any,
  Result = Data,
  Variables extends AnyVariables = AnyVariables
>(
  args: UseSubscriptionArgs<Variables, Data>,
  handler?: SubscriptionHandler<Data, Result>
): UseSubscriptionResponse<Result, Variables> {
  const client = useClient();
  const request = useRequest(args.query, args.variables as Variables);

  const handlerRef = useRef<SubscriptionHandler<Data, Result> | undefined>(
    handler
  );
  handlerRef.current = handler;

  const source = useMemo(
    () =>
      !args.pause ? client.executeSubscription(request, args.context) : null,
    [client, request, args.pause, args.context]
  );

  const deps = [client, request, args.context, args.pause] as const;

  const [state, setState] = useState(
    () => [source, { ...initialState, fetching: !!source }, deps] as const
  );

  let currentResult = state[1];
  if (source !== state[0] && hasDepsChanged(state[2], deps)) {
    setState([
      source,
      (currentResult = computeNextState(state[1], { fetching: !!source })),
      deps,
    ]);
  }

  useEffect(() => {
    const updateResult = (
      result: Partial<UseSubscriptionState<Data, Variables>>
    ) => {
      setState(state => {
        const nextResult = computeNextState(state[1], result);
        if (state[1] === nextResult) return state;
        if (handlerRef.current && state[1].data !== nextResult.data) {
          nextResult.data = handlerRef.current(
            state[1].data,
            nextResult.data!
          ) as any;
        }

        return [state[0], nextResult as any, state[2]];
      });
    };

    if (state[0]) {
      return pipe(
        state[0],
        onEnd(() => {
          updateResult({ fetching: !!source });
        }),
        subscribe(updateResult)
      ).unsubscribe;
    } else {
      updateResult({ fetching: false });
    }
  }, [state[0]]);

  // This is the imperative execute function passed to the user
  const executeSubscription = useCallback(
    (opts?: Partial<OperationContext>) => {
      const source = client.executeSubscription(request, {
        ...args.context,
        ...opts,
      });

      setState(state => [source, state[1], deps]);
    },
    [client, args.context, request]
  );

  return [currentResult, executeSubscription];
}

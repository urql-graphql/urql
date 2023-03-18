import {
  AnyVariables,
  GraphQLRequestParams,
  Client,
  OperationContext,
  createRequest,
} from '@urql/core';

import {
  Source,
  pipe,
  map,
  fromValue,
  switchMap,
  subscribe,
  concat,
  scan,
  never,
} from 'wonka';

import { derived, writable } from 'svelte/store';

import {
  OperationResultState,
  OperationResultStore,
  Pausable,
  initialResult,
  createPausable,
  fromStore,
} from './common';

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export type SubscriptionArgs<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = {
  client: Client;
  context?: Partial<OperationContext>;
  pause?: boolean;
} & GraphQLRequestParams<Data, Variables>;

export function subscriptionStore<
  Data,
  Result = Data,
  Variables extends AnyVariables = AnyVariables
>(
  args: SubscriptionArgs<Data, Variables>,
  handler?: SubscriptionHandler<Data, Result>
): OperationResultStore<Result, Variables> & Pausable {
  const request = createRequest(args.query, args.variables as Variables);

  const operation = args.client.createRequestOperation(
    'subscription',
    request,
    args.context
  );
  const initialState: OperationResultState<Result, Variables> = {
    ...initialResult,
    operation,
    fetching: true,
  };
  const result$ = writable(initialState, () => {
    return subscription.unsubscribe;
  });
  const isPaused$ = writable(!!args.pause);

  const subscription = pipe(
    fromStore(isPaused$),
    switchMap(
      (isPaused): Source<Partial<OperationResultState<Data, Variables>>> => {
        if (isPaused) {
          return never as any;
        }

        return concat<Partial<OperationResultState<Data, Variables>>>([
          fromValue({ fetching: true, stale: false }),
          pipe(
            args.client.executeRequestOperation(operation),
            map(({ stale, data, error, extensions, operation }) => ({
              fetching: true,
              stale: !!stale,
              data,
              error,
              operation,
              extensions,
            }))
          ),
          fromValue({ fetching: false }),
        ]);
      }
    ),
    scan((result: OperationResultState<Result, Variables>, partial) => {
      const data =
        partial.data !== undefined
          ? typeof handler === 'function'
            ? handler(result.data, partial.data)
            : partial.data
          : result.data;
      return {
        ...result,
        ...partial,
        data,
      } as OperationResultState<Result, Variables>;
    }, initialState),
    subscribe(result => {
      result$.set(result);
    })
  );

  return {
    ...derived(result$, (result, set) => {
      set(result);
    }),
    ...createPausable(isPaused$),
  };
}

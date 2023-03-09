import {
  Client,
  GraphQLRequestParams,
  AnyVariables,
  OperationContext,
  RequestPolicy,
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

export type QueryArgs<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = {
  client: Client;
  context?: Partial<OperationContext>;
  requestPolicy?: RequestPolicy;
  pause?: boolean;
} & GraphQLRequestParams<Data, Variables>;

export function queryStore<
  Data = any,
  Variables extends AnyVariables = AnyVariables
>(
  args: QueryArgs<Data, Variables>
): OperationResultStore<Data, Variables> & Pausable {
  const request = createRequest(args.query, args.variables as Variables);

  const context: Partial<OperationContext> = {
    requestPolicy: args.requestPolicy,
    ...args.context,
  };

  const operation = args.client.createRequestOperation(
    'query',
    request,
    context
  );
  const initialState: OperationResultState<Data, Variables> = {
    ...initialResult,
    operation,
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
              fetching: false,
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
    scan(
      (result: OperationResultState<Data, Variables>, partial) => ({
        ...result,
        ...partial,
      }),
      initialState
    ),
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

import { pipe, map, scan, subscribe } from 'wonka';
import { derived, writable } from 'svelte/store';

import {
  AnyVariables,
  GraphQLRequestParams,
  Client,
  OperationContext,
  createRequest,
} from '@urql/core';

import {
  OperationResultState,
  OperationResultStore,
  initialResult,
} from './common';

export type MutationArgs<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = {
  client: Client;
  context?: Partial<OperationContext>;
} & GraphQLRequestParams<Data, Variables>;

export function mutationStore<
  Data = any,
  Variables extends AnyVariables = AnyVariables
>(args: MutationArgs<Data, Variables>): OperationResultStore<Data, Variables> {
  const request = createRequest(args.query, args.variables as Variables);
  const operation = args.client.createRequestOperation(
    'mutation',
    request,
    args.context
  );
  const initialState: OperationResultState<Data, Variables> = {
    ...initialResult,
    operation,
    fetching: true,
  };
  const result$ = writable(initialState);

  const subscription = pipe(
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

  return derived(result$, (result, set) => {
    set(result);
    return subscription.unsubscribe;
  });
}

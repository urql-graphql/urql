import type { DocumentNode } from 'graphql';
import {
  Client,
  OperationContext,
  TypedDocumentNode,
  createRequest,
} from '@urql/core';
import { pipe, map, scan, subscribe } from 'wonka';
import { derived, writable } from 'svelte/store';

import {
  OperationResultState,
  OperationResultStore,
  initialResult,
} from './common';

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export interface MutationArgs<Data = any, Variables = object> {
  client: Client;
  query: string | DocumentNode | TypedDocumentNode<Data, Variables>;
  variables: Variables;
  context?: Partial<OperationContext>;
}

export function mutationStore<Data = any, Result = Data, Variables = object>(
  args: MutationArgs<Data, Variables>,
  handler?: SubscriptionHandler<Data, Result>
): OperationResultStore<Result, Variables> {
  const request = createRequest(args.query, args.variables);
  const operation = args.client.createRequestOperation(
    'mutation',
    request,
    args.context
  );
  const initialState: OperationResultState<Result, Variables> = {
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
    scan((result: OperationResultState<Result, Variables>, partial: any) => {
      // If a handler has been passed, it's used to merge new data in
      const data =
        partial.data !== undefined
          ? typeof handler === 'function'
            ? handler(result.data, partial.data)
            : partial.data
          : result.data;
      return { ...result, ...partial, data };
    }, initialState),
    subscribe(result => {
      result$.set(result);
    })
  );

  return derived(result$, (result, set) => {
    set(result);
    return subscription.unsubscribe;
  });
}

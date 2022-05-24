import type { DocumentNode } from 'graphql';
import {
  Client,
  OperationContext,
  TypedDocumentNode,
  createRequest,
} from '@urql/core';
import { pipe, map, fromValue, scan, subscribe, concat } from 'wonka';
import { derived, writable } from 'svelte/store';

import {
  OperationResultState,
  OperationResultStore,
  initialResult,
} from './common';

export interface MutationArgs<Data = any, Variables = object> {
  client: Client;
  query: string | DocumentNode | TypedDocumentNode<Data, Variables>;
  variables: Variables;
  context?: Partial<OperationContext>;
}

export function mutationStore<Data = any, Variables = object>(
  args: MutationArgs<Data, Variables>
): OperationResultStore<Data, Variables> {
  const request = createRequest(args.query, args.variables);
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
    concat<Partial<OperationResultState<Data, Variables>>>([
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
    ]),
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

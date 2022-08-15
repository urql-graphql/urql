import type { DocumentNode } from 'graphql';
import {
  AnyVariables,
  Client,
  OperationContext,
  TypedDocumentNode,
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

export type SubscriptionArgs<
  Data = any,
  Variables extends AnyVariables = AnyVariables
> = {
  client: Client;
  query: string | DocumentNode | TypedDocumentNode<Data, Variables>;
  context?: Partial<OperationContext>;
  pause?: boolean;
} & (Variables extends void
  ? {
      variables?: Variables;
    }
  : {
      variables: Variables;
    });

export function subscriptionStore<
  Data,
  Variables extends AnyVariables = AnyVariables
>(
  args: SubscriptionArgs<Data, Variables>
): OperationResultStore<Data, Variables> & Pausable {
  const request = createRequest(args.query, args.variables as Variables);

  const operation = args.client.createRequestOperation(
    'subscription',
    request,
    args.context
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

import { pipe, subscribe, filter, concatMap } from 'wonka';
import type { OperationContext } from '@urql/core';
import { derived, writable } from 'svelte/store';
import { createRequest } from '@urql/core';
import type {
  AnnotatedOperationResult,
  UrqlStore,
  UrqlStoreArgs,
  Pausable,
} from './common';
import {
  defaultBaseResult,
  fetchProcess,
  fromStore,
  createPausable,
} from './common';

/**
 * Create a Svelte store for an [Urql subscription](https://formidable.com/open-source/urql/docs/api/core/#clientexecutemutation) using [Wonka](https://wonka.kitten.sh/)
 */
export function subscriptionStore<Data, Variables extends object = {}>(
  args: UrqlStoreArgs<Data, Variables> & {
    /** initial value for `isPaused$` (default is `false`) */
    isPaused?: boolean;
  }
) {
  // create the graphql request
  const request = createRequest(args.query, args.variables);

  // `args.context.requestPolicy` beats `args.requestPolcy`
  const context: Partial<OperationContext> = {
    requestPolicy: args.requestPolicy,
    ...args.context,
  };

  // combine default with operation details
  const baseResult: AnnotatedOperationResult<Data, Variables> = {
    ...defaultBaseResult,
    operation: args.client.createRequestOperation('subscription', request),
  };

  // create a store for fetch results (uses any placeholderData provided)
  const writableResult$ = writable<AnnotatedOperationResult<Data, Variables>>(
    baseResult
  );

  // create a store for `Pausable` interface (defaults to false)
  // package es2015 doesn't support nullish coalescing operator (??)
  const isPaused$ = writable(args.isPaused ? true : false);

  // make the store reactive (ex: change when we receive a response)
  pipe(
    // have wonka subscribe to the pauseStore
    fromStore(isPaused$),

    // don't continue if paused
    filter(isPaused => !isPaused),

    // now we want to fetch the return type, so we must concatMap
    concatMap(() =>
      fetchProcess(
        args.client.executeSubscription<Data, Variables>(request, context),
        baseResult
      )
    ),

    // update the store whenever a result is emitted
    subscribe(annotatedResult => writableResult$.set(annotatedResult))
  );

  // derive a `Readable` store (only Urql can set the fetch result)
  const result$ = derived(writableResult$, result => {
    return result;
  });

  // combine and return UrqlStore & Pausable
  return {
    ...result$,
    ...createPausable(isPaused$),
  } as UrqlStore<Data, Variables> & Pausable;
}

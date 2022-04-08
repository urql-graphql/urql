import { pipe, concatMap, subscribe, filter } from 'wonka';
import type { OperationContext } from '@urql/core';
import { derived, writable } from 'svelte/store';
import { createRequest } from '@urql/core';
import type {
  AnnotatedOperationResult,
  UrqlStore,
  Pausable,
  UrqlStoreArgs,
} from './common';
import {
  defaultBaseResult,
  createPausable,
  fetchProcess,
  fromStore,
} from './common';

/**
 * Creates a Svelte store for an [Urql query](https://formidable.com/open-source/urql/docs/api/core/#clientexecutequery) using [Wonka](https://wonka.kitten.sh/)
 */
export function queryStore<Data, Variables extends object = {}>(
  args: UrqlStoreArgs<Data, Variables> & {
    /** initial value for `isPaused$` return (default is `false`) */
    pause?: boolean;
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
    operation: args.client.createRequestOperation('query', request),
  };

  // create a store for fetch results (uses any placeholderData provided)
  const writableResult$ = writable(baseResult);

  // create a store for `Pausable` interface (defaults to false)
  // package es2015 doesn't support nullish coalescing operator (??)
  const isPaused$ = writable(args.pause ? true : false);

  // record when the fetch is complete
  let isComplete = false;

  // make the store reactive (ex: change when we receive a response)
  const wonkaSubscription = pipe(
    // have wonka subscribe to the pauseStore
    fromStore(isPaused$),

    // don't continue if paused
    filter(isPaused => !isPaused),

    // now we want to fetch the return type, so we must concatMap
    concatMap(() =>
      fetchProcess(
        args.client.executeQuery<Data, Variables>(request, context),
        baseResult,
        () => (isComplete = true)
      )
    ),

    // update the store whenever a result is emitted
    subscribe(annotatedResult => writableResult$.set(annotatedResult))
  );

  // derive a `Readable` store (only Urql can set the fetch result)
  const result$ = derived(writableResult$, result => {
    // stop listening when the fetch `isComplete`
    if (isComplete) wonkaSubscription.unsubscribe();
    return result;
  });

  // combine and return UrqlStore & Pausable
  return {
    ...result$,
    ...createPausable(isPaused$),
  } as UrqlStore<Data, Variables> & Pausable;
}

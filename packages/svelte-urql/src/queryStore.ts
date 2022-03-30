import { pipe, concatMap, subscribe, filter } from 'wonka';
import type { OperationContext, Client, RequestPolicy } from '@urql/core';
import { derived, writable } from 'svelte/store';
import type { DocumentNode } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { createRequest } from '@urql/core';
import type { AnnotatedOperationResult, UrqlStore, Pausable } from './common';
import {
  defaultBaseResult,
  createPausable,
  fetchProcess,
  fromStore,
} from './common';

/**
 * Creates a Svelte store for an [Urql query](https://formidable.com/open-source/urql/docs/api/core/#clientexecutequery) using [Wonka](https://wonka.kitten.sh/)
 */
export function queryStore<Data, Variables extends object = {}>(props: {
  /** an [Urql client](https://formidable.com/open-source/urql/docs/api/core/#client)  */
  client: Client;
  /** a graphql tag */
  query: DocumentNode | TypedDocumentNode<Data, Variables> | string;
  /** the variables to be used in the fetch operation */
  variables: Variables;
  /** Urql fetching options */
  context?: Partial<OperationContext>;
  /** Convenience input.  Ignored if context.requestPolicy is provided */
  requestPolicy?: RequestPolicy;
  /** initial value for `isPaused$` (default is `false`) */
  isPaused?: boolean;
}) {
  // create the graphql request
  const request = createRequest(props.query, props.variables);

  // `props.context.requestPolicy` beats `props.requestPolcy`
  const context: Partial<OperationContext> = {
    requestPolicy: props.requestPolicy,
    ...props.context,
  };

  // combine default with operation details
  const baseResult: AnnotatedOperationResult<Data, Variables> = {
    ...defaultBaseResult,
    operation: props.client.createRequestOperation('query', request),
  };

  // create a store for fetch results (uses any placeholderData provided)
  const writableResult$ = writable(baseResult);

  // create a store for `Pausable` interface (defaults to false)
  // package es2015 doesn't support nullish coalescing operator (??)
  const isPaused$ = writable(props.isPaused ? true : false);

  // record when the fetch is complete
  let isComplete = false;

  // make the store reactive (ex: change when we receive a response)
  const wonkaSubscription = pipe(
    // have wonka subscribe to the pauseStore
    fromStore(isPaused$),

    // don't continue if paused
    filter(isPaused => !isPaused),

    // now we want to fetch a different type, so we must concatMap
    concatMap(() =>
      fetchProcess(
        props.client.executeQuery<Data, Variables>(request, context),
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

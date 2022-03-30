import { pipe, subscribe } from 'wonka';
import type { OperationContext } from '@urql/core';
import { derived, writable } from 'svelte/store';
import { createRequest } from '@urql/core';
import type {
  AnnotatedOperationResult,
  UrqlStore,
  UrqlStoreArgs,
} from './common';
import { defaultBaseResult, fetchProcess } from './common';

/**
 * Create a Svelte store for an [Urql mutation](https://formidable.com/open-source/urql/docs/api/core/#clientexecutemutation) using [Wonka](https://wonka.kitten.sh/)
 */
export function mutationStore<Data, Variables extends object = {}>(
  args: UrqlStoreArgs<Data, Variables>
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
    operation: args.client.createRequestOperation('mutation', request),
  };

  // create a store for fetch results (uses any placeholderData provided)
  const writableResult$ = writable<AnnotatedOperationResult<Data, Variables>>(
    baseResult
  );

  // record when the fetch is complete
  let isComplete = false;

  // make the store reactive (ex: change when we receive a response)
  const wonkaSubscription = pipe(
    fetchProcess(
      args.client.executeMutation<Data, Variables>(request, context),
      baseResult,
      () => (isComplete = true)
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

  // return UrqlStore
  return result$ as UrqlStore<Data, Variables>;
}

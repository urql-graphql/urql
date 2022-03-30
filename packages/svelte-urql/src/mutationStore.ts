import { pipe, subscribe } from 'wonka';
import type { OperationContext, Client, RequestPolicy } from '@urql/core';
import { derived, writable } from 'svelte/store';
import type { DocumentNode } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { createRequest } from '@urql/core';
import type { AnnotatedOperationResult, UrqlStore } from './common';
import { defaultBaseResult, fetchProcess } from './common';

/**
 * Create a Svelte store for an [Urql mutation](https://formidable.com/open-source/urql/docs/api/core/#clientexecutemutation) using [Wonka](https://wonka.kitten.sh/)
 */
export function mutationStore<Data, Variables extends object = {}>(props: {
  /** an [Urql client](https://formidable.com/open-source/urql/docs/api/core/#client)  */
  client: Client;
  /** a graphql tag */
  mutation: DocumentNode | TypedDocumentNode<Data, Variables> | string;
  /** the variables to be used in the fetch operation */
  variables?: Variables;
  /** Urql fetching options */
  context?: Partial<OperationContext>;
  /** Convenience input.  Ignored if conext.requestPolicy is provided */
  requestPolicy: RequestPolicy;
}) {
  // create the graphql request
  const request = createRequest(props.mutation, props.variables);

  // `props.context.requestPolicy` beats `props.requestPolcy`
  const context: Partial<OperationContext> = {
    requestPolicy: props.requestPolicy,
    ...props.context,
  };

  // combine default with operation details
  const baseResult: AnnotatedOperationResult<Data, Variables> = {
    ...defaultBaseResult,
    operation: props.client.createRequestOperation('mutation', request),
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
      props.client.executeMutation<Data, Variables>(request, context),
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

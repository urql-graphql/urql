import { pipe, subscribe } from 'wonka';
import type { OperationContext, Client, RequestPolicy } from '@urql/core';
import { derived, writable } from 'svelte/store';
import type { DocumentNode } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { createRequest } from '@urql/core';
import type { AnnotatedOperationResult, UrqlStore } from './common';
import { defaultBaseResult, fetchProcess } from './common';

/**
 * Create a Svelte store for an [Urql subscription](https://formidable.com/open-source/urql/docs/api/core/#clientexecutemutation) using [Wonka](https://wonka.kitten.sh/)
 */
export function subscriptionStore<Data, Variables extends object = {}>(props: {
  /** an [Urql client](https://formidable.com/open-source/urql/docs/api/core/#client)  */
  client: Client;
  /** a graphql tag */
  subscription: DocumentNode | TypedDocumentNode<Data, Variables> | string;
  /** the variables to be used in the fetch operation */
  variables?: Variables;
  /** Urql fetching options */
  context?: Partial<OperationContext>;
  /** Convenience input.  Ignored if context.requestPolicy is provided */
  requestPolicy?: RequestPolicy;
}) {
  // create the graphql request
  const request = createRequest(props.subscription, props.variables);

  // `props.context.requestPolicy` beats `props.requestPolcy`
  const context: Partial<OperationContext> = {
    requestPolicy: props.requestPolicy,
    ...props.context,
  };

  // combine default with operation details
  const baseResult: AnnotatedOperationResult<Data, Variables> = {
    ...defaultBaseResult,
    operation: props.client.createRequestOperation('subscription', request),
  };

  // create a store for fetch results (uses any placeholderData provided)
  const writableResult$ = writable<AnnotatedOperationResult<Data, Variables>>(
    baseResult
  );

  /**@todo unsubscribe */
  // make the store reactive (ex: change when we receive a response)
  pipe(
    fetchProcess(
      props.client.executeSubscription<Data, Variables>(request, context),
      baseResult
    ),

    // update the store whenever a result is emitted
    subscribe(annotatedResult => writableResult$.set(annotatedResult))
  );

  // derive a `Readable` store (only Urql can set the fetch result)
  const result$ = derived(writableResult$, result => {
    return result;
  });

  // return UrqlStore
  return result$ as UrqlStore<Data, Variables>;
}

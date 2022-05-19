import type { Readable, Writable } from 'svelte/store';
import type {
  OperationResult,
  RequestPolicy,
  OperationContext,
  Client,
  TypedDocumentNode,
} from '@urql/core';
import { pipe, fromValue, concat, map, makeSubject, share } from 'wonka';
import type { DocumentNode } from 'graphql';

/**
 * An OperationResult annotated with convenience properties
 *
 * @todo
 * React, Vue, and Svelte bindings all use `{fetching:boolean}`
 * - https://formidable.com/open-source/urql/docs/basics/svelte/#run-a-first-query
 * - https://formidable.com/open-source/urql/docs/basics/vue/#run-a-first-query
 *
 * This probably shouldn't be a Svelte-specific interface, however `@urql/core` doesn't appear to define it
 *
 * @todo
 * preferably, this would also have status properties for convenience:
 *
 * - `isIdle`: !fetching && !data
 * - `isFetching`: !!fetching && !data
 * - `isSuccess`: !error && !!data
 * - `isError`: !!error
 */
export interface AnnotatedOperationResult<Data, Variables>
  extends OperationResult<Data, Variables> {
  /** `true`: awaiting fetch response (no error, no data), otherwise `false` */
  fetching: boolean;
}

/** Options passed to `queryStore`, `mutationStore`, and `subscriptionStore` */
export interface UrqlStoreArgs<Data, Variables extends object = {}> {
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
}

/**
 * A Svelte ["Readable" store](https://svelte.dev/docs#run-time-svelte-store-readable) containing Urql [operation results](https://formidable.com/open-source/urql/docs/api/core/#operationresult) along with some convenience tools.
 */
export type UrqlStore<Data, Variables extends object = {}> = Readable<
  AnnotatedOperationResult<Data, Variables>
>;

/**
 * Make a Wonka source from a Svelte store
 * @param store$ a Svelte store
 * @returns a [Wonka source](https://wonka.kitten.sh/api/sources#makesubject) subscribing to the store's changes
 */
export function fromStore<T>(store$: Readable<T>) {
  const subject = makeSubject<T>();
  const { source, next } = subject;
  store$.subscribe(value => next(value));
  return source;
}

/**
 * The starting annotated result object (before fetching)
 */
export const defaultBaseResult = {
  fetching: false,
  stale: false,
  error: undefined,
  data: undefined,
  extensions: undefined,
};

/**
 * Wonka fetching process:
 *
 * 1. EMIT: set fetching:true
 * 2. fetch response(s)
 * 3. EMIT: build a result from response (fetching:false)
 */
export function fetchProcess<Data, Variables>(
  baseResult: AnnotatedOperationResult<Data, Variables>,
  client: Client
) {
  /** fetching:true when starting */
  const baseSource = pipe(fromValue({ ...baseResult, fetching: true }), share);

  /** fetch via urql */
  const urqlSource = pipe(
    client.executeRequestOperation(baseResult.operation),

    // build annotated result from base (set fetching:false)
    map(response => ({ ...baseResult, ...response })),
    share
  );

  // concat combines sources into a sequential source
  const source = pipe(concat([baseSource, urqlSource]), share);

  return source;
}

/**
 * An object containing an `isPaused$` store and helpers.
 * An UrqlStore must not fetch when `isPaused:true`
 * - The trailing `$` convention is used to [indicate a store](https://github.com/sveltejs/svelte/issues/6373)
 */
export interface Pausable {
  /** a boolean svelte store  */
  isPaused$: Writable<boolean>;
  /** equivalent to isPaused$.set(true) */
  pause: () => void;
  /** equivalent to isPaused$.set(false) */
  unpause: () => void;
}

/**
 * Add pause/unpause helper functions to a boolean store
 */
export function createPausable(isPaused$: Writable<boolean>) {
  return {
    isPaused$,
    pause: () => {
      isPaused$.set(true);
    },
    unpause: () => {
      isPaused$.set(false);
    },
  } as Pausable;
}

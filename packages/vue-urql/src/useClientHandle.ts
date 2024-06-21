import type { AnyVariables, Client, DocumentInput } from '@urql/core';
import type { WatchStopHandle } from 'vue';
import { getCurrentInstance, onMounted, onBeforeUnmount } from 'vue';

import { useClient } from './useClient';

import type { UseQueryArgs, UseQueryResponse } from './useQuery';
import { callUseQuery } from './useQuery';

import type { UseMutationResponse } from './useMutation';
import { callUseMutation } from './useMutation';

import type {
  UseSubscriptionArgs,
  SubscriptionHandlerArg,
  UseSubscriptionResponse,
} from './useSubscription';
import { callUseSubscription } from './useSubscription';

/** Handle to create GraphQL operations outside of Vue’s `setup` functions.
 *
 * @remarks
 * The `ClientHandle` object is created inside a Vue `setup` function but
 * allows its methods to be called outside of `setup` functions, delaying
 * the creation of GraphQL operations, as an alternative to pausing queries
 * or subscriptions.
 *
 * This is also important when chaining multiple functions inside an
 * `async setup()` function.
 *
 * Hint: If you only need a single, non-updating result and want to execute
 * queries programmatically, it may be easier to call the {@link Client.query}
 * method.
 */
export interface ClientHandle {
  /** The {@link Client} that’ll be used to execute GraphQL operations. */
  client: Client;

  /** Calls {@link useQuery} outside of a synchronous Vue `setup` function.
   *
   * @param args - a {@link UseQueryArgs} object, to pass a `query`, `variables`, and options.
   * @returns a {@link UseQueryResponse} object.
   *
   * @remarks
   * Creates a {@link UseQueryResponse} outside of a synchronous Vue `setup`
   * function or when chained in an `async setup()` function.
   */
  useQuery<T = any, V extends AnyVariables = AnyVariables>(
    args: UseQueryArgs<T, V>
  ): UseQueryResponse<T, V>;

  /** Calls {@link useSubscription} outside of a synchronous Vue `setup` function.
   *
   * @param args - a {@link UseSubscriptionArgs} object, to pass a `query`, `variables`, and options.
   * @param handler - optionally, a {@link SubscriptionHandler} function to combine multiple subscription results.
   * @returns a {@link UseSubscriptionResponse} object.
   *
   * @remarks
   * Creates a {@link UseSubscriptionResponse} outside of a synchronous Vue `setup`
   * function or when chained in an `async setup()` function.
   */
  useSubscription<T = any, R = T, V extends AnyVariables = AnyVariables>(
    args: UseSubscriptionArgs<T, V>,
    handler?: SubscriptionHandlerArg<T, R>
  ): UseSubscriptionResponse<T, R, V>;

  /** Calls {@link useMutation} outside of a synchronous Vue `setup` function.
   *
   * @param query - a GraphQL mutation document which `useMutation` will execute.
   * @returns a {@link UseMutationResponse} object.
   *
   * @remarks
   * Creates a {@link UseMutationResponse} outside of a synchronous Vue `setup`
   * function or when chained in an `async setup()` function.
   */
  useMutation<T = any, V extends AnyVariables = AnyVariables>(
    query: DocumentInput<T, V>
  ): UseMutationResponse<T, V>;
}

/** Creates a {@link ClientHandle} inside a Vue `setup` function.
 *
 * @remarks
 * `useClientHandle` creates and returns a {@link ClientHandle}
 * when called in a Vue `setup` function, which allows queries,
 * mutations, and subscriptions to be created _outside_ of
 * `setup` functions.
 *
 * This is also important when chaining multiple functions inside an
 * `async setup()` function.
 *
 * {@link useQuery} and other GraphQL functions must usually
 * be created in Vue `setup` functions so they can stop GraphQL
 * operations when your component unmounts. However, while they
 * queries and subscriptions can be paused, sometimes it’s easier
 * to delay the creation of their response objects.
 *
 *
 * @example
 * ```ts
 * import { ref, computed } from 'vue';
 * import { gql, useClientHandle } from '@urql/vue';
 *
 * export default {
 *   async setup() {
 *     const handle = useClientHandle();
 *
 *     const pokemons = await handle.useQuery({
 *       query: gql`{ pokemons(limit: 10) { id, name } }`,
 *     });
 *
 *     const index = ref(0);
 *
 *     // The `handle` allows another `useQuery` call to now be setup again
 *     const pokemon = await handle.useQuery({
 *       query: gql`
 *         query ($id: ID!) {
 *           pokemon(id: $id) { id, name }
 *         }
 *       `,
 *       variables: computed(() => ({
 *         id: pokemons.data.value.pokemons[index.value].id,
 *       }),
 *     });
 *   }
 * };
 * ```
 */
export function useClientHandle(): ClientHandle {
  const client = useClient();
  const stops: WatchStopHandle[] = [];

  onBeforeUnmount(() => {
    let stop: WatchStopHandle | void;
    while ((stop = stops.shift())) stop();
  });

  const handle: ClientHandle = {
    client: client.value,

    useQuery<T = any, V extends AnyVariables = AnyVariables>(
      args: UseQueryArgs<T, V>
    ): UseQueryResponse<T, V> {
      return callUseQuery(args, client, stops);
    },

    useSubscription<T = any, R = T, V extends AnyVariables = AnyVariables>(
      args: UseSubscriptionArgs<T, V>,
      handler?: SubscriptionHandlerArg<T, R>
    ): UseSubscriptionResponse<T, R, V> {
      return callUseSubscription(args, handler, client, stops);
    },

    useMutation<T = any, V extends AnyVariables = AnyVariables>(
      query: DocumentInput<T, V>
    ): UseMutationResponse<T, V> {
      return callUseMutation(query, client);
    },
  };

  if (process.env.NODE_ENV !== 'production') {
    onMounted(() => {
      Object.assign(handle, {
        useQuery<T = any, V extends AnyVariables = AnyVariables>(
          args: UseQueryArgs<T, V>
        ): UseQueryResponse<T, V> {
          if (process.env.NODE_ENV !== 'production' && !getCurrentInstance()) {
            throw new Error(
              '`handle.useQuery()` should only be called in the `setup()` or a lifecycle hook.'
            );
          }

          return callUseQuery(args, client, stops);
        },

        useSubscription<T = any, R = T, V extends AnyVariables = AnyVariables>(
          args: UseSubscriptionArgs<T, V>,
          handler?: SubscriptionHandlerArg<T, R>
        ): UseSubscriptionResponse<T, R, V> {
          if (process.env.NODE_ENV !== 'production' && !getCurrentInstance()) {
            throw new Error(
              '`handle.useSubscription()` should only be called in the `setup()` or a lifecycle hook.'
            );
          }

          return callUseSubscription(args, handler, client, stops);
        },
      });
    });
  }

  return handle;
}

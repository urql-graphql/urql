import { inject, Ref, ref, watch } from 'vue-demi';
import { DocumentNode } from 'graphql';
import { pipe, subscribe } from 'wonka';
import {
  CombinedError,
  OperationContext,
  RequestPolicy,
  Operation,
  Client,
  createRequest,
  GraphQLRequest,
} from '@urql/core';
import { initialState } from './constants';
import { onEnd } from 'wonka';

export interface UseQueryArgs<V> {
  query: string | DocumentNode;
  variables?: V;
  requestPolicy?: RequestPolicy;
  pollInterval?: number;
  context?: Partial<OperationContext>;
  pause?: boolean;
}

export interface UseQueryState<T> {
  fetching: boolean;
  stale: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
  operation?: Operation;
}

export type UseQueryResponse<T> = [
  UseQueryState<T>,
  (opts?: Partial<OperationContext>) => void,
  () => void,
  () => void
];

export function useQuery<T = any, V = object>(
  args: UseQueryArgs<V>
): UseQueryResponse<T> {
  const client = inject('$urql') as Client;

  if (process.env.NODE_ENV !== 'production' && !client) {
    throw new Error(
      'Cannot detect urql Client, did you forget to call `useClient`?'
    );
  }

  const result: Ref<UseQueryState<T>> = ref(initialState);
  const request: Ref<GraphQLRequest | undefined> = ref();
  const unsubscribe: Ref<null | (() => void)> = ref(null);

  const executeQuery = () => {
    if (typeof unsubscribe.value === 'function') {
      unsubscribe.value();
      unsubscribe.value = null;
    }
    result.value.fetching = true;

    // TODO: we can have a synchronous result
    unsubscribe.value = pipe(
      client.executeQuery(request.value as GraphQLRequest, args.context),
      onEnd(() => {
        result.value.fetching = false;
      }),
      subscribe(({ stale, data, error, extensions, operation }) => {
        result.value = {
          stale: !!stale,
          fetching: false,
          data,
          error,
          extensions,
          operation,
        };
      })
    ).unsubscribe;
  };

  if (!args.pause) {
    watch(request, () => {
      request.value = createRequest(args.query, args.variables || {});
      executeQuery();
    });
  }

  request.value = createRequest(args.query, args.variables || {});

  function pause() {
    if (typeof unsubscribe.value === 'function') {
      unsubscribe.value();
      unsubscribe.value = null;
    }
  }

  function resume() {
    executeQuery();
  }

  return [result.value, executeQuery, pause, resume];
}

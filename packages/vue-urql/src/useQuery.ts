import { inject, Ref, ref, watch, onMounted } from 'vue';
import { DocumentNode } from 'graphql';
import { pipe, subscribe, onEnd } from 'wonka';
import {
  CombinedError,
  OperationContext,
  RequestPolicy,
  Operation,
  Client,
  createRequest,
  GraphQLRequest,
} from '@urql/core';
import { initialState, noop } from './constants';
import { onPush } from 'wonka';
import { publish } from 'wonka';

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
  resume: () => void;
  pause: () => void;
  executeQuery: () => void;
}

export type UseQueryResponse<T> = UseQueryState<T>;

export function useQuery<T = any, V = object>(
  args: UseQueryArgs<V>
): UseQueryResponse<T> {
  const client = inject('$urql') as Client;

  if (process.env.NODE_ENV !== 'production' && !client) {
    throw new Error(
      'Cannot detect urql Client, did you forget to call `useClient`?'
    );
  }

  const result: Ref<UseQueryState<T>> = ref({
    ...initialState,
    resume: noop,
    pause: noop,
    executeQuery: noop,
  });

  const request: Ref<GraphQLRequest | undefined> = ref();
  const unsubscribe: Ref<null | (() => void)> = ref(null);

  const executeQuery = (result.value.executeQuery = () => {
    result.value.fetching = true;

    unsubscribe.value = pipe(
      client.executeQuery(request.value as GraphQLRequest, args.context),
      onEnd(() => {
        result.value.fetching = false;
      }),
      subscribe(({ stale, data, error, extensions, operation }) => {
        result.value.data = data;
        result.value.stale = !!stale;
        result.value.error = error;
        result.value.fetching = false;
        result.value.extensions = extensions;
        result.value.operation = operation;
      })
    ).unsubscribe;
  });

  if (!args.pause) {
    watch(request, (_value, _oldValue, onInvalidate) => {
      onInvalidate(() => {
        if (typeof unsubscribe.value === 'function') {
          unsubscribe.value();
          unsubscribe.value = null;
        }
      });

      if (!args.pause) {
        executeQuery();
      }
    });
  }

  request.value = createRequest(args.query, args.variables || {});

  onMounted(() => {
    // Checks for synchronous data in the cache.
    pipe(
      client.executeQuery(request.value as GraphQLRequest),
      onPush(({ stale, data, error, extensions, operation }) => {
        result.value.data = data;
        result.value.stale = !!stale;
        result.value.error = error;
        result.value.fetching = false;
        result.value.extensions = extensions;
        result.value.operation = operation;
      }),
      publish
    ).unsubscribe();

    if (!args.pause) executeQuery();
  });

  result.value.pause = function pause() {
    if (typeof unsubscribe.value === 'function') {
      unsubscribe.value();
      unsubscribe.value = null;
    }
  };

  result.value.resume = function resume() {
    if (!args.pause) executeQuery();
  };

  return result.value;
}

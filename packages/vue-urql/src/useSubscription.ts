import { inject, Ref, ref, watch, onMounted } from 'vue';
import { DocumentNode } from 'graphql';
import { pipe, subscribe, onEnd } from 'wonka';
import {
  CombinedError,
  OperationContext,
  Operation,
  Client,
  createRequest,
  GraphQLRequest,
} from '@urql/core';
import { initialState, noop } from './constants';

export interface UseSubscriptionArgs<V> {
  query: DocumentNode | string;
  variables?: V;
  pause?: boolean;
  context?: Partial<OperationContext>;
}

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export interface UseSubscriptionState<T> {
  fetching: boolean;
  stale: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
  operation?: Operation;
  resume: () => void;
  pause: () => void;
  executeSubscription: () => void;
}

export type UseSubscriptionResponse<T> = UseSubscriptionState<T>;

export function useSubscription<T = any, R = T, V = object>(
  args: UseSubscriptionArgs<V>,
  handler?: SubscriptionHandler<T, R>
): UseSubscriptionResponse<T> {
  const client = inject('$urql') as Client;

  if (process.env.NODE_ENV !== 'production' && !client) {
    throw new Error(
      'Cannot detect urql Client, did you forget to call `useClient`?'
    );
  }

  const result: Ref<UseSubscriptionState<T>> = ref({
    ...initialState,
    resume: noop,
    pause: noop,
    executeSubscription: noop,
  });

  const subHandler: Ref<SubscriptionHandler<T, R> | undefined> = ref(handler);
  const request: Ref<GraphQLRequest | undefined> = ref();
  const unsubscribe: Ref<null | (() => void)> = ref(null);

  const executeSubscription = (opts?: Partial<OperationContext>) => {
    if (unsubscribe.value) unsubscribe.value();

    result.value.fetching = true;

    unsubscribe.value = pipe(
      client.executeSubscription(request.value as GraphQLRequest, {
        ...args.context,
        ...opts,
      }),
      onEnd(() => {
        result.value.fetching = false;
      }),
      subscribe(operationResult => {
        result.value.fetching = true;
        (result.value.data =
          typeof subHandler.value === 'function'
            ? subHandler.value(result.value.data as any, operationResult.data)
            : operationResult.data),
          (result.value.error = operationResult.error);
        result.value.extensions = operationResult.extensions;
        result.value.stale = !!operationResult.stale;
        result.value.operation = operationResult.operation;
      })
    ).unsubscribe;
  };

  if (!args.pause) {
    watch(request, (_value, _oldValue, onInvalidate) => {
      onInvalidate(() => {
        if (typeof unsubscribe.value === 'function') {
          unsubscribe.value();
          unsubscribe.value = null;
        }
      });

      if (!args.pause) {
        executeSubscription();
      }
    });
  }

  request.value = createRequest(args.query, args.variables || {});

  onMounted(() => {
    if (!args.pause) executeSubscription();
  });

  result.value.pause = function pause() {
    if (typeof unsubscribe.value === 'function') {
      unsubscribe.value();
      unsubscribe.value = null;
    }
  };

  result.value.resume = function resume() {
    if (!args.pause) executeSubscription();
  };

  return result.value;
}

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

export interface UseSubscriptionArgs<V> {
  query: DocumentNode | string;
  variables?: V;
  pause?: boolean;
  context?: Partial<OperationContext>;
}

export type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;

export interface UseSubscriptionState<T> {
  fetching: Ref<boolean>;
  stale: Ref<boolean>;
  data: Ref<T | undefined>;
  error: Ref<CombinedError | undefined>;
  extensions: Ref<Record<string, any> | undefined>;
  operation: Ref<Operation | undefined>;
  isPaused: Ref<boolean>;
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

  const data: Ref<T | undefined> = ref();
  const stale: Ref<boolean> = ref(false);
  const fetching: Ref<boolean> = ref(false);
  const error: Ref<CombinedError | undefined> = ref();
  const operation: Ref<Operation | undefined> = ref();
  const extensions: Ref<Record<string, any> | undefined> = ref();

  const subHandler: Ref<SubscriptionHandler<T, R> | undefined> = ref(handler);
  const request: Ref<GraphQLRequest> = ref(
    createRequest(args.query, args.variables || {})
  );
  const isPaused: Ref<boolean> = ref(!!args.pause);
  const unsubscribe: Ref<null | (() => void)> = ref(null);

  const executeSubscription = (opts?: Partial<OperationContext>) => {
    if (unsubscribe.value) unsubscribe.value();

    fetching.value = true;

    unsubscribe.value = pipe(
      client.executeSubscription(request.value as GraphQLRequest, {
        ...args.context,
        ...opts,
      }),
      onEnd(() => {
        fetching.value = false;
      }),
      subscribe(operationResult => {
        fetching.value = true;
        (data.value =
          typeof subHandler.value === 'function'
            ? subHandler.value(data.value as any, operationResult.data)
            : operationResult.data),
          (error.value = operationResult.error);
        extensions.value = operationResult.extensions;
        stale.value = !!operationResult.stale;
        operation.value = operationResult.operation;
      })
    ).unsubscribe;
  };

  if (!isPaused.value) {
    watch(request, (_value, _oldValue, onInvalidate) => {
      onInvalidate(() => {
        if (typeof unsubscribe.value === 'function') {
          unsubscribe.value();
          unsubscribe.value = null;
        }
      });

      if (!isPaused.value) {
        executeSubscription();
      }
    });
  }

  const req = createRequest(args.query, args.variables || {});
  if (req.key !== request.value.key) request.value = req;

  onMounted(() => {
    if (isPaused.value) executeSubscription();
  });

  watch(isPaused, (_value, prevValue) => {
    if (isPaused.value || prevValue) {
      if (typeof unsubscribe.value === 'function') {
        unsubscribe.value();
        unsubscribe.value = null;
      }
    }

    if (!isPaused.value) {
      executeSubscription();
    }
  });

  function pause() {
    isPaused.value = true;
  }

  function resume() {
    isPaused.value = false;
  }

  return {
    data,
    stale,
    error,
    operation,
    extensions,
    fetching,
    executeSubscription,
    isPaused,
    pause,
    resume,
  };
}

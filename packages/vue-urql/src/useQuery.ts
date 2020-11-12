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
  fetching: Ref<boolean>;
  stale: Ref<boolean>;
  data: Ref<T | undefined>;
  error: Ref<CombinedError | undefined>;
  extensions: Ref<Record<string, any> | undefined>;
  operation: Ref<Operation | undefined>;
  resume: () => void;
  pause: () => void;
  isPaused: Ref<boolean>;
  executeQuery: () => void;
}

export type UseQueryResponse<T> = UseQueryState<T> & {
  then: () => Promise<UseQueryState<T>>;
};

export function useQuery<T = any, V = object>(
  args: UseQueryArgs<V>
): UseQueryResponse<T> {
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

  const request: Ref<GraphQLRequest> = ref(
    createRequest(args.query, args.variables || {})
  );

  const unsubscribe: Ref<null | (() => void)> = ref(null);

  const isPaused: Ref<boolean> = ref(!!args.pause);

  const executeQuery = () => {
    fetching.value = true;

    unsubscribe.value = pipe(
      client.executeQuery(request.value as GraphQLRequest, args.context),
      onEnd(() => {
        fetching.value = false;
      }),
      subscribe(res => {
        data.value = res.data;
        stale.value = !!res.stale;
        fetching.value = false;
        error.value = res.error;
        operation.value = res.operation;
        extensions.value = res.extensions;
      })
    ).unsubscribe;
  };

  if (isPaused.value) {
    watch(request, (_value, _oldValue, onInvalidate) => {
      onInvalidate(() => {
        if (typeof unsubscribe.value === 'function') {
          unsubscribe.value();
          unsubscribe.value = null;
        }
      });

      if (isPaused.value) {
        executeQuery();
      }
    });
  }

  const req = createRequest(args.query, args.variables || {});
  if (req.key !== request.value.key) request.value = req;

  let fetchOnMount = true;
  onMounted(() => {
    // Checks for synchronous data in the cache.
    pipe(
      client.executeQuery(request.value as GraphQLRequest),
      onPush(res => {
        data.value = res.data;
        stale.value = !!res.stale;
        fetching.value = false;
        error.value = res.error;
        operation.value = res.operation;
        extensions.value = res.extensions;
      }),
      publish
    ).unsubscribe();

    if (!isPaused.value && fetchOnMount) executeQuery();
  });

  watch(isPaused, (_value, prevValue) => {
    if (isPaused.value || prevValue) {
      if (typeof unsubscribe.value === 'function') {
        unsubscribe.value();
        unsubscribe.value = null;
      }
    }

    if (!isPaused.value) {
      executeQuery();
    }
  });

  function pause() {
    isPaused.value = true;
  }

  function resume() {
    isPaused.value = false;
  }

  const result = {
    data,
    stale,
    error,
    operation,
    extensions,
    fetching,
    executeQuery,
    isPaused,
    pause,
    resume,
  };

  return {
    ...result,
    async then() {
      fetchOnMount = false;

      const res = await client
        .query(args.query, args.variables || {}, args.context)
        .toPromise();

      data.value = res.data;
      stale.value = !!res.stale;
      fetching.value = false;
      error.value = res.error;
      operation.value = res.operation;
      extensions.value = res.extensions;

      return result;
    },
  };
}

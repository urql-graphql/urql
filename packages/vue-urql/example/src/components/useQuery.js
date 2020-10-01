import { inject, ref, watch, onMounted } from 'vue-demi';
import { pipe, subscribe, onEnd } from 'wonka';
import { createRequest } from '@urql/core';

const initialState = {
  fetching: false,
  stale: false,
  error: undefined,
  data: undefined,
  extensions: undefined,
  operation: undefined,
};

export function useQuery(
  args
) {
  const client = inject('$urql');

  const result = ref(initialState);
  const request = ref(createRequest(args.query, args.variables || {}));
  const unsubscribe = ref(null);

  const executeQuery = () => {
    if (typeof unsubscribe.value === 'function') {
      unsubscribe.value();
      unsubscribe.value = null;
    }
    result.value.fetching = true;

    // TODO: we can have a synchronous result
    unsubscribe.value = pipe(
      client.executeQuery(request.value, args.context),
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
  };

  if (!args.pause) {
    onMounted(() => {
      executeQuery();
    });

    watch(request, () => {
      request.value = createRequest(args.query, args.variables || {});
      executeQuery();
    });
  }

  return {
    ...result,
    resume() {
      executeQuery();
    },
    pause() {
      if (typeof unsubscribe.value === 'function') {
        unsubscribe.value();
        unsubscribe.value = null;
      }
    }
  }
}

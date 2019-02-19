import { DocumentNode } from 'graphql';
import { useCallback, useContext, useEffect, useState } from 'react';
import { pipe, subscribe } from 'wonka';
import { Context } from '../context';
import { OperationContext, RequestPolicy } from '../types';
import { CombinedError, createRequest, noop } from '../utils';

interface UseQueryArgs<V> {
  query: string | DocumentNode;
  variables?: V;
  requestPolicy?: RequestPolicy;
}

interface UseQueryState<T> {
  fetching: boolean;
  data?: T;
  error?: CombinedError;
}

type UseQueryResponse<T> = [
  UseQueryState<T>,
  (opts?: Partial<OperationContext>) => void
];

export const useQuery = <T = any, V = object>(
  args: UseQueryArgs<V>
): UseQueryResponse<T> => {
  let unsubscribe = noop;

  const client = useContext(Context);
  const request = createRequest(args.query, args.variables as any);

  const [state, setState] = useState<UseQueryState<T>>({
    fetching: false,
    error: undefined,
    data: undefined,
  });

  const executeQuery = useCallback(
    (opts?: Partial<OperationContext>) => {
      unsubscribe();
      setState(s => ({ ...s, fetching: true }));

      const [teardown] = pipe(
        client.executeQuery(request, {
          requestPolicy: args.requestPolicy,
          ...opts,
        }),
        subscribe(({ data, error }) =>
          setState({ fetching: false, data, error })
        )
      );

      unsubscribe = teardown;
    },
    [request.key]
  );

  useEffect(() => {
    executeQuery();
    return unsubscribe;
  }, [request.key]);

  return [state, executeQuery];
};

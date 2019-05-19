import { DocumentNode } from 'graphql';
import { useCallback, useContext, useEffect, useState } from 'react';
import { pipe, subscribe } from 'wonka';
import { Context } from '../context';
import { OperationContext, RequestPolicy } from '../types';
import { CombinedError, createRequest, noop } from '../utils';

export interface UseQueryArgs<V> {
  query: string | DocumentNode;
  variables?: V;
  requestPolicy?: RequestPolicy;
  skip?: boolean;
}

export interface UseQueryState<T> {
  fetching: boolean;
  data?: T;
  error?: CombinedError;
}

export type UseQueryResponse<T> = [
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

      let teardown = noop;

      if (!args.skip) {
        [teardown] = pipe(
          client.executeQuery(request, {
            requestPolicy: args.requestPolicy,
            ...opts,
          }),
          subscribe(({ data, error }) =>
            setState({ fetching: false, data, error })
          )
        );
      } else {
        setState(s => ({ ...s, fetching: false }));
      }

      unsubscribe = teardown;
    },
    [request.key, args.skip, args.requestPolicy]
  );

  useEffect(() => {
    executeQuery();
    return unsubscribe;
  }, [request.key, args.skip]);

  return [state, executeQuery];
};

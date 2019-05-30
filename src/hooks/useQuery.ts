import { DocumentNode } from 'graphql';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  const isMounted = useRef(true);
  const unsubscribe = useRef<() => void>(noop);

  const client = useContext(Context);
  const request = useMemo(
    () => createRequest(args.query, args.variables as any),
    [args]
  );

  const [state, setState] = useState<UseQueryState<T>>({
    fetching: false,
    error: undefined,
    data: undefined,
  });

  const executeQuery = useCallback(
    (opts?: Partial<OperationContext>) => {
      unsubscribe.current();
      setState(s => ({ ...s, fetching: true }));

      const [teardown] = pipe(
        client.executeQuery(request, {
          requestPolicy: args.requestPolicy,
          ...opts,
        }),
        subscribe(
          ({ data, error }) =>
            isMounted.current && setState({ fetching: false, data, error })
        )
      );

      unsubscribe.current = teardown;
    },
    [request.key]
  );

  useEffect(() => {
    executeQuery();

    return () => {
      isMounted.current = false;
      unsubscribe.current();
    };
  }, [request.key]);

  return [state, executeQuery];
};

import { useContext, useEffect, useState } from 'react';
import { pipe, subscribe } from 'wonka';
import { Context } from '../context';
import { CombinedError, createQuery } from '../lib';

interface UseQueryArgs {
  query: string;
  variables?: any;
}

interface UseQueryState<T> {
  fetching: boolean;
  data?: T;
  error?: CombinedError;
}

type UseQueryResponse<T> = [UseQueryState<T>, () => void];

export const useQuery = <T = any>(args: UseQueryArgs): UseQueryResponse<T> => {
  let unsubscribe: () => void | undefined;
  const client = useContext(Context);
  const [state, setState] = useState<UseQueryState<T>>({
    fetching: false,
    error: undefined,
    data: undefined,
  });

  const executeUnsubscribe = () => {
    if (unsubscribe !== undefined) {
      unsubscribe();
    }
  };

  const executeQuery = () => {
    executeUnsubscribe();
    setState(s => ({ ...s, fetching: true }));

    unsubscribe = pipe(
      client.executeQuery(createQuery(args.query, args.variables)),
      subscribe(({ data, error }) => setState({ fetching: false, data, error }))
    )[0];
  };

  useEffect(() => {
    executeQuery();
    return () => executeUnsubscribe();
  }, [args.query, args.variables]);

  // executeQuery === refetch
  return [state, executeQuery];
};

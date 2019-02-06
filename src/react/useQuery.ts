import { useContext, useEffect, useState } from 'react';
import { pipe, subscribe } from 'wonka';
import { CombinedError, createQuery } from '../lib';
import { Context } from './context';

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
    setState({ ...state, fetching: true });

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

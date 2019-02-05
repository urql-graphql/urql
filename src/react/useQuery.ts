import { useContext, useEffect, useState } from 'react';
import { pipe, subscribe } from 'wonka';
import { createQuery } from '../lib';
import { Context } from './context';

interface UseQueryArgs {
  query: string;
  variables: any;
}

export const useQuery = (args: UseQueryArgs) => {
  let unsubscribe: () => void | undefined;
  const client = useContext(Context);
  const [state, setState] = useState({
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

  useEffect(
    () => {
      executeQuery();
      return () => executeUnsubscribe();
    },
    [args.query, args.variables]
  );

  // executeQuery === refetch
  return [state, executeQuery];
};

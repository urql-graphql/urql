import { useContext, useEffect, useState } from 'react';
import { pipe, subscribe } from 'wonka';
import { CombinedError, createQuery } from '../lib';
import { Context } from './context';

interface UseSubscriptionArgs {
  query: string;
  variables: any;
}

interface UseSubscriptionState {
  fetching: boolean;
  data?: any;
  error?: CombinedError;
}

export const useSubscription = (args: UseSubscriptionArgs) => {
  let unsubscribe: () => void | undefined;
  const client = useContext(Context);
  const [state, setState] = useState<UseSubscriptionState>({
    fetching: false,
    error: undefined,
    data: undefined,
  });

  const executeUnsubscribe = () => {
    if (unsubscribe !== undefined) {
      unsubscribe();
    }
  };

  const executeSubscription = () => {
    executeUnsubscribe();
    setState({ ...state, fetching: true });

    unsubscribe = pipe(
      client.executeQuery(createQuery(args.query, args.variables)),
      subscribe(({ data, error }) => setState({ fetching: false, data, error }))
    )[0];
  };

  useEffect(
    () => {
      executeSubscription();
      return () => executeUnsubscribe();
    },
    [args.query, args.variables]
  );

  // executeQuery === refetch
  return [state, executeSubscription];
};

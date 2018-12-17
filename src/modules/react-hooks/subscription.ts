// @ts-ignore
import { useCallback, useMemo, useState, useEffect, useContext } from 'react';
import { context } from '../../components/context';
import { ISubscriptionHook } from '../../interfaces/index';
import Client from '../client';

export function useSubscription<Data>(
  query: string,
  variables?: Object
): ISubscriptionHook<Data> {
  const COMPARISON = [query, variables];

  const client: Client = useContext(context);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);

  let connection;

  // Fetch the query
  useEffect(() => {
    if (connection) {
      connection.unsubscribe();
      connection = null;
    }

    connection = client.executeSubscription$({ query, variables }).subscribe({
      complete: () => {
        this.subscriptionSub = null;
      },
      error: e => {
        this.subscriptionSub = null;
        setError(e);
        setFetching(false);
      },
      next: result => {
        setData(result.data || null);
        setError(result.error || null);
        setFetching(false);
        setLoaded(true);
      },
    });
  }, COMPARISON);

  return { data, loaded, error, fetching };
}

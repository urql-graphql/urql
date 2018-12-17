import ReactDOM from 'react-dom';
// @ts-ignore
import { useCallback, useMemo, useState, useEffect, useContext } from 'react';
import Client from '../client';
import { context } from '../../components/context';
import {
  ClientEventType,
  FetchOptions,
  IQueryHook,
  IQueryHookOpts,
} from '../../interfaces/index';

// return state of a query fetch
export function useQuery<Data>(
  query: string,
  { variables }: IQueryHookOpts = {}
): IQueryHook<Data> {
  const COMPARISON = [query, variables];

  const client: Client = useContext(context);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // query keys are stored for comparing against mutation calls
  const queryKeys = {};

  // These are bound to unsubscribe functions to be used in the callback of useEffect
  // during the unmounting phase.
  let subscription;
  let clientUnsubscribe;

  const fetch = useCallback((options: FetchOptions = {}) => {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }

    subscription = client
      .executeQuery$({ query, variables }, !!options.skipCache)
      .subscribe({
        complete: () => {
          subscription = null;
        },
        error: e => {
          subscription = null;
          ReactDOM.unstable_batchedUpdates(() => {
            setError(e);
            setFetching(false);
          });
        },
        next: result => {
          // Store the result's key
          queryKeys[result.operation.key] = true;

          // Update data
          ReactDOM.unstable_batchedUpdates(() => {
            setData(result.data || null);
            setError(result.error);
            setFetching(false);
            setLoaded(true);
          });
        },
      });
  }, COMPARISON);

  clientUnsubscribe = useMemo(
    () =>
      client.subscribe((type: ClientEventType, payload) => {
        // Since fetch goes through all exchanges (including a cacheExchange) fetching
        // can also just result in an update of the component's data without an actual
        // fetch call
        let shouldRefetch = false;

        if (type === ClientEventType.RefreshAll) {
          shouldRefetch = true;
        } else if (type === ClientEventType.CacheKeysInvalidated) {
          shouldRefetch = payload.some(key => queryKeys[key] === true);
        }

        if (shouldRefetch) {
          fetch();
        }
      }),
    COMPARISON
  );

  useEffect(() => {
    fetch();

    return () => {
      subscription.unsubscribe();
      clientUnsubscribe && clientUnsubscribe();
    };
  }, COMPARISON);

  return { data, loaded, error, fetching, refetch: fetch };
}

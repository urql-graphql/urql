// @ts-ignore
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { context } from '../components/context';
import { CombinedError } from '../lib';
import {
  Client,
  ExchangeResult,
  HookFetchOptions,
  QueryHook,
  QueryHookOpts,
} from '../types';

const DEFAULT_RESPONSE = {
  fetching: true,
  error: null,
  data: null,
  loaded: false,
};

interface Response<Data> {
  fetching: boolean;
  error?: Error | CombinedError;
  data?: Data;
  loaded: boolean;
}

type ResponseState<Data> = [Response<Data>, (response: Response<Data>) => void];

// return state of a query fetch
export function useQuery<Data>(
  query: string,
  { variables }: QueryHookOpts = {}
): QueryHook<Data> {
  const COMPARISON = [query, variables];

  const client = (useContext(context) as any) as Client;

  const [response, setResponse] = useState(DEFAULT_RESPONSE) as ResponseState<
    Data
  >;

  // These are bound to unsubscribe functions to be used in the callback of useEffect
  // during the unmounting phase.
  let clientInstance;

  const fetch = useCallback((options: HookFetchOptions = {}) => {
    clientInstance = client.createInstance({
      onChange: stream => {
        setResponse({
          ...stream,
          loaded: stream.fetching === false,
        });
      },
    });

    clientInstance.executeQuery({ query, variables }, !!options.skipCache);
  }, COMPARISON);

  useEffect(() => {
    fetch();

    return () => {
      if (clientInstance) {
        clientInstance.unsubscribe();
      }
    };
  }, COMPARISON);

  return { ...response, refetch: fetch };
}

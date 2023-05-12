'use client';

import React from 'react';
import { useDataHydrationContext } from './DataHydrationContext';
import { ssrContext } from './Provider';

export const symbolString = 'urql_transport';
export const urqlTransportSymbol = Symbol.for(symbolString);

export function useUrqlValue(
  operationKey: number,
  value?: { data: any; error: any }
): void {
  const ssrExchange = React.useContext(ssrContext);
  const rehydrationContext = useDataHydrationContext();

  if (!ssrExchange) {
    throw new Error('forgot to pass an "ssrExchange" to the UrqlProvider.');
  }

  if (typeof window == 'undefined') {
    if (rehydrationContext && value) {
      rehydrationContext.operationValuesByKey[operationKey] = value;
    }
  } else {
    const stores = (window[urqlTransportSymbol as any] ||
      []) as unknown as Array<{
      rehydrate: Record<number, { data: any; error: any }>;
    }>;
    const store = stores.find(
      x => x && x.rehydrate && x.rehydrate[operationKey]
    );
    if (store) {
      const result = store.rehydrate && store.rehydrate[operationKey];
      if (result) {
        ssrExchange.restoreData({
          [operationKey]: {
            data: JSON.stringify(result.data),
            error: result.error,
          },
        });
        delete store.rehydrate[operationKey];
      }
    }
  }
}

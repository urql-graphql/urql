'use client';

import React from 'react';
import { useDataHydrationContext } from './DataHydrationContext';
import { SSRContext } from './Provider';

export const symbolString = 'urql_transport';
export const urqlTransportSymbol = Symbol.for(symbolString);

export type UrqlResult = { data: any; error: any };

export function useUrqlValue(operationKey: number, value?: UrqlResult): void {
  const ssrExchange = React.useContext(SSRContext);
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
      rehydrate: Record<number, UrqlResult>;
    }>;

    const store = stores.find(
      x => x && x.rehydrate && x.rehydrate[operationKey]
    );
    if (store) {
      const result = store.rehydrate && store.rehydrate[operationKey];
      if (result) {
        delete store.rehydrate[operationKey];
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

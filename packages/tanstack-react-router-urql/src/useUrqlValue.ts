import * as React from 'react';
import { SSRContext } from './Provider';
import { useRouter } from '@tanstack/react-router';
import type { SerializedResult } from 'urql';

function getStreamKey(operationKey: number) {
  return `__URQL__${operationKey}`;
}

function useSsrExchange() {
  const ssrExchange = React.useContext(SSRContext);

  if (!ssrExchange) {
    throw new Error(
      'Missing "UrqlProvider" component as a parent or did not pass in an "ssrExchange" to the Provider.'
    );
  }
  return ssrExchange;
}

export function useStreamUrqlValue(operationKey: number): void {
  const ssrExchange = useSsrExchange();
  const router = useRouter();
  if (typeof window === 'undefined') {
    const data = ssrExchange.extractData();
    if (data[operationKey]) {
      router.streamValue(getStreamKey(operationKey), data[operationKey]);
    }
  }
}

export function useGetStreamedUrqlValue(operationKey: number): void {
  const ssrExchange = useSsrExchange();
  const router = useRouter();

  if (typeof window !== 'undefined') {
    const result = router.getStreamedValue(
      getStreamKey(operationKey)
    ) as SerializedResult;
    if (result) {
      ssrExchange.restoreData({
        [operationKey]: result,
      });
    }
  }
}

import { pipe, toPromise, filter, tap } from 'wonka';
import { ExchangeIO } from 'urql';

export const offlineExchange = ({ client, forward }): ExchangeIO => {
  let status = navigator.onLine ? 'online' : 'offline';
  let loading = false;
  const queue = [];

  const emptyQueue = async () => {
    let operation;
    loading = true;
    while ((operation = queue.shift())) {
      await pipe(
        client.executeRequestOperation(operation),
        toPromise
      );
    }
    loading = false;
  };

  const updateQueue = op => {
    if (op.operationName === 'mutation') {
      queue.push({
        ...op,
        context: {
          ...op.context,
          requestPolicy: 'network-only',
        },
      });
    }
  };

  window.addEventListener('online', () => {
    status = 'online';
    emptyQueue();
  });

  window.addEventListener('offline', () => {
    status = 'offline';
  });

  return operations$ => {
    return pipe(
      operations$,
      tap(op => {
        if (status === 'offline') updateQueue(op);
      }),
      // TODO: find a way to buffer until online
      filter(() => status === 'online'),
      forward
    );
  };
};

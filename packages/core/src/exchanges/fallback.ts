import { filter, pipe, tap } from 'wonka';
import { Operation, ExchangeIO } from '../types';

/** This is always the last exchange in the chain; No operation should ever reach it */
export const fallbackExchange: ({ client: Client }) => ExchangeIO = ({
  client,
}) => ops$ =>
  pipe(
    ops$,
    tap<Operation>(operation => {
      if (
        operation.operationName !== 'teardown' &&
        process.env.NODE_ENV !== 'production'
      ) {
        const message = `No exchange has handled operations of type "${operation.operationName}". Check whether you've added an exchange responsible for these operations.`;

        client.debugTarget!.dispatchEvent({
          type: 'fallbackCatch',
          message,
          operation,
        });
        console.warn(message);
      }
    }),
    /* All operations that skipped through the entire exchange chain should be filtered from the output */
    filter<any>(() => false)
  );

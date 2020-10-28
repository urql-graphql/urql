import { filter, pipe, tap } from 'wonka';
import { Operation, ExchangeIO, ExchangeInput } from '../types';
import { noop } from '../utils';

/** This is always the last exchange in the chain; No operation should ever reach it */
export const fallbackExchange: ({
  dispatchDebug,
}: Pick<ExchangeInput, 'dispatchDebug'>) => ExchangeIO = ({
  dispatchDebug,
}) => ops$ =>
  pipe(
    ops$,
    tap<Operation>(operation => {
      if (
        operation.kind !== 'teardown' &&
        process.env.NODE_ENV !== 'production'
      ) {
        const message = `No exchange has handled operations of kind "${operation.kind}". Check whether you've added an exchange responsible for these operations.`;

        dispatchDebug({
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

export const fallbackExchangeIO: ExchangeIO = fallbackExchange({
  dispatchDebug: noop,
});

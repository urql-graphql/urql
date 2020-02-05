import { filter, pipe, tap } from 'wonka';
import { ExchangeIO, Operation } from '../types';

/** This is always the last exchange in the chain; No operation should ever reach it */
export const fallbackExchangeIO: ExchangeIO = ops$ =>
  pipe(
    ops$,
    tap<Operation>(({ operationName }) => {
      if (
        operationName !== 'teardown' &&
        process.env.NODE_ENV !== 'production'
      ) {
        console.warn(
          `No exchange has handled operations of type "${operationName}". Check whether you've added an exchange responsible for these operations.`
        );
      }
    }),
    /* All operations that skipped through the entire exchange chain should be filtered from the output */
    filter<any>(() => false)
  );

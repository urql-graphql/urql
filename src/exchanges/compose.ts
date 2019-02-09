import { empty, map, pipe, Source } from 'wonka';

import { Client } from '../lib/client';
import { Exchange, ExchangeIO, OperationResult } from '../types';

/** This is always the last exchange in the chain; No operation should ever reach it */
const fallbackIO: ExchangeIO = ops$ =>
  pipe(
    ops$,
    map(operation => {
      const { operationName } = operation;
      if (
        operationName !== 'teardown' &&
        process.env.NODE_ENV !== 'production'
      ) {
        console.warn(
          `No exchange has handled operations of type "${operationName}". Check whether you've added an exchange responsible for these operations.`
        );
      }

      return { operation } as OperationResult;
    })
  );

/** This composes an array of Exchanges into a single ExchangeIO function */
export const composeExchanges = (
  client: Client,
  exchanges: Exchange[]
): ExchangeIO => {
  const noopForward = () => empty as Source<OperationResult>;

  return exchanges.reduceRight((forward, exchange) => {
    return exchange({ client, forward });
  }, fallbackIO);
};

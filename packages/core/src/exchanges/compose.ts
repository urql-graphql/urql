import { Exchange, ExchangeInput } from '../types';

/** This composes an array of Exchanges into a single ExchangeIO function */
export const composeExchanges = (exchanges: Exchange[]) => ({
  client,
  forward,
  dispatchDebug,
}: ExchangeInput) =>
  exchanges.reduceRight(
    (forward, exchange) =>
      exchange({
        client,
        forward,
        dispatchDebug(event) {
          dispatchDebug({
            timestamp: Date.now(),
            source: exchange.name,
            ...event,
          });
        },
      }),
    forward
  );

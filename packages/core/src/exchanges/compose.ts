import { Exchange, ExchangeInput } from '../types';

/** This composes an array of Exchanges into a single ExchangeIO function */
export const composeExchanges = (exchanges: Exchange[]) => ({
  client,
  forward,
}: Omit<ExchangeInput, 'dispatchDebug'>) => {
  let id = 0;

  return exchanges.reduceRight(
    (forward, exchange) =>
      exchange({
        client,
        forward,
        dispatchDebug: e =>
          client.debugTarget!.dispatchEvent({
            ...e,
            id: id++,
            timestamp: Date.now(),
            source: exchange.name,
          }),
      }),
    forward
  );
};

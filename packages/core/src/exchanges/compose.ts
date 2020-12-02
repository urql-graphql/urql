import { Exchange, ExchangeInput } from '../types';

/** This composes an array of Exchanges into a single ExchangeIO function */
export const composeExchanges = (exchanges: Exchange[]) => ({
  client,
  forward,
  dispatchDebug,
}: ExchangeInput) => {
  let i = exchanges.length;
  while (i--) {
    forward = exchanges[i]({
      client,
      forward,
      dispatchDebug(event) {
        dispatchDebug({
          timestamp: Date.now(),
          source: exchanges[i].name,
          ...event,
        });
      },
    });
  }

  return forward;
}

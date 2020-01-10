import { Exchange } from '../types';

/** This composes an array of Exchanges into a single ExchangeIO function */
export const composeExchanges = (exchanges: Exchange[]): Exchange => {
  if (exchanges.length === 1) {
    return exchanges[0];
  }

  return payload => {
    return exchanges.reduceRight((forward, exchange) => {
      return exchange({ client: payload.client, forward });
    }, payload.forward);
  };
};

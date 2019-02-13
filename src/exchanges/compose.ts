import { Exchange } from '../types';

/** This composes an array of Exchanges into a single ExchangeIO function */
export const composeExchanges = (exchanges: Exchange[]): Exchange => {
  return ({ client, forward: outerForward }) => {
    return exchanges.reduceRight((forward, exchange) => {
      return exchange({ client, forward });
    }, outerForward);
  };
};

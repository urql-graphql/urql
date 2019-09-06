import { ExchangeIO } from 'urql';

export const persistCacheExchange = () => ({ forward, client }): ExchangeIO => {
  return ops$ => forward(ops$);
};

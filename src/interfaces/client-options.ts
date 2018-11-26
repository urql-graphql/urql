import { Cache } from './cache';
import { Exchange } from './exchange';

export interface ClientOptions {
  url: string;
  fetchOptions?: object | (() => object);
  cache?: Cache;
  initialCache?: object;
  transformExchange?: (IExchange, IClient) => Exchange;
}

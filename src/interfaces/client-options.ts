import { ICache } from './cache';
import { IExchange } from './exchange';

export interface IClientOptions {
  url: string;
  fetchOptions?: object | (() => object);
  cache?: ICache;
  initialCache?: object;
  transformExchange?: (IExchange, IClient) => IExchange;
}

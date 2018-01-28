import { ICache } from './cache';

export interface IClientOptions {
  url: string;
  fetchOptions?: object | (() => object);
  cache?: ICache;
  initialCache?: object;
}

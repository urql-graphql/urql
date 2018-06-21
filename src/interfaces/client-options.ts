import { ICache } from './cache';

export interface IClientOptions {
  url: string;
  fetch?: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  fetchOptions?: object | (() => object);
  cache?: ICache;
  initialCache?: object;
}

import Observable from 'zen-observable-ts';

import { ICache } from './cache';
import { IExchangeResult } from './exchange';
import { IQuery } from './query';
import { IClientEvent } from '../modules/events';

export interface IClient {
  cache: ICache;
  executeSubscription$(subscriptionObject: IQuery): Observable<IExchangeResult>;
  executeQuery$(
    queryObject: IQuery,
    skipCache: boolean
  ): Observable<IExchangeResult>;
  executeQuery(
    queryObject: IQuery,
    skipCache: boolean
  ): Promise<IExchangeResult>;
  executeMutation$(mutationObject: IQuery): Observable<IExchangeResult['data']>;
  executeMutation(mutationObject: IQuery): Promise<IExchangeResult['data']>;
  invalidateQuery(queryObject: IQuery): Promise<void>;
  refreshAllFromCache(): void;
  subscribe(callback: (event: IClientEvent) => void): () => void;
}

import Observable from 'zen-observable-ts';

import { ICache } from './cache';
import { ClientEvent } from './events';
import { IExchangeResult } from './exchange';
import { IQuery } from './query';

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
  subscribe(callback: (event: ClientEvent) => void): () => void;
}

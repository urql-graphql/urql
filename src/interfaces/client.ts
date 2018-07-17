import Observable from 'zen-observable-ts';

import { IClientEvent } from '../modules/events';
import { ICache } from './cache';
import { IExchangeResult, IExecutionData } from './exchange';
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
  executeMutation$(mutationObject: IQuery): Observable<IExecutionData>;
  executeMutation(mutationObject: IQuery): Promise<IExecutionData>;
  invalidateQuery(queryObject: IQuery): Promise<void>;
  refreshAllFromCache(): void;
  subscribe(callback: (event: IClientEvent) => void): () => void;
}

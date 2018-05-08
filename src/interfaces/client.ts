import Observable from 'zen-observable-ts';

import { ICache } from './cache';
import { IExchangeResult } from './exchange';
import { IQuery } from './query';

export interface IClient {
  cache: ICache;
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
  refreshAllFromCache(): void;
  subscribe(
    callback: (changedTypes: string[], reponse: object) => void
  ): () => void;
}
